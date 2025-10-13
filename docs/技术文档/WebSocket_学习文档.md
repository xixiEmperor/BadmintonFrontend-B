## WebSocket 新手到进阶：从原生 ws 到 socket.io（前端 + Express 后端）

> 面向新手的循序渐进教程：先掌握原生 WebSocket 基础，再逐步增强（心跳、重连、消息协议、订阅），最后平滑过渡到 socket.io（前后端都有清晰步骤）。

---

### 目录

- 学习路线与准备
- 第一章：原生 WebSocket（前端基础）
- 第二章：原生 WebSocket（Express + ws 后端最小可运行）
- 第三章：原生方案进阶（心跳/重连/消息协议/订阅）
- 第四章：从原生过渡到 socket.io（为什么 & 怎么做）
- 第五章：socket.io 实现（后端与前端）
- 第六章：本地联调（Vite 代理）与生产部署（Nginx/TLS/会话保持）
- 第七章：安全与性能最佳实践
- 第八章：常见问题与排障清单
- 第九章：在本仓库落地（文件位置与示例）

---

### 学习路线与准备

- 你将学到：
  - 原生 WebSocket 的基本 API 与事件
  - 用 Express + ws 写一个最小可运行的服务端
  - 给原生方案加上心跳、重连、消息协议、订阅
  - 为什么很多团队会选择 socket.io，以及如何一步步切换
  - 本地联调、生产部署、安全与排障
- 环境要求：已安装 Node.js（≥ 18），包管理器（pnpm 或 npm/yarn），前端使用 Vite（本仓库已具备）。
- 术语速记：
  - 原生 ws：浏览器或 Node 的 WebSocket 协议，无额外功能。
  - ws 包：Node 社区的 WebSocket 实现库（后端用）。
  - socket.io：在 WebSocket 之上提供重连、房间、命名空间等更高层能力。

---

### 协议与握手原理（深入）

- 握手流程：浏览器先发起 HTTP/1.1 请求，携带 `Upgrade: websocket` 和 `Connection: Upgrade` 等头，服务端返回 `101 Switching Protocols`，随后双方切换到 WebSocket 帧协议。
- 关键头：
  - `Sec-WebSocket-Key`（客户端随机 Base64，服务端以固定 GUID `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` 拼接后做一次 SHA-1，再 Base64，作为 `Sec-WebSocket-Accept` 返回，用于校验握手不被中间人篡改）。
  - `Sec-WebSocket-Version`（通常 13）。
- HTTP/2/3 与 WebSocket：常见部署仍以 HTTP/1.1 Upgrade 为主；HTTP/2 的扩展 CONNECT 也可承载，但需要代理/网关支持。
- 帧与有序性：同一连接上的 WebSocket 文本/二进制帧顺序到达且不分片乱序（协议保证），但不提供消息持久化与重传——掉线即丢失，需业务层设计 ACK/补发。
- Keep-Alive 与心跳：TCP KeepAlive 与应用层 ping/pong 目的不同。前者由内核维护，粒度粗且默认阈值长；应用层心跳可细粒度探活与自愈，实际工程中两者可并存，但以应用层心跳为主。

---

### 第一章：原生 WebSocket（前端基础）

#### 1.1 原生 API 速览

- 创建连接：`const ws = new WebSocket('ws://host/ws')`
- 事件：`onopen`、`onmessage`、`onerror`、`onclose`
- 发送消息：`ws.send(JSON.stringify({ type: 'hello' }))`
- 关闭连接：`ws.close()`

#### 1.2 浏览器控制台快速体验

```js
// 打开浏览器 DevTools Console 后粘贴：
const ws = new WebSocket('ws://localhost:8080/ws')
ws.onopen = () => console.log('open')
ws.onmessage = (e) => console.log('message:', e.data)
ws.onclose = () => console.log('close')
// 连接后可发送：
// ws.send(JSON.stringify({ type: 'echo', data: 'hi' }))
```

说明：若此时没有本地后端，会连接失败。继续学习下一章先启动后端再测。

#### 1.3 在 React 组件中使用（最小示例）

```tsx
import { useEffect, useRef, useState } from 'react'

export default function WsDemo() {
  const wsRef = useRef<WebSocket | null>(null)
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws')
    wsRef.current = ws
    ws.onopen = () => setLog((l) => [...l, 'open'])
    ws.onmessage = (e) => setLog((l) => [...l, `message: ${e.data}`])
    ws.onclose = () => setLog((l) => [...l, 'close'])
    return () => ws.close()
  }, [])

  return (
    <div>
      <button onClick={() => wsRef.current?.send(JSON.stringify({ type: 'echo', data: 'hello' }))}>发送</button>
      <pre>{log.join('\n')}</pre>
    </div>
  )
}
```

#### 1.4 概念澄清：前端 ws 实例 vs 服务端 ws 实例

- 前端通过 `const ws = new WebSocket('ws://...')` 创建的是浏览器侧对象。
- 服务端在 `wss.on('connection', (ws) => { ... })` 回调里的 `ws` 是“后端为这条连接创建的会话对象”。两者不在同一运行环境，不能互为同一对象，但通过网络一一对应。
- 收发对照：
  - 前端发送：`ws.send(JSON.stringify(payload))`
  - 前端接收：`ws.onmessage = (e) => { /* e.data */ }`
  - 后端接收：`ws.on('message', (raw) => { /* raw.toString() */ })`
  - 后端发送：`ws.send(JSON.stringify(payload))`

---

### 第二章：原生 WebSocket（Express + ws 后端最小可运行）

#### 2.1 安装依赖

```sh
# 使用 pnpm（推荐）
pnpm add ws express
pnpm add -D @types/ws @types/express typescript ts-node ts-node-dev

# 或使用 npm
# npm i ws express
# npm i -D @types/ws @types/express typescript ts-node ts-node-dev
```

#### 2.2 最小可运行服务

```ts
// server.ts
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'

const app = express()
app.use(express.json())
app.get('/api/ping', (_req, res) => res.json({ ok: true }))

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }))
  ws.on('message', (raw) => {
    // 简单 echo
    ws.send(raw.toString())
  })
})

server.listen(8080, () => console.log('HTTP/WS on :8080'))
```

运行：`npx ts-node-dev server.ts`（或把脚本写进 package.json）。

#### 2.3 前后端联调

- 前端用第一章的 React 组件或浏览器 Console 连接 `ws://localhost:8080/ws`。
- 点击发送或 `ws.send(...)`，观察消息回显（echo）。

到这里，你已经完成“从 0 到 1”的最小可运行 Demo。

---

### 第三章：原生方案进阶（心跳/重连/消息协议/订阅）

#### 3.1 统一消息协议

```ts
// 建议在前后端共享的类型文件中定义
export interface WsMessage<T = unknown> {
  type: string
  data?: T
  ts?: number
  requestId?: string
}
```

约定：

- 心跳：客户端定期发送 `{ type: 'ping' }`，服务端回 `{ type: 'pong' }`。
- 业务：`type` 使用模块前缀，如 `order:update`、`notice:new`。

#### 3.2 前端：加上心跳与重连（指数退避）

```ts
// src/hooks/useWebSocket.ts（示例实现）
import { useEffect, useRef, useState, useCallback } from 'react'

export function useWebSocket<T = any>({ url, heartbeatInterval = 15000 }: { url: string; heartbeatInterval?: number }) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<T | null>(null)
  const [retryMs, setRetryMs] = useState(1000)
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
      if (wsRef.current?.readyState === WebSocket.OPEN) {
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
        setRetryMs(1000)
        startHeartbeat()
      }

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data)
          if (data?.type !== 'pong') setLastMessage(data as T)
        } catch {
          setLastMessage((evt.data as unknown) as T)
        }
      }

      ws.onclose = () => {
        setConnected(false)
        clearHeartbeat()
        const next = Math.min(retryMs * 2, 30000)
        setRetryMs(next)
        setTimeout(connect, retryMs)
      }
    } catch {
      setTimeout(connect, retryMs)
    }
  }, [url, retryMs])

  useEffect(() => {
    connect()
    return () => {
      clearHeartbeat()
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { connected, lastMessage, send }
}
```

##### 3.2.1 心跳/探活原理（为什么需要心跳）

- 保活：NAT/代理/网关会清理空闲连接，定期心跳可维持活性。
- 探活：对端断网/进程崩溃时，内核不一定立刻感知，心跳超时可快速识别僵死连接并重连。
- 自愈：结合指数退避重连，弱网下自动恢复。
- 层次差异：
  - TCP KeepAlive：系统级，默认间隔长；可作为兜底。
  - WebSocket 控制帧 ping/pong：Node(ws)可用，浏览器无主动 API，但会自动响应服务端的 ping。
  - 应用层心跳：浏览器常用做法，发送 `{ type: 'ping' }`，服务端回 `{ type: 'pong' }`。

推荐：15–30s 心跳间隔；2–3 倍超时；最大重连间隔 30s（带抖动）。

#### 3.3 后端：心跳保活与简单鉴权

```ts
// server-advanced.ts
import express from 'express'
import http from 'http'
import { WebSocketServer } from 'ws'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  // 可选：简单鉴权（从查询参数获取 token）
  const url = new URL(req.url || '', 'http://localhost')
  const token = url.searchParams.get('token')
  if (token !== 'dev') {
    ws.close(4001, 'unauthorized')
    return
  }

  let alive = true
  ws.on('pong', () => (alive = true))
  const timer = setInterval(() => {
    if (!alive) return ws.terminate()
    alive = false
    ws.ping()
  }, 30000)

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
      }
    } catch {}
  })

  ws.on('close', () => clearInterval(timer))
})

server.listen(8080, () => console.log('HTTP/WS on :8080'))
```

#### 3.4 订阅与“房间”思路（原生 ws）

原生 ws 没有房间的概念，可用内存结构模拟：

```ts
// 仅演示：使用 Map<string, Set<WebSocket>> 维护订阅
const channels = new Map<string, Set<any>>()
function join(channel: string, ws: any) {
  if (!channels.has(channel)) channels.set(channel, new Set())
  channels.get(channel)!.add(ws)
}
function leaveAll(ws: any) {
  channels.forEach((set) => set.delete(ws))
}
function broadcast(channel: string, payload: any) {
  channels.get(channel)?.forEach((client) => {
    if (client.readyState === 1) client.send(JSON.stringify(payload))
  })
}
```

客户端发送 `{ type: 'subscribe', data: { channel: 'role:admin' } }`，服务端把连接加入对应的 Set；业务发生时调用 `broadcast('role:admin', {...})`。

##### 3.4.1 原理与注意事项（原生“房间/广播”）

- 概念对应：原生 ws 没有“房间”，我们用 `Map<string, Set<WebSocket>>` 模拟“频道/房间”；`join/leave/broadcast` 都靠我们维护。
- 生命周期：必须在连接 `close/error` 时把该连接从所有房间移除，避免内存泄漏。
- 广播语义：
  - 发给自己：`ws.send(...)`（点对点）
  - 发给房间：`channels.get(room)?.forEach(client => client.send(...))`
  - 发给所有：遍历所有连接集合（需额外维护 allClients 集合）。
- 多实例/多进程：原生实现是“进程内”的，不能跨实例共享。若部署了多实例：
  - 需要引入集中式发布/订阅（Redis/Kafka）转发消息到各实例，再由各实例对本进程内的连接广播。
  - 或在掉线重连后由客户端重新拉取“快照+增量”，降低强实时一致性要求。

---

### 第四章：从原生过渡到 socket.io（为什么 & 怎么做）

#### 4.1 为什么选择 socket.io

- 自动重连（带策略）、内建心跳
- 房间与命名空间（便于权限与分组广播）
- 事件语义（基于事件名，不必手写 message 类型分发）
- 更好的浏览器兼容与调试生态

不足：协议不是原生 ws 帧；需要额外客户端依赖。

#### 4.2 迁移策略（最小改动）

- 后端：引入 socket.io，保留 Express 结构，替换 ws 初始化。
- 前端：只在连接与事件监听层做替换，其余业务不变。

---

### 第五章：socket.io 实现（后端与前端）

#### 5.0 原理补充：`io`、`namespace`、`socket` 与中间件

- `io`：Socket.IO 服务器实例，顶层广播与命名空间管理入口（`io.emit`、`io.to(room).emit`）。
- `namespace`：命名空间（默认 `'/'`，也可 `'/admin'`），可为不同模块配置独立中间件与事件。
- `socket`：某个客户端在某命名空间上的一次连接会话对象。不是浏览器的 WebSocket 对象。
- 中间件执行链：
  1) 连接级：`io.use(mw)` 在握手阶段执行，可校验 token、挂载 `socket.data`。
  2) 命名空间级：`io.of('/ns').use(mw)` 仅作用当前命名空间。
  3) 事件级：`socket.use((packet, next) => ...)` 在每次事件处理前执行，适合做细粒度鉴权/限流。
- 错误传递：`next(new Error('unauthorized'))` 会触发前端 `connect_error` 或事件错误。

#### 5.1 后端（Express + socket.io）

```ts
// app-sio.ts
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: /localhost|127\.0\.0\.1/ } })

io.use((socket, next) => {
  const token = (socket.handshake.auth?.token || socket.handshake.query?.token) as string | undefined
  if (token !== 'dev') return next(new Error('unauthorized'))
  socket.data.user = { id: 'u1', role: 'admin' }
  next()
})

io.on('connection', (socket) => {
  const { id, role } = socket.data.user || {}
  if (id) socket.join(`user:${id}`)
  if (role) socket.join(`role:${role}`)

  socket.on('ping', () => socket.emit('pong', { ts: Date.now() }))
  // 业务广播示例：
  // io.to('role:admin').emit('reservation:update', { id: 1, status: 'PAID' })
})

server.listen(8080, () => console.log('socket.io on :8080'))
```

#### 5.1.1 事件级中间件示例

```ts
io.on('connection', (socket) => {
  socket.use(([event, payload], next) => {
    if (event.startsWith('admin:') && socket.data.user?.role !== 'admin') {
      return next(new Error('forbidden'))
    }
    next()
  })
})
```

#### 5.2 前端（socket.io-client）

```ts
// 安装：pnpm add socket.io-client
import { io } from 'socket.io-client'

const socket = io('http://localhost:8080', { auth: { token: 'dev' } })
socket.on('connect', () => console.log('connected'))
socket.on('pong', (data) => console.log('pong', data))
socket.on('reservation:update', (payload) => console.log(payload))

// 发送：
socket.emit('ping')
```

对比原生方案：无需手写重连、房间与心跳逻辑，代码更聚焦业务。

#### 5.3 `socket` 对象详解（服务端）

- 常用属性：
  - `socket.id`（唯一连接 ID，断线重连会变化）
  - `socket.data`（用户自定义会话数据，如 `{ id, role }`）
  - `socket.handshake`（`auth`、`query`、`headers` 等握手信息）
  - `socket.rooms`（已加入的房间集合）
  - `socket.nsp`（命名空间对象）
- 常用方法：
  - `socket.emit(event, payload)`（发给当前连接）
  - `socket.on(event, handler)`（接收当前连接事件）
  - `socket.join(room)` / `socket.leave(room)`（加入/退出房间）
  - `socket.to(room).emit(event, payload)`（向房间广播，不含自己）
  - `io.to(room).emit(event, payload)`（向房间广播，含自己）
  - `socket.disconnect()`（主动断开）

#### 5.4 房间（rooms）与广播（broadcast）概念（socket.io）

- 房间（Room）：逻辑分组，便于按用户/角色/业务模块定向推送。
  - 加入：`socket.join('user:123')`、`socket.join('role:admin')`
  - 退出：`socket.leave('role:admin')`
  - 查询：`socket.rooms` 是一个 `Set<string>`
- 广播（Broadcast）：向一组连接发送事件。
  - 向所有连接：`io.emit(event, payload)`
  - 向房间（含自己）：`io.to(room).emit(event, payload)`
  - 向房间（不含自己）：`socket.to(room).emit(event, payload)`
  - 多房间：`io.to(['role:admin', 'role:ops']).emit(...)`
- 场景最佳实践：
  - 点对点：`io.to('user:' + userId).emit('notice', payload)`
  - 按角色：`io.to('role:admin').emit('reservation:update', payload)`
  - 模块频道：`io.to('channel:orders').emit('orders:refresh', payload)`
- 多实例部署：
  - Socket.IO 提供官方适配器（Redis adapter），可实现跨实例房间与广播：`io.adapter(createAdapter(redisClient))`
  - 没有共享适配器时，只能向当前实例的连接广播；重连落到不同实例会看不到历史消息，应配合快照+增量策略。

---

### 第六章：本地联调（Vite 代理）与生产部署

#### 6.1 Vite 代理（含 WebSocket）

```ts
// vite.config.ts（示意）
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5000,
    open: true,
    proxy: {
      '/ws': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
      // socket.io 默认路径 /socket.io
      '/socket.io': { target: 'http://localhost:8080', ws: true, changeOrigin: true },
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
```

#### 6.2 Nginx 反向代理（WebSocket 升级）

```nginx
server {
  listen 80;
  server_name example.com;

  location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  location /socket.io/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }
}
```

部署要点：生产使用 `wss://`，证书在反向代理终止；多实例部署建议会话保持或后端使用共享发布（如 Redis Pub/Sub）。

#### 6.3 代理/LB 超时与会话保持原理

- 超时：很多代理/网关对空闲连接有读超时（如 Nginx `proxy_read_timeout`）。心跳能避免被误判为闲置；必要时适当增大超时。
- 会话保持：断线重连可能落到不同实例，若需要维持“订阅/房间”，需：
  - 启用四层/七层粘性会话，或
  - 用共享存储（如 Redis）同步订阅，或
  - 重连后由客户端重新鉴权并订阅（推荐简化方案）。
- HTTP/2 与 WebSocket：实际生产链路通常仍以 HTTP/1.1 Upgrade 为主，视网关支持而定。

---

### 第七章：安全与性能最佳实践

- 连接鉴权：使用短期 JWT 或一次性 token；避免长期 token 暴露。
- 权限隔离：“用户房间”“角色房间”广播；敏感事件需服务端二次校验。
- 限流与背压：限制单连接速率与队列长度，服务端高频事件批量合并（100–300ms）。
- 资源开销：心跳建议 15–30s；断网重连采用指数退避（上限 30s）。
- 日志与审计：连接/断开/错误/鉴权失败都要落盘，便于排障。

---

### 第八章：常见问题与排障清单

- 101/Upgrade 失败：反向代理是否透传 `Upgrade/Connection`？路径与端口是否一致？
- Mixed Content：HTTPS 页面下用 `ws://` 会被拦截，应改 `wss://`。
- CORS/跨域：本地通过 Vite 代理；socket.io 服务端需设置 `cors`。
- 没有消息：JSON 解析失败或 `type` 不匹配；确认服务端确实 `send/emit` 了。
- 重连风暴：退避上限过低；服务端限流策略缺失。
- 生产不稳定：未做心跳；Nginx/SLB 没有会话保持；实例间未共享广播。

---

### 第九章：在本仓库落地（文件位置与示例）

- 前端：
  - 优先完善 `src/hooks/useWebSocket.ts` 为第三章的“进阶版本”。
  - 页面示例可在 `src/pages/DashBoard/DashBoard.tsx` 临时接入测试按钮与消息展示。
  - 配置 `VITE_WS_URL`（.env）或直接写死 `ws://localhost:8080/ws` 做本地联调。
- 后端：
  - 若暂无后端项目，可用本文“第二章/第三章”的 `server.ts` 与 `server-advanced.ts` 直接启动。
  - 若需要房间/授权等高级能力，按“第五章”替换为 socket.io。
- 参考阅读：
  - `docs/backend-telemetry-ws-sample.md`（socket.io 样例骨架）
  - `升级方案-实时能力与监控埋点.md`（整体实时能力与观测方案）

---

附：快速检查清单（给新手）

- 能否跑通“最小 Demo”（第二章）：连接成功并收到 echo？
- 前端是否加入了心跳与重连（第三章 3.2）？
- 是否定义了统一的消息 `type`（第三章 3.1）？
- 是否需要“房间/订阅”？若是，考虑直接采用 socket.io（第四/五章）。
- Vite 代理是否配置 `ws: true`？Nginx 是否透传 Upgrade？


---

### 后端实现（Express）

#### 方案一：Express + ws（轻量、原生协议）

```ts
// server.ts（TypeScript，或改为 .js）
import express from 'express'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'

const app = express()
app.use(express.json())

// 业务 REST 接口
app.get('/api/ping', (_req, res) => res.json({ ok: true }))

const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

function verifyToken(token?: string) {
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret') as { uid: string; role?: string }
  } catch {
    return null
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', 'http://localhost')
  const token = url.searchParams.get('token') || undefined
  const user = verifyToken(token)
  if (!user) {
    ws.close(4001, 'unauthorized')
    return
  }

  // 心跳保活
  let alive = true
  ws.on('pong', () => (alive = true))
  const interval = setInterval(() => {
    if (!alive) return ws.terminate()
    alive = false
    ws.ping()
  }, 30000)

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      if (msg?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
      }
      if (msg?.type === 'echo') {
        ws.send(JSON.stringify({ type: 'echo', data: msg.data, ts: Date.now() }))
      }
    } catch {}
  })

  ws.on('close', () => clearInterval(interval))
})

const PORT = Number(process.env.PORT || 8080)
server.listen(PORT, () => console.log(`HTTP/WS on :${PORT}`))
```

要点：

- 使用 `path: '/ws'` 与前端 URL 对齐。
- 通过查询参数 `token` 做简单鉴权，生产建议使用短期 JWT 并校验来源。
- 心跳：服务端 `ping`/客户端 `pong`；客户端也可主动 `ping`。

#### 方案二：Express + socket.io（房间/重连/命名空间更易用）

```ts
// app.ts
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: /localhost|127\.0\.0\.1/ } })

io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token
  try {
    const user = jwt.verify(String(token), process.env.JWT_SECRET || 'dev_secret') as any
    socket.data.user = { id: user.uid, role: user.role }
    next()
  } catch {
    next(new Error('unauthorized'))
  }
})

io.on('connection', (socket) => {
  const { id, role } = socket.data.user || {}
  if (id) socket.join(`user:${id}`)
  if (role) socket.join(`role:${role}`)

  socket.on('ping', () => socket.emit('pong', { ts: Date.now() }))
  socket.on('disconnect', () => {})
})

// 业务示例：向管理员广播
// io.to('role:admin').emit('reservation:update', { id: 1, status: 'PAID' })

const PORT = Number(process.env.PORT || 8080)
server.listen(PORT, () => console.log(`HTTP/WS on :${PORT}`))
```

要点：

- 自带心跳与重连，房间/命名空间易用。
- 客户端需引入 socket.io-client，对接更简单，但协议不是原生 WebSocket 帧。

---

### 消息约定与可靠性

- 类型与命名：`type` 使用模块前缀，如 `order:update`、`reservation:reviewed`；事件名（socket.io）同理。
- 可靠性模型：WebSocket 不保证持久与重传，掉线期间消息会丢失，需业务补偿：
  - 至少一次：发送方带 `requestId`，接收方处理后 `ack`；服务端记录未确认队列并补发；接收方处理需幂等。
  - 有序性：单连接内帧有序，跨连接/广播不保证；可携带 `seq` 并在客户端按序或容忍乱序。
  - 快照 + 增量：重连后先拉快照（REST），再接收增量 WS 消息补齐。
- 去抖/合并渲染：高频事件（如状态变更）本地 200–500ms 合并，减少重渲染。
- 背压与流控原理：
  - 观察缓冲：浏览器 `WebSocket.bufferedAmount` / Node `ws.bufferedAmount`。
  - 策略：限速、丢弃低优先级、批量合并、分片广播、用“状态快照”代替大量细粒度变更。
  - 服务端：避免重 CPU 阻塞；按需引入消息队列/事件总线解耦。

---

### 安全与权限

- 鉴权：短期 JWT（5–15 分钟）；刷新用 HTTPS API，WS 连接仅校验当前短期票据。
- 域名白名单与 CORS：限制 `origin`，生产使用 `wss://` 与 HSTS。
- 权限隔离：加入 `user:{id}`、`role:{role}` 等房间，按权限广播。
- 限流：连接数/IP 限制、消息频率限制、防止滥用。
- 日志与审计：连接/断开/鉴权失败/异常消息都应记录。

---

### 本地联调与部署

#### Vite 代理

- 确保对 `/ws` 开启 `ws: true`，对 `/api` 常规代理；见前文配置。

#### Nginx 反向代理（WebSocket 升级）

```nginx
server {
  listen 80;
  server_name example.com;

  location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
  }

  location /api {
    proxy_pass http://127.0.0.1:8080;
  }
}
```

要点：

- HTTPS：使用 `wss://`，证书由反代终止。
- 会话保持：若多实例，需四层或七层粘性会话，或使用集中式状态（如 Redis Pub/Sub）。

---

### 常见问题与排障

- 连接 101 失败：检查反向代理是否正确透传 `Upgrade/Connection` 头与路径前缀。
- 前端收不到消息：确认后端广播的 `type` 与前端订阅/处理一致；检查 JSON 序列化。
- 断网重连异常：确保指数退避不超上限；网络恢复后清理旧连接再重连。
- 本地跨域：Vite 代理 `ws: true`；socket.io 需配置 `cors`。
- 心跳空转：避免过短心跳（<10s）导致资源浪费，建议 15–30s。

---

### 与本仓库对齐（落地指引）

- 前端 Hook：本仓库已有 `src/hooks/useWebSocket.ts` 骨架，可按本文「Hook 封装」完善心跳/重连/鉴权。
- 示例使用：在需要实时刷新的页面（如订单、预约、仪表盘）按需调用，结合本地状态做合并渲染。
- 参考文档：
  - `docs/backend-telemetry-ws-sample.md`（含 Express + socket.io 样例骨架）
  - `升级方案-实时能力与监控埋点.md`（整体实时能力与观测方案）

---

### 自测脚本（可选）

#### 简易 ws 服务端（无鉴权）

```js
// quick-ws.js
const http = require('http')
const { WebSocketServer } = require('ws')
const server = http.createServer()
const wss = new WebSocketServer({ server, path: '/ws' })
wss.on('connection', (ws) => {
  ws.on('message', (d) => ws.send(d))
  ws.send(JSON.stringify({ type: 'welcome', ts: Date.now() }))
})
server.listen(8080, () => console.log('WS on :8080'))
```

#### 浏览器 Console 自测

```js
const ws = new WebSocket('ws://localhost:8080/ws')
ws.onmessage = e => console.log(e.data)
ws.onopen = () => ws.send(JSON.stringify({ type: 'echo', data: 'hi' }))
```

---

### 参考

- WebSocket RFC 6455：`https://datatracker.ietf.org/doc/html/rfc6455`
- MDN WebSocket：`https://developer.mozilla.org/en-US/docs/Web/API/WebSocket`
- socket.io：`https://socket.io/`


