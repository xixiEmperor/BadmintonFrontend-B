/**
 * 高并发任务队列管理器
 *
 * =================== 与浏览器事件循环的关系 ===================
 *
 * 🔄 相似之处：
 * 1. 都使用队列数据结构管理任务
 * 2. 都遵循FIFO(先进先出)原则
 * 3. 都处理异步任务的调度
 * 4. 都有任务状态管理
 *
 * 🎯 关键差异：
 *
 * 1. 执行层级：
 *    - 浏览器事件循环：JavaScript引擎底层，管理所有异步操作
 *    - 本任务队列：应用层面，基于Promise和setTimeout实现
 *
 * 2. 并发控制：
 *    - 浏览器事件循环：单线程，一次只执行一个任务
 *    - 本任务队列：支持控制并发数量，可同时执行多个任务
 *
 * 3. 任务类型：
 *    - 浏览器事件循环：宏任务(setTimeout,I/O) + 微任务(Promise.then)
 *    - 本任务队列：业务逻辑任务，通常包装为Promise
 *
 * 4. 调度策略：
 *    - 浏览器事件循环：固定调度算法(微任务优先)
 *    - 本任务队列：可配置调度(优先级、间隔、重试)
 *
 * 5. 错误处理：
 *    - 浏览器事件循环：错误冒泡到全局
 *    - 本任务队列：内置重试机制和错误恢复
 *
 * 🔗 实际关系：
 * 本任务队列运行在浏览器事件循环之上，利用事件循环的异步能力，
 * 实现了更高级的任务调度和管理功能。每个任务的执行最终还是
 * 通过事件循环来调度的。
 *
 * 例如：
 * ```javascript
 *  我们的任务最终会这样执行：
 * setTimeout(() => {           // 利用事件循环的宏任务
 *   this.processQueue()        // 我们的调度逻辑
 * }, this.config.requestInterval)
 *
 *  任务执行也依赖事件循环：
 * const result = await task.fn() // Promise在事件循环中解析
 * ```
 *
 * =================== 设计目标 ===================
 * 1. 解决高并发请求导致的数据库死锁问题
 * 2. 控制服务器资源使用，避免过载
 * 3. 提供可靠的重试机制和错误处理
 * 4. 实现实时进度监控和状态管理
 *
 * 核心原理：
 * - 生产者-消费者模式：任务生产和消费分离
 * - 并发控制：限制同时执行的任务数量
 * - 状态机管理：完整的任务生命周期跟踪
 * - 事件驱动：通过回调函数实现状态通知
 */

export class TaskQueue {
  constructor(options = {}) {
    // ===== 配置参数 =====
    // 这些参数控制队列的行为特性，可以根据服务器性能和业务需求调整
    this.config = {
      maxConcurrent: options.maxConcurrent || 3,        // 最大并发数：同时执行的任务数量上限
      requestInterval: options.requestInterval || 100,   // 请求间隔(ms)：每个任务执行完后的等待时间
      maxRetries: options.maxRetries || 3,              // 最大重试次数：任务失败后的重试上限
      retryDelay: options.retryDelay || 1000,           // 重试延迟(ms)：重试前的等待时间
      timeout: options.timeout || 30000,                // 请求超时时间(ms)：单个任务的执行时间上限

      // ===== 事件回调函数 =====
      // 这些回调函数实现了事件驱动的状态通知机制
      onProgress: options.onProgress || (() => {}),           // 进度更新回调：每当任务状态变化时触发
      onTaskComplete: options.onTaskComplete || (() => {}),   // 单个任务完成回调：任务成功或失败时触发
      onQueueComplete: options.onQueueComplete || (() => {}), // 队列完成回调：所有任务处理完毕时触发
      onError: options.onError || (() => {}),                 // 错误回调：任务最终失败时触发
    }

    // ===== 队列状态管理 =====
    // 使用不同的数据结构来管理任务的不同状态，实现高效的状态转换
    this.tasks = []                    // 待执行任务队列：使用数组实现FIFO队列
    this.executing = new Map()         // 正在执行的任务：使用Map快速查找和删除
    this.completed = []                // 已完成任务：保存成功执行的任务记录
    this.failed = []                   // 失败任务：保存最终失败的任务记录
    this.paused = false               // 暂停标志：控制队列是否暂停处理
    this.stopped = false              // 停止标志：控制队列是否完全停止

    // ===== 统计信息 =====
    // 实时统计队列的执行状态，用于进度监控和性能分析
    this.stats = {
      total: 0,           // 总任务数：添加到队列的任务总数
      completed: 0,       // 已完成数：成功执行的任务数
      failed: 0,          // 失败数：最终失败的任务数
      executing: 0,       // 执行中数：当前正在执行的任务数
      pending: 0,         // 待处理数：等待执行的任务数
      startTime: null,    // 开始时间：队列开始执行的时间戳
      endTime: null,      // 结束时间：队列完成执行的时间戳
    }

    // ===== 内部状态 =====
    // 用于内部状态管理和控制的变量
    this.taskIdCounter = 0      // 任务ID计数器：为每个任务生成唯一ID
    this.processingTimer = null // 处理定时器：用于控制队列处理的定时器引用
  }

  /**
   * 添加任务到队列
   *
   * 这是队列的核心入口方法，负责：
   * 1. 创建任务对象并分配唯一ID
   * 2. 设置任务的配置选项和初始状态
   * 3. 将任务加入队列并按优先级排序
   * 4. 更新统计信息和触发进度回调
   *
   * @param {Function} taskFn - 任务函数，必须返回Promise
   *                           函数签名：(data, options) => Promise
   * @param {Object} data - 任务数据，传递给任务函数的参数
   * @param {Object} options - 任务选项
   * @param {number} options.priority - 优先级（数字越大优先级越高）
   * @param {number} options.maxRetries - 最大重试次数
   * @param {number} options.timeout - 超时时间
   * @returns {number} 返回任务ID，可用于后续的任务跟踪
   */
  addTask(taskFn, data = {}, options = {}) {
    // 生成唯一的任务ID，使用递增计数器确保唯一性
    const taskId = ++this.taskIdCounter

    // 创建任务对象，包含任务的所有信息和状态
    const task = {
      id: taskId,                    // 任务唯一标识符
      fn: taskFn,                    // 任务执行函数
      data,                          // 任务数据

      // 任务配置选项，支持任务级别的配置覆盖
      options: {
        retries: 0,                                              // 当前重试次数
        maxRetries: options.maxRetries || this.config.maxRetries, // 最大重试次数
        priority: options.priority || 0,                         // 任务优先级
        timeout: options.timeout || this.config.timeout,        // 任务超时时间
        ...options                                               // 其他自定义选项
      },

      // 任务状态信息
      status: 'pending',             // 任务状态：pending, executing, completed, failed, retrying
      result: null,                  // 任务执行结果
      error: null,                   // 任务执行错误
      startTime: null,               // 任务开始执行时间
      endTime: null,                 // 任务结束执行时间
      duration: 0                    // 任务执行耗时
    }

    // 将任务加入待执行队列
    this.tasks.push(task)

    // 更新统计信息
    this.stats.total++
    this.stats.pending++

    // 按优先级排序：优先级高的任务排在前面
    // 使用稳定排序确保相同优先级的任务保持添加顺序
    this.tasks.sort((a, b) => b.options.priority - a.options.priority)

    // 触发进度更新回调，通知外部组件状态变化
    this.updateProgress()

    // 返回任务ID，供外部跟踪使用
    return taskId
  }

  /**
   * 批量添加任务
   *
   * 提供批量添加任务的便捷方法，内部调用addTask方法
   * 适用于需要同时添加大量任务的场景
   *
   * @param {Array} taskList - 任务列表
   * @param {Object} taskList[].fn - 任务函数
   * @param {Object} taskList[].data - 任务数据
   * @param {Object} taskList[].options - 任务选项
   * @returns {Array<number>} 返回所有任务的ID数组
   */
  addTasks(taskList) {
    const taskIds = []

    // 遍历任务列表，逐个添加任务
    taskList.forEach(task => {
      const taskId = this.addTask(task.fn, task.data, task.options)
      taskIds.push(taskId)
    })

    return taskIds
  }

  /**
   * 开始执行队列
   *
   * 这是队列执行的主入口，负责：
   * 1. 初始化队列状态和统计信息
   * 2. 启动队列处理循环
   * 3. 返回Promise以支持异步等待队列完成
   *
   * 执行原理：
   * - 使用轮询机制检查队列完成状态
   * - 通过processQueue方法实现并发控制
   * - 支持暂停/恢复/停止等控制操作
   *
   * @returns {Promise} 返回Promise，当队列完成时resolve执行结果
   * @throws {Error} 如果队列已停止则抛出异常
   */
  async start() {
    // 检查队列状态，已停止的队列不能重新启动
    if (this.stopped) {
      throw new Error('队列已停止，请创建新的队列实例')
    }

    // 重置控制状态
    this.paused = false
    this.stats.startTime = Date.now()

    console.log(`[TaskQueue] 开始执行，总任务数: ${this.stats.total}`)

    // 启动队列处理循环
    this.processQueue()

    // 返回Promise，支持异步等待队列完成
    return new Promise((resolve, reject) => {
      // 使用轮询机制检查队列完成状态
      const checkComplete = () => {
        if (this.stopped) {
          reject(new Error('队列已停止'))
          return
        }

        if (this.isComplete()) {
          // 队列完成时的清理工作
          this.stats.endTime = Date.now()
          console.log(`[TaskQueue] 队列执行完成，耗时: ${this.stats.endTime - this.stats.startTime}ms`)

          // 触发队列完成回调
          this.config.onQueueComplete(this.getResults())

          // 解析Promise，返回执行结果
          resolve(this.getResults())
        } else {
          // 队列未完成，继续轮询检查
          setTimeout(checkComplete, 100)
        }
      }
      checkComplete()
    })
  }

  /**
   * 暂停队列执行
   *
   * 暂停机制的特点：
   * 1. 不会中断正在执行的任务
   * 2. 阻止新任务开始执行
   * 3. 可以通过resume方法恢复
   * 4. 保持所有状态信息不变
   */
  pause() {
    this.paused = true
    console.log('[TaskQueue] 队列已暂停')
  }

  /**
   * 恢复队列执行
   *
   * 恢复机制：
   * 1. 重置暂停标志
   * 2. 重新启动队列处理循环
   * 3. 继续处理待执行任务
   */
  resume() {
    if (this.paused) {
      this.paused = false
      console.log('[TaskQueue] 队列已恢复')

      // 重新启动队列处理
      this.processQueue()
    }
  }

  /**
   * 停止队列执行
   *
   * 停止机制的特点：
   * 1. 设置停止和暂停标志
   * 2. 取消所有正在执行的任务
   * 3. 停止后的队列不能恢复，需要创建新实例
   * 4. 使用AbortController实现优雅的任务取消
   */
  stop() {
    this.stopped = true
    this.paused = true

    // 取消所有正在执行的任务
    this.executing.forEach((task) => {
      if (task.abortController) {
        // 发送取消信号给任务
        task.abortController.abort()
      }
    })

    console.log('[TaskQueue] 队列已停止')
  }

  /**
   * 清空队列
   *
   * 清空所有队列数据和统计信息，用于重置队列状态
   */
  clear() {
    this.tasks = []
    this.completed = []
    this.failed = []
    this.executing.clear()
    this.resetStats()
  }

  /**
   * 重置统计信息
   *
   * 将所有统计数据重置为初始值
   */
  resetStats() {
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
   * 处理队列 - 核心调度算法
   *
   * 这是队列的核心调度方法，实现了：
   * 1. 并发控制：限制同时执行的任务数量
   * 2. 状态检查：确保队列在合适的状态下运行
   * 3. 任务分发：从队列中取出任务并执行
   * 4. 循环调度：通过定时器实现持续的任务处理
   *
   * 调度算法：
   * - 检查当前执行任务数是否达到并发上限
   * - 从待执行队列头部取出任务（FIFO + 优先级）
   * - 异步执行任务，不阻塞调度循环
   * - 设置定时器实现下一轮调度
   */
  async processQueue() {
    // 检查队列状态：暂停或停止时不处理任务
    if (this.paused || this.stopped) return

    // 并发控制循环：在不超过并发上限的情况下尽可能多地启动任务
    while (
      !this.paused &&                                    // 未暂停
      !this.stopped &&                                   // 未停止
      this.executing.size < this.config.maxConcurrent && // 未达到并发上限
      this.tasks.length > 0                              // 还有待执行任务
    ) {
      // 从队列头部取出任务（FIFO原则）
      const task = this.tasks.shift()
      this.stats.pending--

      // 异步执行任务，不阻塞调度循环
      this.executeTask(task)
    }

    // 检查是否需要继续调度
    if (!this.isComplete() && !this.paused && !this.stopped) {
      // 设置定时器实现下一轮调度
      // 使用requestInterval控制调度频率，避免过度消耗CPU
      this.processingTimer = setTimeout(() => {
        this.processQueue()
      }, this.config.requestInterval)
    }
  }

  /**
   * 执行单个任务 - 任务执行的核心逻辑
   *
   * 这个方法实现了任务执行的完整生命周期：
   * 1. 状态初始化：设置任务为执行状态
   * 2. 超时控制：使用Promise.race实现超时机制
   * 3. 取消控制：使用AbortController实现任务取消
   * 4. 结果处理：处理成功和失败的情况
   * 5. 清理工作：更新状态和统计信息
   *
   * @param {Object} task - 要执行的任务对象
   */
  async executeTask(task) {
    // ===== 任务执行前的准备工作 =====
    task.status = 'executing'              // 更新任务状态
    task.startTime = Date.now()            // 记录开始时间
    this.executing.set(task.id, task)      // 加入执行中任务集合
    this.stats.executing++                // 更新统计信息

    // 创建AbortController用于任务取消控制
    // 这是现代JavaScript中处理异步操作取消的标准方式
    const abortController = new AbortController()
    task.abortController = abortController

    try {
      // ===== 超时控制机制 =====
      // 创建超时Promise，在指定时间后自动reject
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`任务超时: ${this.config.timeout}ms`))
        }, task.options.timeout)
      })

      // ===== 执行任务 =====
      // 调用任务函数，传递数据和控制选项
      const taskPromise = task.fn({
        ...task.data,
        taskId: task.id                  // 任务ID
      }, abortController.signal)

      // ===== 竞态执行 =====
      // 使用Promise.race实现超时控制
      // 任务完成或超时，哪个先发生就以哪个为准
      const result = await Promise.race([taskPromise, timeoutPromise])

      // ===== 成功处理 =====
      task.status = 'completed'
      task.result = result
      task.endTime = Date.now()
      task.duration = task.endTime - task.startTime

      // 更新统计信息
      this.completed.push(task)
      this.stats.completed++

      console.log(`[TaskQueue] 任务 ${task.id} 执行成功，耗时: ${task.duration}ms`)

      // 触发任务完成回调
      this.config.onTaskComplete(task, 'success')

    } catch (error) {
      // ===== 错误处理 =====
      // 任务执行失败，交给错误处理方法
      await this.handleTaskError(task, error)
    } finally {
      // ===== 清理工作 =====
      // 无论成功还是失败都要执行的清理操作

      // 从执行中任务集合移除
      this.executing.delete(task.id)
      this.stats.executing--

      // 触发进度更新
      this.updateProgress()

      // 添加请求间隔，控制任务执行频率
      if (this.config.requestInterval > 0) {
        await this.sleep(this.config.requestInterval)
      }
    }
  }

  /**
   * 处理任务错误 - 智能重试机制
   *
   * 错误处理策略：
   * 1. 记录错误信息和重试次数
   * 2. 判断是否需要重试（基于重试次数限制）
   * 3. 实现指数退避重试延迟
   * 4. 重试失败则标记为最终失败
   *
   * 指数退避算法：
   * - 第1次重试：延迟 = retryDelay * 1
   * - 第2次重试：延迟 = retryDelay * 2
   * - 第3次重试：延迟 = retryDelay * 3
   *
   * @param {Object} task - 失败的任务对象
   * @param {Error} error - 错误对象
   */
  async handleTaskError(task, error) {
    // 记录错误信息
    task.error = error
    task.options.retries++

    console.warn(`[TaskQueue] 任务 ${task.id} 执行失败 (${task.options.retries}/${task.options.maxRetries}):`, error.message)

    // 判断是否需要重试
    if (task.options.retries < task.options.maxRetries) {
      // ===== 重试逻辑 =====
      task.status = 'retrying'

      // 指数退避延迟：重试次数越多，延迟越长
      // 这样可以避免在系统繁忙时持续给服务器施加压力
      await this.sleep(this.config.retryDelay * task.options.retries)

      // 将任务重新加入队列头部，优先重试
      this.tasks.unshift(task)
      this.stats.pending++

      console.log(`[TaskQueue] 任务 ${task.id} 将进行第 ${task.options.retries + 1} 次重试`)
    } else {
      // ===== 最终失败处理 =====
      // 重试次数用尽，标记为最终失败
      task.status = 'failed'
      task.endTime = Date.now()
      task.duration = task.endTime - task.startTime

      // 更新统计信息
      this.failed.push(task)
      this.stats.failed++

      console.error(`[TaskQueue] 任务 ${task.id} 最终失败:`, error.message)

      // 触发回调通知
      this.config.onTaskComplete(task, 'failed')
      this.config.onError(task, error)
    }
  }

  /**
   * 更新进度 - 实时状态监控
   *
   * 计算和更新队列的执行进度，包括：
   * 1. 各种状态的任务数量统计
   * 2. 完成百分比计算
   * 3. 执行时间统计
   * 4. 触发进度回调通知外部组件
   */
  updateProgress() {
    // 构建进度信息对象
    const progress = {
      total: this.stats.total,                    // 总任务数
      completed: this.stats.completed,            // 已完成数
      failed: this.stats.failed,                  // 失败数
      executing: this.stats.executing,            // 执行中数
      pending: this.stats.pending,                // 待处理数

      // 完成百分比计算：(已完成 + 失败) / 总数 * 100
      percentage: this.stats.total > 0 ?
        Math.round(((this.stats.completed + this.stats.failed) / this.stats.total) * 100) : 0,

      isComplete: this.isComplete(),              // 是否完成

      // 已执行时间计算
      elapsedTime: this.stats.startTime ? Date.now() - this.stats.startTime : 0
    }

    // 触发进度回调，通知外部组件更新UI
    this.config.onProgress(progress)
  }

  /**
   * 检查队列是否完成
   *
   * 完成条件：
   * 1. 没有待执行任务
   * 2. 没有正在执行的任务
   * 3. 有任务被添加过（避免空队列被认为是完成状态）
   *
   * @returns {boolean} 队列是否完成
   */
  isComplete() {
    return this.tasks.length === 0 &&        // 没有待执行任务
           this.executing.size === 0 &&      // 没有正在执行任务
           this.stats.total > 0               // 有任务被添加过
  }

  /**
   * 获取执行结果 - 结果汇总
   *
   * 返回队列执行的完整结果，包括：
   * 1. 统计信息的快照
   * 2. 成功和失败任务的详细信息
   * 3. 执行成功率计算
   *
   * @returns {Object} 执行结果对象
   */
  getResults() {
    return {
      stats: { ...this.stats },              // 统计信息快照
      completed: [...this.completed],        // 成功任务列表
      failed: [...this.failed],              // 失败任务列表
      isSuccess: this.failed.length === 0,   // 是否全部成功

      // 成功率计算
      successRate: this.stats.total > 0 ?
        Math.round((this.stats.completed / this.stats.total) * 100) : 0
    }
  }

  /**
   * 获取队列状态 - 状态查询
   *
   * 返回队列的当前状态信息，用于外部监控
   *
   * @returns {Object} 状态信息对象
   */
  getStatus() {
    return {
      paused: this.paused,                    // 是否暂停
      stopped: this.stopped,                  // 是否停止
      executing: this.executing.size,         // 执行中任务数
      pending: this.tasks.length,             // 待处理任务数
      completed: this.completed.length,       // 已完成任务数
      failed: this.failed.length              // 失败任务数
    }
  }

  /**
   * 更新配置 - 动态配置调整
   *
   * 支持在队列运行时动态调整配置参数
   * 新配置会影响后续的任务执行
   *
   * @param {Object} newConfig - 新的配置参数
   */
  updateConfig(newConfig) {
    // 合并新配置到现有配置
    this.config = { ...this.config, ...newConfig }
    console.log('[TaskQueue] 配置已更新:', newConfig)
  }

  /**
   * 重试失败任务 - 失败任务恢复
   *
   * 将所有失败的任务重新加入队列进行重试
   * 重置任务的重试计数和错误状态
   *
   * 使用场景：
   * 1. 临时网络问题导致的批量失败
   * 2. 服务器恢复后重新处理失败任务
   * 3. 用户手动触发失败任务重试
   */
  retryFailedTasks() {
    // 复制失败任务列表
    const failedTasks = [...this.failed]

    // 清空失败任务记录
    this.failed = []
    this.stats.failed = 0

    // 重置每个失败任务的状态
    failedTasks.forEach(task => {
      // 重置任务状态为初始状态
      task.status = 'pending'
      task.options.retries = 0    // 重置重试计数
      task.error = null           // 清空错误信息
      task.startTime = null       // 清空时间记录
      task.endTime = null
      task.duration = 0

      // 重新加入待执行队列
      this.tasks.push(task)
      this.stats.pending++
    })

    console.log(`[TaskQueue] ${failedTasks.length} 个失败任务已重新加入队列`)

    // 触发进度更新
    this.updateProgress()
  }

  /**
   * 睡眠函数 - 异步延迟工具
   *
   * 提供异步的延迟功能，用于：
   * 1. 重试延迟
   * 2. 请求间隔控制
   * 3. 其他需要延迟的场景
   *
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise} 延迟Promise
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 销毁队列 - 资源清理
   *
   * 完全销毁队列实例，清理所有资源：
   * 1. 停止队列执行
   * 2. 清空所有任务和状态
   * 3. 清理定时器
   * 4. 释放内存引用
   *
   * 销毁后的队列实例不能再使用
   */
  destroy() {
    // 停止队列执行
    this.stop()

    // 清空所有数据
    this.clear()

    // 清理定时器
    if (this.processingTimer) {
      clearTimeout(this.processingTimer)
    }

    console.log('[TaskQueue] 队列已销毁')
  }
}

/**
 * 创建专门用于商品规格保存的任务队列
 *
 * 这是一个专门针对商品规格保存场景优化的工厂函数
 *
 * 配置特点：
 * 1. 低并发数（2）：避免数据库死锁
 * 2. 较长间隔（200ms）：减少数据库压力
 * 3. 多次重试（3次）：提高成功率
 * 4. 长超时时间（15s）：适应数据库操作
 *
 * @param {Object} options - 配置选项，会覆盖默认配置
 * @returns {TaskQueue} 配置好的任务队列实例
 */
export function createSpecificationTaskQueue(options = {}) {
  // 商品规格保存的默认配置
  const defaultConfig = {
    maxConcurrent: 2,     // 低并发数：避免数据库死锁
    requestInterval: 200, // 较长间隔：减少数据库压力
    maxRetries: 3,        // 多次重试：提高成功率
    retryDelay: 1500,     // 重试延迟：给数据库恢复时间
    timeout: 15000,       // 长超时：适应数据库操作耗时
  }

  // 合并用户配置和默认配置
  return new TaskQueue({ ...defaultConfig, ...options })
}

/**
 * 任务队列工厂函数 - 预设配置模板
 *
 * 提供多种预设配置模板，适应不同的使用场景
 *
 * 预设类型：
 * 1. default：通用场景的平衡配置
 * 2. highConcurrency：高并发场景，适合轻量级任务
 * 3. lowConcurrency：低并发场景，适合重量级任务
 * 4. specification：商品规格专用配置
 *
 * @param {string} type - 队列类型，决定使用哪个预设配置
 * @param {Object} options - 自定义配置，会覆盖预设配置
 * @returns {TaskQueue} 配置好的任务队列实例
 */
export function createTaskQueue(type = 'default', options = {}) {
  // 预设配置模板
  const presets = {
    // 默认配置：适合大多数场景的平衡配置
    default: {
      maxConcurrent: 3,      // 中等并发数
      requestInterval: 100,  // 中等间隔
      maxRetries: 3,         // 标准重试次数
      retryDelay: 1000,      // 标准重试延迟
      timeout: 30000,        // 标准超时时间
    },

    // 高并发配置：适合轻量级任务，追求高吞吐量
    highConcurrency: {
      maxConcurrent: 10,     // 高并发数
      requestInterval: 50,   // 短间隔
      maxRetries: 2,         // 较少重试
      retryDelay: 500,       // 短重试延迟
      timeout: 10000,        // 短超时时间
    },

    // 低并发配置：适合重量级任务，追求稳定性
    lowConcurrency: {
      maxConcurrent: 1,      // 串行执行
      requestInterval: 500,  // 长间隔
      maxRetries: 5,         // 多次重试
      retryDelay: 2000,      // 长重试延迟
      timeout: 60000,        // 长超时时间
    },

    // 商品规格专用配置：针对数据库操作优化
    specification: {
      maxConcurrent: 2,      // 低并发避免死锁
      requestInterval: 200,  // 适中间隔
      maxRetries: 3,         // 标准重试
      retryDelay: 1500,      // 适中延迟
      timeout: 15000,        // 适中超时
    }
  }

  // 获取预设配置，如果类型不存在则使用默认配置
  const config = presets[type] || presets.default

  // 合并预设配置和用户配置，返回队列实例
  return new TaskQueue({ ...config, ...options })
}

// 导出TaskQueue类作为默认导出
export default TaskQueue
