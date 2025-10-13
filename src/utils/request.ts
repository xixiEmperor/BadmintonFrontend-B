/**
 * HTTP 请求封装工具类
 * - 基于 axios 的二次封装：统一拦截、取消重复请求、超时与通用错误处理
 * - 通过 AbortController 防重复与主动取消相同 url+method 的并行请求
 * - 注意：若后端返回结构不统一（有时包 data，有时不包），上层应做一次 unwrap 以兼容
 */

import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * HTTP请求类
 * 封装了axios的基本功能，提供统一的请求处理机制
 */
class HttpRequest {
  // 请求的基础URL地址
  private baseUrl: string
  // 存储待处理请求的AbortController，用于防止重复请求
  private pending: Record<string, AbortController>

  /**
   * 构造函数
   * @param baseUrl 请求的基础URL地址
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.pending = {}
  }

  /**
   * 获取axios默认配置
   * 设置基础URL、请求头、超时时间等默认配置
   * @returns 返回axios配置对象
   */
  /**
   * 获取 axios 默认配置
   */
  getInsideConfig() {
    const config = {
      baseURL: this.baseUrl, // 设置请求的基础URL
      headers: {
        'Content-Type': 'application/json;charset=utf-8' // 设置请求头为JSON格式
      },
      timeout: 10000 // 设置请求超时时间为10秒
    }
    return config
  }

  /**
   * 移除待处理的请求
   * 如果是请求阶段且存在相同请求，则取消该请求
   * @param key 请求的唯一标识（url + method）
   * @param isRequest 是否为请求阶段，true表示在发送请求前调用
   */
  /**
   * 移除待处理的请求（如果在请求阶段发现重复，则取消旧请求）
   */
  removePending(key: string, isRequest = false) {
    // 如果存在相同的请求且是在请求阶段，则取消该请求
    if (this.pending[key] && isRequest) {
      this.pending[key].abort() // 使用AbortController的abort方法取消请求
    }
    // 从待处理列表中删除该请求
    delete this.pending[key]
  }

  /**
   * 设置请求和响应拦截器
   * 在请求发送前和响应返回后进行统一处理
   * @param instance axios实例
   */
  /**
   * 注册请求/响应拦截器：
   * - 请求：注入 token、去重、注入 AbortController.signal
   * - 响应：统一成功/失败的 Promise 语义、清理去重表
   */
  interceptors(instance: AxiosInstance) {
    // 请求拦截器：在发送请求前执行
    instance.interceptors.request.use(
      config => {
        // 从本地存储获取认证token
        const token = localStorage.getItem('token')
        if (token) {
          // 如果token存在，则在请求头中添加Authorization字段
          config.headers.Authorization = 'Bearer ' + token
        }
        
        // 生成请求的唯一标识（url + 请求方法）
        const key = config.url + '&' + config.method
        // 移除相同的待处理请求（如果存在则取消）
        this.removePending(key, true)
        
        // 为当前请求创建独立的AbortController
        const abortController = new AbortController()
        config.signal = abortController.signal
        // 将AbortController存储到待处理列表中
        this.pending[key] = abortController
        
        return config
      },
      err => {
        // 请求错误处理
        return Promise.reject(err)
      }
    )

    // 响应拦截器：在接收到响应后执行
    instance.interceptors.response.use(
      res => {
        // 生成请求的唯一标识
        const key = res.config.url + '&' + res.config.method
        // 请求完成，从待处理列表中移除
        this.removePending(key)
        
        // 判断响应状态码
        if (res.status === 200) {
          // 请求成功，返回响应数据
          return Promise.resolve(res.data)
        } else {
          // 请求失败，返回错误信息
          return Promise.reject(res)
        }
      },
      err => {
        // 响应错误处理
        return Promise.reject(err)
      }
    )
  }

  /**
   * 创建请求实例并发送请求
   * 合并默认配置和自定义配置，应用拦截器后发送请求
   * @param options axios请求配置参数
   * @returns 返回Promise对象
   */
  /**
   * 统一请求入口
   */
  request(options: AxiosRequestConfig) {
    // 创建axios实例
    const instance = axios.create()
    // 合并默认配置和传入的配置
    const newOptions = Object.assign(this.getInsideConfig(), options)
    // 为实例设置拦截器
    this.interceptors(instance)
    // 发送请求并返回Promise
    return instance(newOptions)
  }

  /**
   * 发送GET请求
   * @param url 请求地址
   * @param config 可选的axios配置参数
   * @returns 返回Promise<AxiosResponse>
   */
  /** 便捷 GET */
  get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    // 构建GET请求的配置对象
    const options = Object.assign(
      {
        method: 'get', // 设置请求方法为GET
        url: url      // 设置请求地址
      },
      config // 合并额外的配置参数
    )
    // 调用request方法发送请求
    return this.request(options)
  }

  /**
   * 发送POST请求
   * @param url 请求地址
   * @param data 可选的请求体数据
   * @returns 返回Promise<AxiosResponse>或Promise<HttpResponse>
   */
  /** 便捷 POST */
  post(url: string, data?: unknown): Promise<AxiosResponse> {
    // 调用request方法发送POST请求
    return this.request({
      method: 'post', // 设置请求方法为POST
      url: url,       // 设置请求地址
      data: data      // 设置请求体数据
    })
  }

  /**
   * 发送PUT请求
   * @param url 请求地址
   * @param data 可选的请求体数据
   * @returns 返回Promise<AxiosResponse>
   */
  /** 便捷 PUT */
  put(url: string, data?: unknown): Promise<AxiosResponse> {
    // 调用request方法发送PUT请求
    return this.request({
      method: 'put', // 设置请求方法为PUT
      url: url,      // 设置请求地址
      data: data     // 设置请求体数据
    })
  }

  /**
   * 发送DELETE请求
   * @param url 请求地址
   * @param config 可选的axios配置参数
   * @returns 返回Promise<AxiosResponse>
   */
  /** 便捷 DELETE */
  delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    // 调用request方法发送DELETE请求
    return this.request({
      method: 'delete', // 设置请求方法为DELETE
      url: url,        // 设置请求地址
      ...config        // 合并额外的配置参数
    })
  }
}


const request = new HttpRequest('http://localhost:8080')

// 导出HttpRequest类作为默认导出
export default request

