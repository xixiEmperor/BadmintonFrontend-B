/**
 * useWebSocket
 *
 * 原生 WebSocket 的极简 React Hook 封装，提供：
 * - 心跳保活（定时发送 `ping`）
 * - 指数退避自动重连（带最大上限）
 * - JSON 消息自动解析（解析失败时返回原始数据）
 *
 * 使用建议：
 * - 适用于无需引入 Socket.IO 等更重库的轻量实时场景
 * - 鉴权可通过带 token 的 URL 或首次发送鉴权包实现
 *
 * 约定：
 * - 心跳消息格式：{ type: 'ping', ts: number }
 * - 服务端若回 { type: 'pong' }，会被忽略不进入 lastMessage
 *
 * 注意：该 Hook 仅适用于浏览器环境。
 *
 * @template T 服务端消息解析后的类型（默认 unknown）
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseWebSocketOptions {
  /**
   * WebSocket 连接地址（可携带鉴权参数）
   * 例：wss://host/ws?token=xxx
   */
  url: string
  /**
   * 心跳发送间隔（毫秒）。默认 15000ms。
   * 心跳仅在连接处于 OPEN 状态时发送。
   */
  heartbeatInterval?: number
  /**
   * 重连初始延时（毫秒）。默认 1000ms。
   * 每次失败后按 2 倍指数退避增长，直到达到 reconnectMaxDelay 上限。
   */
  reconnectInitialDelay?: number
  /**
   * 重连延时最大值（毫秒）。默认 30000ms。
   */
  reconnectMaxDelay?: number
}

export function useWebSocket<T = unknown>({ url, heartbeatInterval = 15000, reconnectInitialDelay = 1000, reconnectMaxDelay = 30000 }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<T | null>(null)
  const reconnectDelayRef = useRef(reconnectInitialDelay)
  const heartbeatTimerRef = useRef<number | null>(null)

  /**
   * 停止并清理心跳定时器，避免重复计时与内存泄漏
   */
  const clearHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }

  /**
   * 启动心跳：周期性发送 `{ type: 'ping' }` 以保活与链路探测
   */
  const startHeartbeat = useCallback(() => {
    clearHeartbeat()
    heartbeatTimerRef.current = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', ts: Date.now() }))
      }
    }, heartbeatInterval)
  }, [heartbeatInterval])

  /**
   * 建立连接并绑定事件：open/close/error/message
   * - open：标记连接成功、重置退避延时、启动心跳
   * - close：标记断开、清理心跳，并按指数退避发起重连
   * - error：交由 close 兜底处理重连
   * - message：优先 JSON 解析；若为 `pong` 则忽略
   */
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectDelayRef.current = reconnectInitialDelay
        startHeartbeat()
      }

      ws.onclose = () => {
        setConnected(false)
        clearHeartbeat()
        // 指数退避重连
        const delay = reconnectDelayRef.current
        const next = Math.min(delay * 2, reconnectMaxDelay)
        reconnectDelayRef.current = next
        setTimeout(() => connect(), delay)
      }

      ws.onerror = () => {
        // 交给 onclose 处理重连
      }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data?.type === 'pong') return
          setLastMessage(data as T)
        } catch {
          // 非 JSON 消息：直接透传原始数据
          setLastMessage((evt.data as unknown) as T)
        }
      }
    } catch {
      // 初次连接失败，走重连
      setTimeout(() => connect(), reconnectDelayRef.current)
    }
  }, [url, reconnectInitialDelay, reconnectMaxDelay, startHeartbeat])

  useEffect(() => {
    connect()
    return () => {
      // 组件卸载或依赖变化时：停止心跳并主动关闭连接
      clearHeartbeat()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  /**
   * 发送一条 JSON 序列化后的消息。
   * 仅在连接处于 OPEN 状态时发送；否则静默丢弃（可按需改为排队/报错）。
   */
  const send = useCallback((payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { connected, lastMessage, send }
}

export default useWebSocket


