/**
 * useWebSocket（骨架）
 * - 心跳/重连/订阅/鉴权
 * - 事件监听注册/卸载
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export interface UseWebSocketOptions {
  url: string // 如 wss://host/ws?token=xxx
  heartbeatInterval?: number // ms
  reconnectInitialDelay?: number // ms
  reconnectMaxDelay?: number // ms
}

export function useWebSocket<T = unknown>({ url, heartbeatInterval = 15000, reconnectInitialDelay = 1000, reconnectMaxDelay = 30000 }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<T | null>(null)
  const reconnectDelayRef = useRef(reconnectInitialDelay)
  const heartbeatTimerRef = useRef<number | null>(null)

  const clearHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current)
      heartbeatTimerRef.current = null
    }
  }

  const startHeartbeat = () => {
    clearHeartbeat()
    heartbeatTimerRef.current = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping', ts: Date.now() }))
      }
    }, heartbeatInterval)
  }

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
          // 非 JSON 消息
          setLastMessage((evt.data as unknown) as T)
        }
      }
    } catch {
      // 初次连接失败，走重连
      setTimeout(() => connect(), reconnectDelayRef.current)
    }
  }, [url, reconnectInitialDelay, reconnectMaxDelay])

  useEffect(() => {
    connect()
    return () => {
      clearHeartbeat()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  const send = useCallback((payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { connected, lastMessage, send }
}

export default useWebSocket


