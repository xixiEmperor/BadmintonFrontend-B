/**
 * Telemetry SDK（骨架 → 可直接使用）
 *
 * 能力概览：
 * - 采集事件类型：page/event/error/perf/api
 * - 批量上报：使用专用队列 createTelemetryTaskQueue，低并发 + 超时 + 重试
 * - 采样控制：sampleRate（0~1），默认全量；C 端建议 1%~5%
 * - 扩展点：可接入远程配置、离线缓存（localStorage/IDB）等
 *
 * 最佳实践：
 * - 在 src/main.tsx 调用 Telemetry.init(...) 初始化
 * - 在页面隐藏/卸载时调用 Telemetry.flush() 尽力上报
 * - 在全局 error/unhandledrejection 捕获错误并上报
 *
 * 使用示例（建议在应用入口处）：
 *
 *   Telemetry.init({
 *     app: 'admin-console',
 *     endpoint: '/api/telemetry/batch',
 *     release: (import.meta as any).env?.VITE_APP_VERSION ?? 'dev',
 *     user: { id: 'u_123', role: 'admin' },
 *     sampleRate: 0.05, // 5% 采样
 *   })
 *
 *   // 单页应用路由切换时
 *   Telemetry.trackPageView('VenueManagement')
 *
 *   // 常规埋点事件
 *   Telemetry.trackEvent('OpenBatchStatusModal', { from: 'VenueManagement' })
 *
 *   // API 调用结束后
 *   Telemetry.trackApi('/api/venue/list', 200, 123)
 *
 *   // 捕获错误
 *   Telemetry.trackError('UnhandledError', err.message, err.stack, true)
 *
 * 关键设计说明：
 * - 内部设置 buffer，默认累计 20 条自动 flush，避免频繁请求
 * - 通过 TaskQueue 控制并发、超时与重试，保障弱网场景稳定性
 * - 采样在 push 前进行，避免不必要的 CPU/内存开销
 * - 预留 sessionId 字段与离线缓存扩展点，便于后续增强
 */
import { createTelemetryTaskQueue, TaskQueue } from '@/utils/TaskQueue'

/**
 * 事件类型枚举
 * - page: 页面浏览/路由切换
 * - event: 常规交互事件（点击、打开弹窗等）
 * - error: 错误与异常
 * - perf: 性能指标（如 TTFB、FCP、自定义耗时）
 * - api: 接口调用统计
 */
type TelemetryType = 'page' | 'event' | 'error' | 'perf' | 'api'

/**
 * SDK 内部标准事件载荷
 *
 * 字段说明：
 * - type: 事件类型
 * - name: 事件名称（建议采用业务可读名字或接口路径）
 * - ts: 事件产生的时间戳（毫秒）
 * - props: 事件自定义属性，键值需可 JSON 化
 * - user: 用户信息（可选，便于后端归因分析）
 * - sessionId: 会话 ID（可选，暂未在本文件内注入，预留扩展）
 * - app: 应用名（通过 init 注入）
 * - release: 版本号/发布标识（通过 init 注入）
 */
interface BaseEvent {
  type: TelemetryType
  name: string
  ts: number
  props?: Record<string, unknown>
  user?: { id?: string | number; role?: string }
  sessionId?: string
  app?: string
  release?: string
}

/**
 * 初始化参数
 *
 * - app: 应用名，用于区分不同前端/子系统
 * - release: 发布版本，便于定位问题（如 git commit、语义化版本）
 * - endpoint: 批量上报接口地址
 * - user: 初始用户信息（可在登录后 setUser 更新）
 * - sampleRate: 采样率 0~1，默认 1（全量）
 */
interface InitOptions {
  app: string
  release?: string
  endpoint: string
  user?: { id?: string | number; role?: string }
  sampleRate?: number // 0~1
}

/**
 * 轻量遥测客户端
 *
 * 职责：
 * - 聚合各类埋点为统一格式的事件
 * - 在内存中做简单的事件缓冲与批量上报
 * - 使用通用任务队列进行可靠的网络发送（并发/超时/重试）
 */
class TelemetryClient {
  /** 上报地址，默认 '/api/telemetry/batch'，可在 init 中覆盖 */
  private endpoint = '/api/telemetry/batch'
  /** 应用名，默认 'app'，建议在 init 中传入真实值 */
  private app = 'app'
  /** 版本号/发布标识，默认 'dev' */
  private release = 'dev'
  /** 用户信息（登录后可 setUser 更新） */
  private user?: { id?: string | number; role?: string }
  /** 采样率（0~1），默认 1（全量） */
  private sampleRate = 1
  /** 发送任务队列，负责请求的排队/重试/节流 */
  private queue: TaskQueue<Response>
  /** 简单内存缓冲，累计到一定阈值（20）后触发 flush */
  private buffer: BaseEvent[] = []

  /**
   * 构造函数
   * - 初始化任务队列；队列策略见 `utils/TaskQueue.ts`
   */
  constructor() {
    this.queue = createTelemetryTaskQueue<Response>()
  }

  /**
   * 初始化 SDK 配置
   *
   * 注意：请在应用启动早期调用一次；重复调用会覆盖先前配置
   */
  init(opts: InitOptions) {
    // 初始化必须参数
    this.endpoint = opts.endpoint
    this.app = opts.app
    this.release = opts.release ?? this.release
    this.user = opts.user
    this.sampleRate = typeof opts.sampleRate === 'number' ? Math.max(0, Math.min(1, opts.sampleRate)) : 1
  }

  /**
   * 更新当前用户信息（登录/切换账号后调用）
   */
  setUser(user?: { id?: string | number; role?: string }) {
    this.user = user
  }

  /**
   * 采样决策：返回是否采集本次事件
   */
  private shouldSample(): boolean {
    return Math.random() < this.sampleRate
  }

  /**
   * 将事件写入缓冲区
   * - 会自动注入 `app`、`release`、`user`
   * - 采样未命中则直接丢弃
   * - 当缓冲区长度达到 20 时，触发一次 flush
   */
  private push(ev: Omit<BaseEvent, 'app' | 'release' | 'user'>) {
    if (!this.shouldSample()) return
    const event: BaseEvent = { ...ev, app: this.app, release: this.release, user: this.user }
    this.buffer.push(event)
    if (this.buffer.length >= 20) this.flush()
  }

  /**
   * 页面浏览/路由切换
   * - name: 页面/路由标识（如 'VenueManagement'）
   */
  trackPageView(name: string, props?: Record<string, unknown>) {
    this.push({ type: 'page', name, ts: Date.now(), props })
  }

  /**
   * 常规交互事件（点击、打开弹窗等）
   * - 建议 name 采用业务语义名称，便于后端分析
   */
  trackEvent(name: string, props?: Record<string, unknown>) {
    this.push({ type: 'event', name, ts: Date.now(), props })
  }

  /**
   * 错误事件
   * - name: 错误分组名称（如 'UnhandledError'、'ApiError'）
   * - message/stack: 错误信息与堆栈（如可用）
   * - fatal: 是否为致命错误（会导致页面不可用）
   */
  trackError(name: string, message: string, stack?: string, fatal = false) {
    this.push({ type: 'error', name, ts: Date.now(), props: { message, stack, fatal } })
  }

  /**
   * 性能指标事件
   * - name: 指标名称（如 'FCP'、'TTFB'、'RenderCost'）
   * - props: 指标值/上下文（如 { value: 123 }）
   */
  trackPerf(name: string, props: Record<string, unknown>) {
    this.push({ type: 'perf', name, ts: Date.now(), props })
  }

  /**
   * API 统计事件
   * - name: 接口标识（建议使用实际路径或统一命名）
   * - status: HTTP 状态码
   * - durationMs: 耗时（毫秒）
   * - props: 其它上下文（如 method、requestId 等）
   */
  trackApi(name: string, status: number, durationMs: number, props?: Record<string, unknown>) {
    this.push({ type: 'api', name, ts: Date.now(), props: { status, durationMs, ...(props || {}) } })
  }

  /**
   * 触发批量上报
   * - 将当前缓冲区事件打包为一个请求，加入任务队列发送
   * - 采用“尽力而为”的策略：不等待返回即可继续（避免阻塞主线程）
   * - 建议在页面隐藏/卸载时也调用一次，提升兜底上报成功率
   */
  async flush() {
    if (this.buffer.length === 0) return
    const payload = this.buffer.splice(0, this.buffer.length)
    const body = JSON.stringify({ events: payload })
    const task = () => fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    this.queue.add(task)
    void this.queue.start()
  }
}

/**
 * SDK 单例
 *
 * 说明：
 * - 项目中直接使用 `Telemetry.xxx` 即可，无需自行实例化
 * - 若未来需要多实例（多端/多租户隔离），可导出类并由调用方自行管理实例
 */
export const Telemetry = new TelemetryClient()


