export type TaskHandler<T> = () => Promise<T>

export interface TaskQueueConfig {
  maxConcurrent: number
  requestInterval: number
  maxRetries: number
  retryDelay: number
  timeout: number
}

export interface TaskProgress {
  total: number
  completed: number
  failed: number
  running: number
}

export class TaskQueue<T = unknown> {
  private readonly config: TaskQueueConfig
  private queue: Array<{ id: string; fn: TaskHandler<T>; retries: number }>
  private runningCount: number
  private completedCount: number
  private failedCount: number
  private stopped: boolean
  private paused: boolean
  private failedTaskIds: string[]
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
    this.queue = []
    this.runningCount = 0
    this.completedCount = 0
    this.failedCount = 0
    this.stopped = false
    this.paused = false
    this.failedTaskIds = []
    this.listeners = new Set()
  }

  add(task: TaskHandler<T>) {
    this.addWithId(`${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, task)
  }

  addWithId(id: string, task: TaskHandler<T>) {
    this.queue.push({ id, fn: task, retries: 0 })
    this.notify()
  }

  getProgress(): TaskProgress {
    return {
      total: this.queue.length + this.completedCount + this.failedCount + this.runningCount,
      completed: this.completedCount,
      failed: this.failedCount,
      running: this.runningCount,
    }
  }

  getFailedTaskIds(): string[] {
    return [...this.failedTaskIds]
  }

  subscribe(listener: (p: TaskProgress) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    const snapshot = this.getProgress()
    this.listeners.forEach((l) => {
      try {
        l(snapshot)
      } catch { /* ignore */ }
    })
  }

  pause() {
    this.paused = true
    this.notify()
  }

  resume() {
    this.paused = false
    this.tick()
    this.notify()
  }

  stop() {
    this.stopped = true
    this.notify()
  }

  private async runWithTimeout(task: TaskHandler<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error('Task timeout'))
      }, this.config.timeout)
    })
    return Promise.race([task(), timeoutPromise]) as Promise<T>
  }

  private async execute(entry: { id: string; fn: TaskHandler<T>; retries: number }) {
    try {
      this.runningCount += 1
      this.notify()
      await this.runWithTimeout(entry.fn)
      this.completedCount += 1
    } catch {
      if (entry.retries < this.config.maxRetries) {
        await new Promise((r) => setTimeout(r, this.config.retryDelay))
        entry.retries += 1
        this.queue.push(entry)
      } else {
        this.failedCount += 1
        this.failedTaskIds.push(entry.id)
      }
    } finally {
      this.runningCount -= 1
      this.notify()
    }
  }

  async start(): Promise<void> {
    this.stopped = false
    this.paused = false
    await this.tick()
  }

  private async tick(): Promise<void> {
    while (!this.stopped) {
      if (this.paused) {
        await new Promise((r) => setTimeout(r, 200))
        continue
      }
      while (this.runningCount < this.config.maxConcurrent && this.queue.length > 0) {
        const entry = this.queue.shift()!
        void this.execute(entry)
        await new Promise((r) => setTimeout(r, this.config.requestInterval))
      }
      if (this.queue.length === 0 && this.runningCount === 0) break
      await new Promise((r) => setTimeout(r, 100))
    }
    this.notify()
  }
}

export const createSpecificationTaskQueue = (config?: Partial<TaskQueueConfig>) =>
  new TaskQueue({ maxConcurrent: 2, requestInterval: 200, maxRetries: 3, retryDelay: 1500, timeout: 15000, ...config })


