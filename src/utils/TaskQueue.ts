/*
 * 统一高能力任务队列（TypeScript）
 * - 融合现有轻量实现与参考的 TaskQueue.js 设计
 * - 保留向后兼容 API（add/addWithId/subscribe/getFailedTaskIds/start/pause/resume/stop）
 * - 新增：优先级、任务级配置覆盖、指数退避、进度/结果快照、事件回调、清理与重试
 */

export type TaskStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'retrying'

export type TaskHandler<T> = (data?: unknown, signal?: AbortSignal) => Promise<T>

export interface TaskQueueConfig {
  maxConcurrent: number
  requestInterval: number
  maxRetries: number
  retryDelay: number
  timeout: number
  onProgress?: (progress: ExtendedProgress) => void
  onTaskComplete?: <TResult>(task: TaskItem<TResult>, state: 'success' | 'failed') => void
  onQueueComplete?: <TResult>(results: QueueResults<TResult>) => void
  onError?: <TResult>(task: TaskItem<TResult>, error: Error) => void
}

export interface TaskProgress {
  total: number
  completed: number
  failed: number
  running: number
}

export interface ExtendedProgress {
  total: number
  completed: number
  failed: number
  executing: number
  pending: number
  percentage: number
  isComplete: boolean
  elapsedTime: number
}

export interface TaskOptions {
  retries: number
  maxRetries: number
  priority: number
  timeout: number
  [k: string]: unknown
}

export interface TaskItem<T = unknown> {
  id: string | number
  fn: TaskHandler<T>
  data?: unknown
  options: TaskOptions
  status: TaskStatus
  result?: T
  error?: Error
  startTime: number | null
  endTime: number | null
  duration: number
  abortController?: AbortController
}

export interface QueueStatsSnapshot {
  total: number
  completed: number
  failed: number
  executing: number
  pending: number
  startTime: number | null
  endTime: number | null
}

export interface QueueResults<T = unknown> {
  stats: QueueStatsSnapshot
  completed: Array<TaskItem<T>>
  failed: Array<TaskItem<T>>
  isSuccess: boolean
  successRate: number
}

export class TaskQueue<T = unknown> {
  private config: TaskQueueConfig
  private tasks: Array<TaskItem<T>>
  private executing: Map<string | number, TaskItem<T>>
  private completed: Array<TaskItem<T>>
  private failed: Array<TaskItem<T>>
  private paused: boolean
  private stopped: boolean
  private stats: QueueStatsSnapshot
  private processingTimer: number | ReturnType<typeof setTimeout> | null
  private listeners: Set<(progress: TaskProgress) => void>

  constructor(config?: Partial<TaskQueueConfig>) {
    this.config = {
      maxConcurrent: 2,
      requestInterval: 200,
      maxRetries: 2,
      retryDelay: 1000,
      timeout: 15000,
      ...config,
    }
    this.tasks = []
    this.executing = new Map()
    this.completed = []
    this.failed = []
    this.paused = false
    this.stopped = false
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      executing: 0,
      pending: 0,
      startTime: null,
      endTime: null,
    }
    this.processingTimer = null
    this.listeners = new Set()
  }

  /** 兼容旧 API：仅传入函数，自动生成 id */
  add(task: TaskHandler<T>): string {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this.addWithId(id, task)
    return id
  }

  /** 兼容旧 API：外部自定义 id 与任务函数 */
  addWithId(id: string | number, task: TaskHandler<T>): void {
    const item: TaskItem<T> = {
      id,
      fn: task,
      data: undefined,
      options: {
        retries: 0,
        maxRetries: this.config.maxRetries,
        priority: 0,
        timeout: this.config.timeout,
      },
      status: 'pending',
      result: undefined,
      error: undefined,
      startTime: null,
      endTime: null,
      duration: 0,
    }
    this.enqueue(item)
  }

  /** 高能力入口：支持任务级配置与数据 */
  addTask(taskFn: TaskHandler<T>, data: unknown = {}, options: Partial<TaskOptions> = {}): number {
    const taskId = Date.now() + Math.floor(Math.random() * 1000)
    const item: TaskItem<T> = {
      id: taskId,
      fn: taskFn,
      data,
      options: {
        retries: 0,
        maxRetries: typeof options.maxRetries === 'number' ? options.maxRetries : this.config.maxRetries,
        priority: typeof options.priority === 'number' ? options.priority : 0,
        timeout: typeof options.timeout === 'number' ? options.timeout : this.config.timeout,
        ...options,
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

  /** 批量添加任务（高能力入口） */
  addTasks(taskList: Array<{ fn: TaskHandler<T>; data?: unknown; options?: Partial<TaskOptions> }>): Array<number> {
    const ids: number[] = []
    for (const t of taskList) {
      ids.push(this.addTask(t.fn, t.data, t.options))
    }
    return ids
  }

  /** 订阅简化进度（兼容旧版 Progress） */
  subscribe(listener: (p: TaskProgress) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** 扩展进度立即获取 */
  getProgress(): TaskProgress {
    return {
      total: this.stats.total,
      completed: this.stats.completed,
      failed: this.stats.failed,
      running: this.stats.executing,
    }
  }

  /** 失败任务 id 列表 */
  getFailedTaskIds(): Array<string | number> {
    return this.failed.map((t) => t.id)
  }

  /** 暂停/恢复/停止 */
  pause(): void {
    this.paused = true
    this.notify()
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    void this.processQueue()
    this.notify()
  }

  stop(): void {
    this.stopped = true
    this.paused = true
    // 取消所有正在执行的任务
    this.executing.forEach((task) => task.abortController?.abort())
    this.notify()
  }

  /** 开始执行：返回一个在队列完成后 resolve 的 Promise */
  async start(): Promise<QueueResults<T> | void> {
    if (this.stopped) throw new Error('Queue stopped')
    this.paused = false
    if (!this.stats.startTime) this.stats.startTime = Date.now()
    void this.processQueue()

    // 兼容旧用法：有人不会等待返回值
    return new Promise((resolve, reject) => {
      const check = () => {
        if (this.stopped) {
          reject(new Error('Queue stopped'))
          return
        }
        if (this.isComplete()) {
          this.stats.endTime = Date.now()
          const results = this.getResults()
          this.config.onQueueComplete?.(results)
          resolve(results)
        } else {
          setTimeout(check, 100)
        }
      }
      check()
    })
  }

  /** 清空队列与统计 */
  clear(): void {
    this.tasks = []
    this.completed = []
    this.failed = []
    this.executing.clear()
    this.resetStats()
    this.notify()
  }

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

  updateConfig(newConfig: Partial<TaskQueueConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  retryFailedTasks(): void {
    const failedTasks = [...this.failed]
    this.failed = []
    this.stats.failed = 0
    failedTasks.forEach((task) => {
      task.status = 'pending'
      task.options.retries = 0
      task.error = undefined
      task.startTime = null
      task.endTime = null
      task.duration = 0
      this.enqueue(task)
    })
  }

  destroy(): void {
    this.stop()
    this.clear()
    if (this.processingTimer) {
      clearTimeout(this.processingTimer as any)
      this.processingTimer = null
    }
  }

  // ============== 内部实现 ==============
  private enqueue(item: TaskItem<T>): void {
    this.tasks.push(item)
    this.stats.total += 1
    this.stats.pending += 1
    // 依据优先级降序排列（稳定排序）
    this.tasks.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0))
    this.updateProgress()
  }

  private async processQueue(): Promise<void> {
    if (this.paused || this.stopped) return
    while (
      !this.paused &&
      !this.stopped &&
      this.executing.size < this.config.maxConcurrent &&
      this.tasks.length > 0
    ) {
      const task = this.tasks.shift()!
      this.stats.pending -= 1
      void this.executeTask(task)
    }
    if (!this.isComplete() && !this.paused && !this.stopped) {
      this.processingTimer = setTimeout(() => void this.processQueue(), this.config.requestInterval)
    }
  }

  private async executeTask(task: TaskItem<T>): Promise<void> {
    task.status = 'executing'
    task.startTime = Date.now()
    this.executing.set(task.id, task)
    this.stats.executing += 1

    const abortController = new AbortController()
    task.abortController = abortController

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Task timeout: ${task.options.timeout}ms`)), task.options.timeout)
      })
      const data = { ...(task.data as object), taskId: task.id }
      const p = task.fn(data, abortController.signal)
      const result = await Promise.race([p, timeoutPromise]) as T

      task.status = 'completed'
      task.result = result
      task.endTime = Date.now()
      task.duration = (task.endTime || 0) - (task.startTime || 0)

      this.completed.push(task)
      this.stats.completed += 1
      this.config.onTaskComplete?.(task, 'success')
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      await this.handleTaskError(task, error)
    } finally {
      this.executing.delete(task.id)
      this.stats.executing -= 1
      this.updateProgress()
      if (this.config.requestInterval > 0) await this.sleep(this.config.requestInterval)
    }
  }

  private async handleTaskError(task: TaskItem<T>, error: Error): Promise<void> {
    task.error = error
    task.options.retries += 1

    if (task.options.retries < task.options.maxRetries) {
      task.status = 'retrying'
      const backoff = this.config.retryDelay * task.options.retries
      await this.sleep(backoff)
      // 重新加入队列头部
      this.tasks.unshift(task)
      this.stats.pending += 1
    } else {
      task.status = 'failed'
      task.endTime = Date.now()
      task.duration = (task.endTime || 0) - (task.startTime || 0)
      this.failed.push(task)
      this.stats.failed += 1
      this.config.onTaskComplete?.(task, 'failed')
      this.config.onError?.(task, error)
    }
  }

  private updateProgress(): void {
    const progressFull: ExtendedProgress = {
      total: this.stats.total,
      completed: this.stats.completed,
      failed: this.stats.failed,
      executing: this.stats.executing,
      pending: this.stats.pending,
      percentage: this.stats.total > 0 ? Math.round(((this.stats.completed + this.stats.failed) / this.stats.total) * 100) : 0,
      isComplete: this.isComplete(),
      elapsedTime: this.stats.startTime ? Date.now() - this.stats.startTime : 0,
    }
    // 回调
    this.config.onProgress?.(progressFull)
    // 兼容旧订阅者
    const progressLite: TaskProgress = {
      total: progressFull.total,
      completed: progressFull.completed,
      failed: progressFull.failed,
      running: progressFull.executing,
    }
    this.listeners.forEach((l) => {
      try { l(progressLite) } catch { /* ignore */ }
    })
  }

  private isComplete(): boolean {
    return this.tasks.length === 0 && this.executing.size === 0 && this.stats.total > 0
  }

  private getResults(): QueueResults<T> {
    const statsSnapshot: QueueStatsSnapshot = { ...this.stats }
    return {
      stats: statsSnapshot,
      completed: [...this.completed],
      failed: [...this.failed],
      isSuccess: this.failed.length === 0,
      successRate: this.stats.total > 0 ? Math.round((this.stats.completed / this.stats.total) * 100) : 0,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export const createSpecificationTaskQueue = (config?: Partial<TaskQueueConfig>) =>
  new TaskQueue({ maxConcurrent: 2, requestInterval: 200, maxRetries: 3, retryDelay: 1500, timeout: 15000, ...config })

export const createTelemetryTaskQueue = (config?: Partial<TaskQueueConfig>) =>
  new TaskQueue({ maxConcurrent: 2, requestInterval: 200, maxRetries: 3, retryDelay: 1500, timeout: 10000, ...config })

export default TaskQueue
