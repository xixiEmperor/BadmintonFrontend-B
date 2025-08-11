/**
 * 🚀 统一高能力任务队列（TypeScript）
 * 
 * 这是一个功能完备的异步任务队列管理器，专为现代 Web 应用设计。
 * 融合了轻量级实现和企业级特性，提供可靠、可观测、可控的任务执行能力。
 * 
 * 📋 核心特性：
 * ✅ 任务执行：支持异步任务的顺序执行、并发控制、自动重试
 * ✅ 优先级：高优先级任务优先执行，支持动态调整
 * ✅ 容错机制：指数退避重试、超时保护、错误处理
 * ✅ 进度监控：实时进度反馈、执行统计、完成度计算
 * ✅ 生命周期：启动/暂停/恢复/停止/销毁完整的生命周期管理
 * ✅ 事件回调：任务完成、队列完成、错误处理等事件钩子
 * ✅ 向后兼容：保持与旧版本 API 的完全兼容
 * 
 * 🎯 设计理念：
 * 1️⃣ 可靠执行：
 *    - 任务失败时按线性指数退避策略重试（retryDelay × 重试次数）
 *    - 支持任务级超时中断，避免长时间阻塞
 *    - AbortController 支持，可随时取消正在执行的任务
 * 
 * 2️⃣ 可观测性：
 *    - 实时进度快照：总数、完成数、失败数、执行中数量
 *    - 执行时间统计：开始时间、结束时间、耗时计算
 *    - 轻量级进度订阅（兼容旧版 API）
 * 
 * 3️⃣ 可控的并发与节流：
 *    - maxConcurrent：控制同时执行的任务数量，避免资源争抢
 *    - requestInterval：任务间隔，防止过于频繁的请求打爆后端
 *    - 优先级队列：确保重要任务优先处理
 * 
 * 4️⃣ 可插拔性：
 *    - onTaskComplete：单个任务完成时的回调处理
 *    - onQueueComplete：整个队列完成时的回调处理
 *    - onError：错误处理回调，支持自定义错误处理逻辑
 *    - onProgress：进度变化回调，支持 UI 实时更新
 * 
 * 💡 典型使用场景：
 * - 批量 API 请求处理（用户数据同步、文件上传等）
 * - 大文件分片上传/下载
 * - 数据库批量操作
 * - 图片批量处理
 * - 监控数据上报
 * - 定时任务调度
 * 
 * 
 * @author BadmintonFrontend Team
 * @version 2.0.0
 * @since 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 任务生命周期状态枚举
 * 
 * 任务在其生命周期中会经历以下状态变化：
 * pending → executing → (completed | failed | retrying)
 * retrying → executing → (completed | failed | retrying)
 * 
 * @enum {string}
 */
export type TaskStatus = 
  | 'pending'    // 🟡 等待执行：任务已加入队列，等待被调度
  | 'executing'  // 🔵 执行中：任务正在执行，占用并发位
  | 'completed'  // 🟢 已完成：任务成功执行完毕
  | 'failed'     // 🔴 已失败：任务执行失败且已达最大重试次数
  | 'retrying'   // 🟠 重试中：任务执行失败，正在等待重试

/**
 * 任务函数签名定义
 * 
 * 这是队列中每个任务必须遵守的函数接口。任务函数是异步的，
 * 支持接收数据参数和取消信号，返回Promise包装的结果。
 * 
 * @template T 任务返回结果的类型，支持泛型以确保类型安全
 * @param data 任务执行时注入的数据对象，会自动合并 taskId 等内部字段
 * @param signal AbortSignal 实例，用于任务取消（超时或外部主动停止）
 * @returns Promise<T> 异步返回任务执行结果
 * 
 * @example
 * ```typescript
 * // 简单的数据获取任务
 * const fetchTask: TaskHandler<UserData> = async (data, signal) => {
 *   const { userId } = data as { userId: number };
 *   const response = await fetch(`/api/users/${userId}`, { signal });
 *   return response.json();
 * };
 * 
 * // 带超时检测的任务
 * const uploadTask: TaskHandler<UploadResult> = async (data, signal) => {
 *   if (signal?.aborted) throw new Error('Task was cancelled');
 *   const formData = data as FormData;
 *   return await uploadFile(formData);
 * };
 * ```
 */
export type TaskHandler<T> = (data?: unknown, signal?: AbortSignal) => Promise<T>

/**
 * 任务队列全局配置接口
 * 
 * 定义了队列的运行参数和事件回调函数。这些配置影响整个队列的行为，
 * 但可以被单个任务的配置选项覆盖。
 * 
 * @interface TaskQueueConfig
 */
export interface TaskQueueConfig {
  /** 
   * 最大并发任务数
   * 控制同时执行的任务数量上限，避免资源争抢和服务器压力过大
   * @default 2
   */
  maxConcurrent: number
  
  /** 
   * 任务执行间隔（毫秒）
   * 每个任务执行完成后的等待时间，用于控制请求频率
   * @default 200
   */
  requestInterval: number
  
  /** 
   * 最大重试次数
   * 任务失败时的最大重试次数，达到此次数后标记为彻底失败
   * @default 2
   */
  maxRetries: number
  
  /** 
   * 基础重试延迟（毫秒）
   * 任务失败后等待重试的基础时间，实际延迟 = retryDelay × 当前重试次数
   * @default 1000
   */
  retryDelay: number
  
  /** 
   * 单个任务超时时间（毫秒）
   * 超过此时间的任务将被自动取消，可被任务级配置覆盖
   * @default 15000
   */
  timeout: number
  
  /** 
   * 进度变化回调函数
   * 队列进度发生变化时触发，包含详细的执行统计信息
   * @param progress 扩展进度信息，包含百分比、耗时等
   */
  onProgress?: (progress: ExtendedProgress) => void
  
  /** 
   * 单个任务完成回调函数
   * 每个任务执行完成（成功或失败）时触发
   * @param task 完成的任务项，包含结果或错误信息
   * @param state 完成状态：'success' 或 'failed'
   */
  onTaskComplete?: <TResult>(task: TaskItem<TResult>, state: 'success' | 'failed') => void
  
  /** 
   * 整个队列完成回调函数
   * 队列中所有任务执行完毕时触发，无论成功或失败
   * @param results 队列执行结果汇总，包含统计信息和详细结果
   */
  onQueueComplete?: <TResult>(results: QueueResults<TResult>) => void
  
  /** 
   * 错误处理回调函数
   * 任务执行过程中发生错误时触发，可用于日志记录或错误上报
   * @param task 发生错误的任务项
   * @param error 错误对象
   */
  onError?: <TResult>(task: TaskItem<TResult>, error: Error) => void
}

/**
 * 轻量进度接口（兼容旧版 API）
 * 
 * 为了保持向后兼容性，提供简化的进度信息结构。
 * 适用于只需要基本统计信息的旧版订阅者。
 * 
 * @interface TaskProgress
 */
export interface TaskProgress {
  /** 总任务数 */
  total: number
  /** 已完成任务数 */
  completed: number
  /** 失败任务数 */
  failed: number
  /** 正在执行的任务数（对应 ExtendedProgress 的 executing） */
  running: number
}

/**
 * 扩展进度接口（内部使用和 onProgress 回调）
 * 
 * 提供完整的进度信息，包含百分比、执行时间等高级统计数据。
 * 主要用于内部计算和 onProgress 回调函数。
 * 
 * @interface ExtendedProgress
 */
export interface ExtendedProgress {
  /** 总任务数 */
  total: number
  /** 已完成任务数 */
  completed: number
  /** 失败任务数 */
  failed: number
  /** 正在执行的任务数 */
  executing: number
  /** 等待执行的任务数 */
  pending: number
  /** 完成百分比（0-100） */
  percentage: number
  /** 队列是否已完成（所有任务都已完成或失败） */
  isComplete: boolean
  /** 已耗时（毫秒），从队列开始执行时计算 */
  elapsedTime: number
}

/**
 * 单个任务的可覆写配置选项
 * 
 * 允许为特定任务设置独立的配置参数，这些参数会覆盖队列的全局配置。
 * 支持优先级、重试策略、超时时间等个性化设置。
 * 
 * @interface TaskOptions
 */
export interface TaskOptions {
  /** 当前已重试次数（内部使用，初始为 0） */
  retries: number
  /** 最大重试次数，覆盖全局 maxRetries */
  maxRetries: number
  /** 任务优先级，数值越大优先级越高（支持负数） */
  priority: number
  /** 任务超时时间（毫秒），覆盖全局 timeout */
  timeout: number
  /** 扩展字段，支持自定义配置项 */
  [k: string]: unknown
}

/**
 * 队列内部任务项结构
 * 
 * 队列中每个任务的完整信息结构，包含任务函数、配置、状态、
 * 执行结果、时间统计等所有相关数据。
 * 
 * @template T 任务返回结果的类型
 * @interface TaskItem
 */
export interface TaskItem<T = unknown> {
  /** 任务唯一标识符 */
  id: string | number
  /** 任务执行函数 */
  fn: TaskHandler<T>
  /** 传递给任务的数据参数 */
  data?: unknown
  /** 任务配置选项 */
  options: TaskOptions
  /** 当前任务状态 */
  status: TaskStatus
  /** 任务执行结果（成功时有值） */
  result?: T
  /** 任务执行错误（失败时有值） */
  error?: Error
  /** 任务开始执行时间戳（毫秒） */
  startTime: number | null
  /** 任务结束时间戳（毫秒） */
  endTime: number | null
  /** 任务执行耗时（毫秒） */
  duration: number
  /** 用于取消任务的控制器 */
  abortController?: AbortController
}

/**
 * 队列统计快照
 * 
 * 队列在某个时间点的完整统计信息，用于生成进度报告和最终结果。
 * 包含任务数量统计和时间信息。
 * 
 * @interface QueueStatsSnapshot
 */
export interface QueueStatsSnapshot {
  /** 总任务数 */
  total: number
  /** 已完成任务数 */
  completed: number
  /** 失败任务数 */
  failed: number
  /** 正在执行的任务数 */
  executing: number
  /** 等待执行的任务数 */
  pending: number
  /** 队列开始执行时间戳（毫秒） */
  startTime: number | null
  /** 队列结束时间戳（毫秒） */
  endTime: number | null
}

/**
 * 队列执行完毕的汇总结果
 * 
 * 当队列中所有任务都执行完毕时，返回的综合结果信息。
 * 包含统计快照、成功失败的任务列表、成功率等关键指标。
 * 
 * @template T 任务返回结果的类型
 * @interface QueueResults
 */
export interface QueueResults<T = unknown> {
  /** 统计信息快照 */
  stats: QueueStatsSnapshot
  /** 成功完成的任务列表 */
  completed: Array<TaskItem<T>>
  /** 失败的任务列表 */
  failed: Array<TaskItem<T>>
  /** 是否全部成功（没有失败任务） */
  isSuccess: boolean
  /** 成功率百分比（0-100） */
  successRate: number
}

// ==================== 主要类实现 ====================

/**
 * 🚀 高能力任务队列类
 * 
 * 这是核心的任务队列管理器，提供完整的异步任务调度能力。
 * 支持并发控制、失败重试、优先级排序、进度监控等企业级特性。
 * 
 * @template T 任务返回结果的泛型类型，默认为 unknown
 * 
 * 🌟 主要特性：
 * - ⚡ 并发控制：精确控制同时运行的任务数量
 * - 🔄 智能重试：指数退避策略，自动处理临时性失败
 * - 📊 优先级：高优先级任务优先执行，支持动态插队
 * - 📈 进度监控：实时进度反馈，支持多种订阅方式
 * - ⏱️ 时间控制：任务超时保护，防止长时间阻塞
 * - 🛠️ 生命周期：完整的启动/暂停/恢复/停止/销毁管理
 * - 🔗 向后兼容：完全兼容旧版 API，无缝升级
 * 
 * 💡 典型使用场景：
 * ```typescript
 * // 创建队列实例
 * const queue = new TaskQueue({
 *   maxConcurrent: 3,      // 最多同时执行3个任务
 *   requestInterval: 100,  // 任务间隔100ms
 *   maxRetries: 2,         // 最多重试2次
 *   retryDelay: 1000,      // 重试延迟1秒
 *   timeout: 10000,        // 单个任务超时10秒
 *   onProgress: (progress) => {
 *     console.log(`执行进度: ${progress.percentage}%`);
 *   }
 * });
 * 
 * // 添加任务
 * queue.add(async () => {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * });
 * 
 * // 开始执行并等待完成
 * const results = await queue.start();
 * console.log(`任务完成，成功率: ${results.successRate}%`);
 * ```
 * 
 * @class TaskQueue
 */
export class TaskQueue<T = unknown> {
  // ==================== 私有属性 ====================
  
  /** 队列配置参数 */
  private config: TaskQueueConfig
  
  /** 待执行的任务队列（按优先级排序） */
  private tasks: Array<TaskItem<T>>
  
  /** 正在执行的任务映射表（键为任务ID） */
  private executing: Map<string | number, TaskItem<T>>
  
  /** 已完成的任务列表 */
  private completed: Array<TaskItem<T>>
  
  /** 失败的任务列表 */
  private failed: Array<TaskItem<T>>
  
  /** 队列是否处于暂停状态 */
  private paused: boolean
  
  /** 队列是否已停止 */
  private stopped: boolean
  
  /** 队列统计信息快照 */
  private stats: QueueStatsSnapshot
  
  /** 队列处理的定时器ID */
  private processingTimer: number | ReturnType<typeof setTimeout> | null
  
  /** 轻量级进度订阅者集合（兼容旧API） */
  private listeners: Set<(progress: TaskProgress) => void>

  // ==================== 构造函数 ====================
  
  /**
   * 创建任务队列实例
   * 
   * @param config 队列配置选项（可选，使用默认值补全）
   * 
   * @example
   * ```typescript
   * // 使用默认配置
   * const queue = new TaskQueue();
   * 
   * // 自定义配置
   * const queue = new TaskQueue({
   *   maxConcurrent: 5,
   *   requestInterval: 50,
   *   maxRetries: 3,
   *   onProgress: (progress) => updateUI(progress)
   * });
   * ```
   */
  constructor(config?: Partial<TaskQueueConfig>) {
    // 合并用户配置和默认配置
    this.config = {
      maxConcurrent: 2,      // 默认最大并发数
      requestInterval: 200,  // 默认任务间隔200ms
      maxRetries: 2,         // 默认最大重试2次
      retryDelay: 1000,      // 默认重试延迟1秒
      timeout: 15000,        // 默认超时15秒
      ...config,             // 用户配置覆盖默认值
    }
    
    // 初始化任务相关集合
    this.tasks = []                    // 待执行任务队列
    this.executing = new Map()         // 正在执行的任务映射
    this.completed = []                // 已完成任务列表
    this.failed = []                   // 失败任务列表
    
    // 初始化状态标志
    this.paused = false                // 初始未暂停
    this.stopped = false               // 初始未停止
    
    // 初始化统计信息
    this.stats = {
      total: 0,                        // 总任务数
      completed: 0,                    // 已完成数
      failed: 0,                       // 失败数
      executing: 0,                    // 执行中数
      pending: 0,                      // 等待数
      startTime: null,                 // 开始时间
      endTime: null,                   // 结束时间
    }
    
    // 初始化控制相关
    this.processingTimer = null        // 处理定时器
    this.listeners = new Set()         // 进度订阅者集合
  }

  // ==================== 公共 API 方法 ====================

  /**
   * 添加任务（兼容旧版 API）
   * 
   * 这是最简单的任务添加方式，只需要提供任务函数，系统会自动生成唯一ID。
   * 使用默认配置进行任务执行，适合简单场景。
   * 
   * @param task 要执行的异步任务函数
   * @returns 自动生成的任务ID，可用于后续跟踪
   * 
   * @example
   * ```typescript
   * const taskId = queue.add(async () => {
   *   const response = await fetch('/api/users');
   *   return response.json();
   * });
   * console.log(`任务ID: ${taskId}`);
   * ```
   */
  add(task: TaskHandler<T>): string {
    // 生成时间戳 + 随机字符串的唯一ID
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this.addWithId(id, task)
    return id
  }

  /**
   * 添加具有自定义ID的任务（兼容旧版 API）
   * 
   * 允许外部指定任务ID，便于后续通过特定ID进行任务跟踪和管理。
   * 如果ID已存在，新任务会覆盖旧任务。
   * 
   * @param id 自定义的任务唯一标识符
   * @param task 要执行的异步任务函数
   * 
   * @example
   * ```typescript
   * queue.addWithId('user-sync-001', async () => {
   *   return await syncUserData();
   * });
   * ```
   */
  addWithId(id: string | number, task: TaskHandler<T>): void {
    // 创建标准化的任务项
    const item: TaskItem<T> = {
      id,
      fn: task,
      data: undefined,                         // 无数据传递
      options: {
        retries: 0,                            // 重试计数从0开始
        maxRetries: this.config.maxRetries,    // 使用全局最大重试次数
        priority: 0,                           // 默认优先级为0
        timeout: this.config.timeout,          // 使用全局超时设置
      },
      status: 'pending',                       // 初始状态为等待
      result: undefined,                       // 初始无结果
      error: undefined,                        // 初始无错误
      startTime: null,                         // 初始无开始时间
      endTime: null,                           // 初始无结束时间
      duration: 0,                             // 初始耗时为0
    }
    this.enqueue(item)
  }

  /**
   * 高级任务添加方法（推荐使用）
   * 
   * 这是功能最完整的任务添加方法，支持数据传递、优先级设置、
   * 个性化配置等高级特性。适合复杂业务场景。
   * 
   * @param taskFn 要执行的异步任务函数
   * @param data 传递给任务的数据对象，会与系统注入的 taskId 合并
   * @param options 任务级配置选项，会覆盖队列的全局配置
   * @returns 数字类型的任务ID，便于日志记录和任务跟踪
   * 
   * @example
   * ```typescript
   * // 添加高优先级任务
   * const taskId = queue.addTask(
   *   async ({ userId, taskId }) => {
   *     console.log(`处理用户 ${userId}，任务ID: ${taskId}`);
   *     return await processUser(userId);
   *   },
   *   { userId: 123 },
   *   { 
   *     priority: 10,      // 高优先级
   *     timeout: 5000,     // 5秒超时
   *     maxRetries: 1      // 最多重试1次
   *   }
   * );
   * ```
   */
  addTask(taskFn: TaskHandler<T>, data: unknown = {}, options: Partial<TaskOptions> = {}): number {
    // 生成基于时间戳的数字ID，确保唯一性
    const taskId = Date.now() + Math.floor(Math.random() * 1000)
    
    // 创建完整的任务项，合并配置
    const item: TaskItem<T> = {
      id: taskId,
      fn: taskFn,
      data,                                   // 用户传入的数据
      options: {
        retries: 0,                          // 重试计数从0开始
        // 优先使用任务级配置，回退到全局配置
        maxRetries: typeof options.maxRetries === 'number' ? options.maxRetries : this.config.maxRetries,
        priority: typeof options.priority === 'number' ? options.priority : 0,
        timeout: typeof options.timeout === 'number' ? options.timeout : this.config.timeout,
        ...options,                          // 其他自定义选项
      },
      status: 'pending',
      result: undefined,
      error: undefined,
      startTime: null,
      endTime: null,
      duration: 0,
    }
    
    this.enqueue(item)
    return taskId
  }

  /**
   * 批量添加任务
   * 
   * 一次性添加多个任务，每个任务可以有独立的数据和配置。
   * 适合批处理场景，比如批量上传文件、批量API调用等。
   * 
   * @param taskList 任务列表，每个元素包含任务函数、数据和配置
   * @returns 所有任务的ID列表，顺序与输入保持一致
   * 
   * @example
   * ```typescript
   * const userIds = [1, 2, 3, 4, 5];
   * const taskIds = queue.addTasks(
   *   userIds.map(userId => ({
   *     fn: async ({ userId }) => await fetchUserData(userId),
   *     data: { userId },
   *     options: { priority: userId === 1 ? 10 : 0 } // 用户1优先处理
   *   }))
   * );
   * console.log(`添加了 ${taskIds.length} 个任务`);
   * ```
   */
  addTasks(taskList: Array<{ fn: TaskHandler<T>; data?: unknown; options?: Partial<TaskOptions> }>): Array<number> {
    const ids: number[] = []
    for (const task of taskList) {
      ids.push(this.addTask(task.fn, task.data, task.options))
    }
    return ids
  }

  /**
   * 订阅进度变化（兼容旧版 API）
   * 
   * 注册一个监听器来接收队列进度的实时更新。每当任务状态发生变化时，
   * 所有已注册的监听器都会收到最新的进度信息。
   * 
   * @param listener 进度变化回调函数，接收 TaskProgress 对象
   * @returns 取消订阅的函数，调用后移除该监听器
   * 
   * @example
   * ```typescript
   * // 订阅进度更新
   * const unsubscribe = queue.subscribe((progress) => {
   *   console.log(`进度: ${progress.completed}/${progress.total}`);
   *   updateProgressBar(progress.completed / progress.total);
   * });
   * 
   * // 在组件卸载时取消订阅
   * useEffect(() => {
   *   return unsubscribe;
   * }, []);
   * ```
   */
  subscribe(listener: (p: TaskProgress) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * 获取当前进度快照
   * 
   * 立即返回队列的当前执行进度，不涉及异步操作。
   * 适合需要主动获取进度信息的场景。
   * 
   * @returns 当前的进度信息对象
   * 
   * @example
   * ```typescript
   * const progress = queue.getProgress();
   * console.log(`完成率: ${(progress.completed / progress.total * 100).toFixed(1)}%`);
   * console.log(`失败数: ${progress.failed}`);
   * console.log(`运行中: ${progress.running}`);
   * ```
   */
  getProgress(): TaskProgress {
    return {
      total: this.stats.total,
      completed: this.stats.completed,
      failed: this.stats.failed,
      running: this.stats.executing,
    }
  }

  /**
   * 获取所有失败任务的ID列表
   * 
   * 返回已经失败（达到最大重试次数）的任务ID数组。
   * 可用于错误分析、重新处理失败任务等场景。
   * 
   * @returns 失败任务的ID数组
   * 
   * @example
   * ```typescript
   * const failedIds = queue.getFailedTaskIds();
   * if (failedIds.length > 0) {
   *   console.log(`有 ${failedIds.length} 个任务失败:`, failedIds);
   *   // 可以重新处理这些失败的任务
   *   queue.retryFailedTasks();
   * }
   * ```
   */
  getFailedTaskIds(): Array<string | number> {
    return this.failed.map((task) => task.id)
  }

  // ==================== 生命周期控制方法 ====================

  /**
   * 暂停队列执行
   * 
   * 暂停队列的任务调度，正在执行的任务会继续完成，但不会启动新任务。
   * 可以通过 resume() 方法恢复执行。暂停状态下仍可以添加新任务。
   * 
   * @example
   * ```typescript
   * // 在网络状况不佳时暂停队列
   * if (navigator.onLine === false) {
   *   queue.pause();
   *   console.log('网络断开，队列已暂停');
   * }
   * ```
   */
  pause(): void {
    this.paused = true
    this.notify()  // 通知订阅者状态变化
  }

  /**
   * 恢复队列执行
   * 
   * 从暂停状态恢复队列执行，立即开始处理等待中的任务。
   * 如果队列没有处于暂停状态，此操作无效果。
   * 
   * @example
   * ```typescript
   * // 网络恢复后恢复队列执行
   * window.addEventListener('online', () => {
   *   queue.resume();
   *   console.log('网络恢复，队列已恢复执行');
   * });
   * ```
   */
  resume(): void {
    if (!this.paused) return  // 如果未暂停则直接返回
    this.paused = false
    void this.processQueue()  // 立即开始处理队列
    this.notify()            // 通知订阅者状态变化
  }

  /**
   * 停止队列执行
   * 
   * 彻底停止队列，包括暂停新任务调度和取消所有正在执行的任务。
   * 停止后的队列无法恢复，需要重新创建实例。这是不可逆操作。
   * 
   * 执行过程：
   * 1. 设置停止和暂停标志
   * 2. 通过 AbortController 取消所有正在执行的任务
   * 3. 通知所有订阅者状态变化
   * 
   * @example
   * ```typescript
   * // 在页面卸载时停止队列
   * window.addEventListener('beforeunload', () => {
   *   queue.stop();
   *   console.log('队列已停止');
   * });
   * 
   * // 在错误达到阈值时停止队列
   * if (failedCount > maxFailures) {
   *   queue.stop();
   *   console.error('失败次数过多，停止队列执行');
   * }
   * ```
   */
  stop(): void {
    this.stopped = true
    this.paused = true
    
    // 取消所有正在执行的任务
    this.executing.forEach((task) => {
      task.abortController?.abort()
    })
    
    this.notify()  // 通知订阅者队列已停止
  }

  /**
   * 开始执行队列
   * 
   * 启动队列执行，返回一个 Promise，在队列完全执行完成后 resolve。
   * 这是队列的主要入口点，支持等待完成和获取最终结果。
   * 
   * 执行流程：
   * 1. 检查队列是否已停止
   * 2. 设置开始时间戳
   * 3. 启动任务处理循环
   * 4. 等待所有任务完成
   * 5. 返回执行结果汇总
   * 
   * @returns Promise，解析为队列执行结果，包含统计信息和任务详情
   * @throws 如果队列已停止则抛出错误
   * 
   * @example
   * ```typescript
   * // 等待队列完成并获取结果
   * try {
   *   const results = await queue.start();
   *   console.log(`队列执行完成！`);
   *   console.log(`成功: ${results.completed.length}`);
   *   console.log(`失败: ${results.failed.length}`);
   *   console.log(`成功率: ${results.successRate}%`);
   * } catch (error) {
   *   console.error('队列执行失败:', error);
   * }
   * 
   * // 不等待结果的用法
   * void queue.start();
   * console.log('队列已启动，后台执行中...');
   * ```
   */
  async start(): Promise<QueueResults<T> | void> {
    // 检查队列状态
    if (this.stopped) {
      throw new Error('Queue stopped - cannot start a stopped queue')
    }
    
    // 重置状态并记录开始时间
    this.paused = false
    if (!this.stats.startTime) {
      this.stats.startTime = Date.now()
    }
    
    // 启动队列处理
    void this.processQueue()

    // 返回 Promise，等待队列完成
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        // 检查是否被停止
        if (this.stopped) {
          reject(new Error('Queue was stopped during execution'))
          return
        }
        
        // 检查是否完成
        if (this.isComplete()) {
          this.stats.endTime = Date.now()
          const results = this.getResults()
          
          // 触发队列完成回调
          this.config.onQueueComplete?.(results)
          
          resolve(results)
        } else {
          // 100ms 后再次检查
          setTimeout(checkCompletion, 100)
        }
      }
      
      checkCompletion()
    })
  }

  // ==================== 管理和维护方法 ====================

  /**
   * 清空队列和统计信息
   * 
   * 清除所有任务（待执行、已完成、失败、执行中）和统计数据，
   * 重置队列到初始状态。不会影响队列的配置和订阅者。
   * 
   * @example
   * ```typescript
   * // 在开始新批次任务前清空队列
   * queue.clear();
   * console.log('队列已清空，可以添加新任务');
   * 
   * // 在错误情况下重置队列
   * if (criticalError) {
   *   queue.clear();
   *   console.log('出现严重错误，队列已重置');
   * }
   * ```
   */
  clear(): void {
    this.tasks = []          // 清空待执行任务
    this.completed = []      // 清空已完成任务
    this.failed = []         // 清空失败任务
    this.executing.clear()   // 清空执行中任务映射
    this.resetStats()        // 重置统计信息
    this.notify()           // 通知订阅者
  }

  /**
   * 重置统计信息
   * 
   * 将所有统计数据重置为初始状态，包括任务计数和时间信息。
   * 通常在 clear() 方法中自动调用，一般不需要单独使用。
   */
  resetStats(): void {
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      executing: 0,
      pending: 0,
      startTime: null,
      endTime: null,
    }
  }

  /**
   * 运行时更新队列配置
   * 
   * 动态修改队列的配置参数，新配置会立即生效。
   * 可以在队列执行过程中调用，适合根据运行状况调整参数。
   * 
   * @param newConfig 要更新的配置项（部分配置即可）
   * 
   * @example
   * ```typescript
   * // 根据网络状况调整并发数
   * if (isSlowNetwork) {
   *   queue.updateConfig({ 
   *     maxConcurrent: 1,    // 降低并发
   *     requestInterval: 500  // 增加间隔
   *   });
   * }
   * 
   * // 添加进度回调
   * queue.updateConfig({
   *   onProgress: (progress) => {
   *     updateProgressIndicator(progress.percentage);
   *   }
   * });
   * ```
   */
  updateConfig(newConfig: Partial<TaskQueueConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 重试所有失败的任务
   * 
   * 将所有已失败的任务重置状态并重新加入执行队列。
   * 任务的重试计数会被重置，错误信息会被清除。
   * 
   * 操作步骤：
   * 1. 复制当前失败任务列表
   * 2. 清空失败列表和统计
   * 3. 重置每个任务的状态和计数
   * 4. 重新加入队列等待执行
   * 
   * @example
   * ```typescript
   * // 在网络恢复后重试失败任务
   * window.addEventListener('online', () => {
   *   const failedCount = queue.getFailedTaskIds().length;
   *   if (failedCount > 0) {
   *     queue.retryFailedTasks();
   *     console.log(`正在重试 ${failedCount} 个失败任务`);
   *   }
   * });
   * 
   * // 手动重试失败任务
   * const results = await queue.start();
   * if (results.failed.length > 0) {
   *   const retry = confirm(`有 ${results.failed.length} 个任务失败，是否重试？`);
   *   if (retry) {
   *     queue.retryFailedTasks();
   *     await queue.start();
   *   }
   * }
   * ```
   */
  retryFailedTasks(): void {
    // 复制失败任务列表，避免在遍历时修改
    const failedTasks = [...this.failed]
    
    // 清空失败列表和统计
    this.failed = []
    this.stats.failed = 0
    
    // 重置每个失败任务并重新入队
    failedTasks.forEach((task) => {
      task.status = 'pending'      // 重置为等待状态
      task.options.retries = 0     // 重置重试计数
      task.error = undefined       // 清除错误信息
      task.startTime = null        // 重置开始时间
      task.endTime = null          // 重置结束时间
      task.duration = 0            // 重置耗时
      this.enqueue(task)           // 重新加入队列
    })
  }

  /**
   * 彻底销毁队列实例
   * 
   * 完全清理队列资源，包括停止执行、清空数据、清理定时器等。
   * 销毁后的队列实例不可再使用，这是最终的清理操作。
   * 
   * 执行步骤：
   * 1. 停止队列执行（取消所有任务）
   * 2. 清空所有数据
   * 3. 清理定时器资源
   * 
   * @example
   * ```typescript
   * // 在组件卸载时销毁队列
   * useEffect(() => {
   *   return () => {
   *     queue.destroy();
   *     console.log('队列已销毁');
   *   };
   * }, []);
   * 
   * // 在应用关闭前清理资源
   * window.addEventListener('beforeunload', () => {
   *   queue.destroy();
   * });
   * ```
   */
  destroy(): void {
    this.stop()    // 停止队列执行
    this.clear()   // 清空所有数据
    
    // 清理定时器资源
    if (this.processingTimer) {
      clearTimeout(this.processingTimer as any)
      this.processingTimer = null
    }
  }

  // ==================== 内部实现方法 ====================
  // 以下方法为私有方法，用于队列的内部运行逻辑，外部不应直接调用

  /**
   * 将任务加入队列（私有方法）
   * 
   * 将新任务添加到队列中，并按优先级进行排序。
   * 同时更新统计信息和通知订阅者。
   * 
   * 执行步骤：
   * 1. 将任务添加到队列尾部
   * 2. 更新总数和待执行数统计
   * 3. 按优先级重新排序（降序，高优先级在前）
   * 4. 触发进度更新通知
   * 
   * @param item 要加入队列的任务项
   */
  private enqueue(item: TaskItem<T>): void {
    this.tasks.push(item)           // 添加到队列
    this.stats.total += 1           // 增加总数统计
    this.stats.pending += 1         // 增加待执行数统计
    
    // 按优先级降序排列（高优先级在前），使用稳定排序
    this.tasks.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0))
    
    this.updateProgress()           // 通知进度更新
  }

  /**
   * 队列处理主循环（私有方法）
   * 
   * 这是队列的核心调度逻辑，负责从待执行队列中取出任务并启动执行。
   * 严格遵守并发限制、暂停/停止状态，并实现定时轮询机制。
   * 
   * 执行逻辑：
   * 1. 检查队列状态（暂停/停止）
   * 2. 在并发限制内尽可能多地启动任务
   * 3. 如果队列未完成且未暂停，设置定时器继续处理
   * 
   * 并发控制：
   * - 同时执行的任务数不超过 maxConcurrent
   * - 只有在有待执行任务且未达并发上限时才启动新任务
   * 
   * 轮询机制：
   * - 使用 requestInterval 间隔进行轮询
   * - 避免 CPU 密集的忙等待
   * - 在队列完成或暂停时停止轮询
   */
  private async processQueue(): Promise<void> {
    // 检查队列状态，如果暂停或停止则直接返回
    if (this.paused || this.stopped) return
    
    // 在允许的并发范围内尽可能启动任务
    while (
      !this.paused &&                                    // 未暂停
      !this.stopped &&                                   // 未停止
      this.executing.size < this.config.maxConcurrent && // 未达并发上限
      this.tasks.length > 0                              // 还有待执行任务
    ) {
      const task = this.tasks.shift()!  // 取出队首任务（优先级最高）
      this.stats.pending -= 1          // 减少待执行数统计
      void this.executeTask(task)       // 异步执行任务
    }
    
    // 如果队列未完成且状态正常，设置定时器继续处理
    if (!this.isComplete() && !this.paused && !this.stopped) {
      this.processingTimer = setTimeout(
        () => void this.processQueue(), 
        this.config.requestInterval
      )
    }
  }

  /**
   * 执行单个任务（私有方法）
   * 
   * 负责单个任务的完整执行流程，包括状态管理、超时控制、结果处理等。
   * 这是任务实际执行的核心方法，处理所有与任务执行相关的逻辑。
   * 
   * 执行流程：
   * 1. 设置任务状态为执行中
   * 2. 创建 AbortController 用于取消控制
   * 3. 设置超时保护
   * 4. 执行任务函数
   * 5. 处理执行结果或错误
   * 6. 更新统计信息和触发回调
   * 7. 执行节流延迟
   * 
   * 超时机制：
   * - 使用 Promise.race 实现超时竞争
   * - 超时时间由任务配置或全局配置决定
   * - 超时后任务会被标记为失败
   * 
   * 数据注入：
   * - 将用户数据与系统数据（taskId）合并
   * - 传递 AbortSignal 供任务函数使用
   * 
   * @param task 要执行的任务项
   */
  private async executeTask(task: TaskItem<T>): Promise<void> {
    // === 执行前准备 ===
    task.status = 'executing'                    // 设置状态为执行中
    task.startTime = Date.now()                  // 记录开始时间
    this.executing.set(task.id, task)            // 加入执行中映射
    this.stats.executing += 1                    // 更新执行中计数

    // 创建取消控制器
    const abortController = new AbortController()
    task.abortController = abortController

    try {
      // === 超时保护 ===
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Task timeout: ${task.options.timeout}ms`)), 
          task.options.timeout
        )
      })
      
      // === 数据准备和任务执行 ===
      // 合并用户数据和系统注入的数据（taskId）
      const data = { ...(task.data as object), taskId: task.id }
      
      // 执行用户任务函数
      const taskPromise = task.fn(data, abortController.signal)
      
      // 超时竞争：任务完成 vs 超时
      const result = await Promise.race([taskPromise, timeoutPromise]) as T

      // === 成功处理 ===
      task.status = 'completed'                  // 设置状态为已完成
      task.result = result                       // 保存执行结果
      task.endTime = Date.now()                  // 记录结束时间
      task.duration = (task.endTime || 0) - (task.startTime || 0)  // 计算耗时

      this.completed.push(task)                  // 加入完成列表
      this.stats.completed += 1                 // 更新完成计数
      
      // 触发任务完成回调
      this.config.onTaskComplete?.(task, 'success')
      
    } catch (e) {
      // === 错误处理 ===
      const error = e instanceof Error ? e : new Error(String(e))
      await this.handleTaskError(task, error)
      
    } finally {
      // === 清理和后续处理 ===
      this.executing.delete(task.id)            // 从执行中移除
      this.stats.executing -= 1                 // 减少执行中计数
      this.updateProgress()                      // 通知进度更新
      
      // 执行节流延迟，避免过于频繁的请求
      if (this.config.requestInterval > 0) {
        await this.sleep(this.config.requestInterval)
      }
    }
  }

  /**
   * 任务错误处理（私有方法）
   * 
   * 当任务执行失败时的错误处理逻辑，实现智能重试机制。
   * 根据重试次数决定是重新执行还是标记为最终失败。
   * 
   * 重试机制：
   * - 使用线性指数退避策略：延迟 = 基础延迟 × 重试次数
   * - 重试的任务会被插入到队列头部，优先执行
   * - 超过最大重试次数的任务标记为最终失败
   * 
   * 处理流程：
   * 1. 记录错误信息
   * 2. 增加重试计数
   * 3. 判断是否还可以重试
   * 4a. 可重试：设置退避延迟，重新入队
   * 4b. 不可重试：标记失败，触发回调
   * 
   * @param task 失败的任务项
   * @param error 错误对象
   */
  private async handleTaskError(task: TaskItem<T>, error: Error): Promise<void> {
    // 记录错误信息和增加重试计数
    task.error = error
    task.options.retries += 1

    // 判断是否还可以重试
    if (task.options.retries < task.options.maxRetries) {
      // === 可以重试的情况 ===
      task.status = 'retrying'
      
      // 计算退避延迟：基础延迟 × 当前重试次数
      const backoffDelay = this.config.retryDelay * task.options.retries
      
      // 等待退避延迟
      await this.sleep(backoffDelay)
      
      // 重新加入队列头部（优先执行重试任务）
      this.tasks.unshift(task)
      this.stats.pending += 1
      
    } else {
      // === 达到最大重试次数，标记为最终失败 ===
      task.status = 'failed'
      task.endTime = Date.now()                                      // 记录结束时间
      task.duration = (task.endTime || 0) - (task.startTime || 0)    // 计算总耗时
      
      this.failed.push(task)                                         // 加入失败列表
      this.stats.failed += 1                                        // 更新失败计数
      
      // 触发相关回调
      this.config.onTaskComplete?.(task, 'failed')                   // 任务完成回调
      this.config.onError?.(task, error)                            // 错误处理回调
    }
  }

  /**
   * 通知进度更新（私有方法）
   * 
   * 触发进度更新的简便方法，兼容旧版本 API。
   * 实际上是 updateProgress() 的别名。
   */
  private notify(): void {
    this.updateProgress()
  }

  /**
   * 计算并推送进度信息（私有方法）
   * 
   * 核心的进度计算和通知逻辑，负责：
   * 1. 计算详细的进度信息（百分比、耗时等）
   * 2. 触发配置中的 onProgress 回调
   * 3. 通知所有轻量级进度订阅者
   * 
   * 进度计算：
   * - 完成百分比 = (已完成 + 已失败) / 总数 × 100
   * - 耗时 = 当前时间 - 开始时间
   * - 完成状态 = 无待执行且无执行中且总数 > 0
   * 
   * 通知机制：
   * - 高级订阅者收到 ExtendedProgress（包含详细信息）
   * - 轻量级订阅者收到 TaskProgress（基础信息，兼容旧版）
   * - 订阅者回调中的异常会被安全捕获
   */
  private updateProgress(): void {
    // 计算扩展进度信息
    const progressFull: ExtendedProgress = {
      total: this.stats.total,
      completed: this.stats.completed,
      failed: this.stats.failed,
      executing: this.stats.executing,
      pending: this.stats.pending,
      // 计算完成百分比（已完成 + 已失败算作处理完毕）
      percentage: this.stats.total > 0 
        ? Math.round(((this.stats.completed + this.stats.failed) / this.stats.total) * 100) 
        : 0,
      isComplete: this.isComplete(),
      // 计算已耗时
      elapsedTime: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
    }
    
    // 触发高级进度回调
    this.config.onProgress?.(progressFull)
    
    // 为兼容旧版订阅者构造轻量级进度
    const progressLite: TaskProgress = {
      total: progressFull.total,
      completed: progressFull.completed,
      failed: progressFull.failed,
      running: progressFull.executing,  // 兼容字段名
    }
    
    // 通知所有轻量级订阅者，安全处理异常
    this.listeners.forEach((listener) => {
      try { 
        listener(progressLite) 
      } catch { 
        // 忽略订阅者回调中的异常，避免影响队列运行
      }
    })
  }

  /**
   * 检查队列是否已完成（私有方法）
   * 
   * 判断队列是否已经处理完所有任务。
   * 完成条件：无待执行任务 && 无执行中任务 && 总任务数 > 0
   * 
   * 注意：总任务数必须大于 0，避免空队列被误判为完成状态
   * 
   * @returns 队列是否已完成
   */
  private isComplete(): boolean {
    return this.tasks.length === 0 && this.executing.size === 0 && this.stats.total > 0
  }

  /**
   * 生成队列执行结果汇总（私有方法）
   * 
   * 创建包含完整执行结果的汇总对象，用于：
   * - start() 方法的返回值
   * - onQueueComplete 回调的参数
   * 
   * 结果包含：
   * - 统计信息快照
   * - 成功任务列表（副本）
   * - 失败任务列表（副本）
   * - 整体成功标志
   * - 成功率百分比
   * 
   * @returns 队列执行结果汇总
   */
  private getResults(): QueueResults<T> {
    // 创建统计快照
    const statsSnapshot: QueueStatsSnapshot = { ...this.stats }
    
    return {
      stats: statsSnapshot,
      completed: [...this.completed],    // 创建副本，避免外部修改
      failed: [...this.failed],          // 创建副本，避免外部修改
      isSuccess: this.failed.length === 0,  // 无失败任务即为完全成功
      // 计算成功率：成功数 / 总数 × 100，空队列成功率为 0
      successRate: this.stats.total > 0 
        ? Math.round((this.stats.completed / this.stats.total) * 100) 
        : 0,
    }
  }

  /**
   * 异步休眠工具函数（私有方法）
   * 
   * 创建一个指定毫秒数后 resolve 的 Promise，用于：
   * - 任务间隔控制（requestInterval）
   * - 重试退避延迟（retryDelay）
   * - 其他需要延迟的场景
   * 
   * @param ms 休眠时间（毫秒）
   * @returns Promise，在指定时间后 resolve
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// ==================== 导出和工厂函数 ====================

/**
 * 创建规格处理专用任务队列
 * 
 * 这是一个预配置的工厂函数，专门为商品规格处理场景优化。
 * 使用了相对保守的配置参数，适合处理商品规格相关的 API 调用。
 * 
 * 默认配置：
 * - maxConcurrent: 2 (适中的并发数，避免过载)
 * - requestInterval: 200ms (防止请求过于频繁)
 * - maxRetries: 3 (较多重试次数，提高成功率)
 * - retryDelay: 1500ms (较长的重试间隔)
 * - timeout: 15000ms (15秒超时，适合复杂的规格处理)
 * 
 * @param config 可选的配置覆盖项
 * @returns 配置好的 TaskQueue 实例
 * 
 * @example
 * ```typescript
 * // 使用默认配置
 * const specQueue = createSpecificationTaskQueue();
 * 
 * // 自定义部分配置
 * const specQueue = createSpecificationTaskQueue({
 *   maxConcurrent: 1,  // 降低并发
 *   onProgress: (progress) => updateSpecProgress(progress)
 * });
 * ```
 */
export const createSpecificationTaskQueue = (config?: Partial<TaskQueueConfig>) =>
  new TaskQueue({ 
    maxConcurrent: 2, 
    requestInterval: 200, 
    maxRetries: 3, 
    retryDelay: 1500, 
    timeout: 15000, 
    ...config 
  })

/**
 * 创建遥测数据专用任务队列
 * 
 * 这是一个预配置的工厂函数，专门为遥测数据上报场景优化。
 * 相比规格队列，超时时间较短，适合轻量级的数据上报任务。
 * 
 * 默认配置：
 * - maxConcurrent: 2 (适中的并发数)
 * - requestInterval: 200ms (控制上报频率)
 * - maxRetries: 3 (保证数据可靠上报)
 * - retryDelay: 1500ms (重试间隔)
 * - timeout: 10000ms (10秒超时，适合快速数据上报)
 * 
 * @template T 遥测数据的类型
 * @param config 可选的配置覆盖项
 * @returns 配置好的 TaskQueue 实例
 * 
 * @example
 * ```typescript
 * // 创建遥测队列
 * const telemetryQueue = createTelemetryTaskQueue<TelemetryEvent>();
 * 
 * // 添加遥测任务
 * telemetryQueue.addTask(
 *   async ({ event }) => await sendTelemetry(event),
 *   { event: userClickEvent }
 * );
 * ```
 */
export const createTelemetryTaskQueue = <T = unknown>(config?: Partial<TaskQueueConfig>) =>
  new TaskQueue<T>({ 
    maxConcurrent: 2, 
    requestInterval: 200, 
    maxRetries: 3, 
    retryDelay: 1500, 
    timeout: 10000, 
    ...config 
  })

/**
 * 默认导出 TaskQueue 类
 * 
 * 直接导出 TaskQueue 类，供需要完全自定义配置的场景使用。
 */
export default TaskQueue
