## 后端样板：Express + Mongoose + WebSocket（socket.io 或 ws）

> 以下为骨架示例，聚焦路由/模型/WS 初始化与关键中间件，实际项目按需拆分与增强。

### 1. Mongoose 模型（TelemetryEvent / FeatureFlag）

```ts
// models/TelemetryEvent.ts
import mongoose from 'mongoose'

const TelemetryEventSchema = new mongoose.Schema({
  app: String,
  env: String,
  release: String,
  userId: String,
  sessionId: String,
  type: { type: String, enum: ['page', 'event', 'error', 'perf', 'api'] },
  name: String,
  props: Object,
  ts: { type: Date, default: Date.now }
}, { timestamps: true })

// TTL 90 天
TelemetryEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 })

export default mongoose.model('TelemetryEvent', TelemetryEventSchema)
```

```ts
// models/FeatureFlag.ts
import mongoose from 'mongoose'

const FeatureFlagSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  enabled: Boolean,
  rules: Object, // { role: ['admin'], percent: 50 }
  startAt: Date,
  endAt: Date,
}, { timestamps: true })

export default mongoose.model('FeatureFlag', FeatureFlagSchema)
```

### 2. 路由（Telemetry、Config、Flags）

```ts
// routes/telemetry.ts
import { Router } from 'express'
import TelemetryEvent from '../models/TelemetryEvent'

const router = Router()

// 批量上报
router.post('/batch', async (req, res) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : []
    if (!events.length) return res.json({ ok: true, saved: 0 })
    await TelemetryEvent.insertMany(events.map((e) => ({ ...e, ts: new Date(e.ts || Date.now()) })), { ordered: false })
    res.json({ ok: true, saved: events.length })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

// 配置（采样、黑白名单等）
router.get('/config', async (_req, res) => {
  res.json({ sampleRate: 1, maxBatch: 50, flushIntervalMs: 10000 })
})

export default router
```

```ts
// routes/flags.ts
import { Router } from 'express'
import FeatureFlag from '../models/FeatureFlag'

const router = Router()

router.get('/', async (_req, res) => {
  const flags = await FeatureFlag.find({ enabled: true }).lean()
  res.json({ flags })
})

export default router
```

### 3. WebSocket 初始化（以 socket.io 为例）

```ts
// ws/index.ts
import { Server } from 'socket.io'
import type { Server as HTTPServer } from 'http'

export function initWs(server: HTTPServer) {
  const io = new Server(server, { cors: { origin: /localhost|your-domain/ } })

  io.use((socket, next) => {
    // 简易鉴权：从 query 或 headers 解析 token
    // 验证后在 socket.data 写入 { userId, role }
    next()
  })

  io.on('connection', (socket) => {
    const { userId, role } = socket.data || {}
    if (userId) socket.join(`user:${userId}`)
    if (role) socket.join(`role:${role}`)

    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }))
    socket.on('disconnect', () => {})
  })

  return io
}
```

### 4. 应用入口（Express）

```ts
// app.ts
import express from 'express'
import http from 'http'
import mongoose from 'mongoose'
import telemetryRoutes from './routes/telemetry'
import flagRoutes from './routes/flags'
import { initWs } from './ws'

async function bootstrap() {
  await mongoose.connect(process.env.MONGO_URI as string)
  const app = express()
  app.use(express.json({ limit: '500kb' }))

  app.use('/api/telemetry', telemetryRoutes)
  app.use('/api/flags', flagRoutes)

  const server = http.createServer(app)
  const io = initWs(server)

  // 示例业务事件广播
  // io.to('role:admin').emit('reservation:update', { id: 1, status: 'PAID' })

  const port = Number(process.env.PORT || 8080)
  server.listen(port, () => console.log(`Server on ${port}`))
}

bootstrap().catch((e) => {
  console.error(e)
  process.exit(1)
})
```


