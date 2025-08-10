/**
 * Telemetry SDK（骨架）
 * - 采集：page/event/error/perf/api
 * - 批量上报：createTelemetryTaskQueue
 * - 离线缓存/采样/远程配置预留
 */
import { createTelemetryTaskQueue, TaskQueue } from '@/utils/TaskQueue'

type TelemetryType = 'page' | 'event' | 'error' | 'perf' | 'api'

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

interface InitOptions {
  app: string
  release?: string
  endpoint: string
  user?: { id?: string | number; role?: string }
  sampleRate?: number // 0~1
}

class TelemetryClient {
  private endpoint = '/api/telemetry/batch'
  private app = 'app'
  private release = 'dev'
  private user?: { id?: string | number; role?: string }
  private sampleRate = 1
  private queue: TaskQueue<Response>
  private buffer: BaseEvent[] = []

  constructor() {
    this.queue = createTelemetryTaskQueue()
  }

  init(opts: InitOptions) {
    this.endpoint = opts.endpoint
    this.app = opts.app
    this.release = opts.release ?? this.release
    this.user = opts.user
    this.sampleRate = typeof opts.sampleRate === 'number' ? Math.max(0, Math.min(1, opts.sampleRate)) : 1
  }

  setUser(user?: { id?: string | number; role?: string }) {
    this.user = user
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate
  }

  private push(ev: Omit<BaseEvent, 'app' | 'release' | 'user'>) {
    if (!this.shouldSample()) return
    const event: BaseEvent = { ...ev, app: this.app, release: this.release, user: this.user }
    this.buffer.push(event)
    if (this.buffer.length >= 20) this.flush()
  }

  trackPageView(name: string, props?: Record<string, unknown>) {
    this.push({ type: 'page', name, ts: Date.now(), props })
  }

  trackEvent(name: string, props?: Record<string, unknown>) {
    this.push({ type: 'event', name, ts: Date.now(), props })
  }

  trackError(name: string, message: string, stack?: string, fatal = false) {
    this.push({ type: 'error', name, ts: Date.now(), props: { message, stack, fatal } })
  }

  trackPerf(name: string, props: Record<string, unknown>) {
    this.push({ type: 'perf', name, ts: Date.now(), props })
  }

  trackApi(name: string, status: number, durationMs: number, props?: Record<string, unknown>) {
    this.push({ type: 'api', name, ts: Date.now(), props: { status, durationMs, ...(props || {}) } })
  }

  async flush() {
    if (this.buffer.length === 0) return
    const payload = this.buffer.splice(0, this.buffer.length)
    const body = JSON.stringify({ events: payload })
    const task = () => fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
    this.queue.add(task)
    void this.queue.start()
  }
}

export const Telemetry = new TelemetryClient()


