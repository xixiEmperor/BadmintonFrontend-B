## Telemetry/实时能力 SDK 中台化可行方案（草案）

### 1. 背景与目标
- 将当前散落于单一业务（如 `admin-frontend`）内的埋点/遥测与实时能力封装为“技术中台”前端公共 SDK，统一对外供 B 端、C 端、其他前台应用复用。
- 目标：
  - 统一埋点规范与上报链路；降低重复接入成本。
  - 支持实时能力（基于 Socket.IO）在多业务场景复用（订单、预约、消息等）。
  - 平台化能力：采样、批量上报、离线兜底、远程配置/特性开关、合规控制。

不改变后端边界：后端负责采集接口、配置、聚合与告警；前端 SDK 仅负责采集与可靠发送。

### 2. 范围与不在范围
- 范围：
  - 前端 Telemetry SDK 抽离与包化；Realtime Hook（Socket.IO 客户端）抽离与包化。
  - 基础对接协议与数据结构约定；接入指引与最佳实践。
  - 管理后台的无感迁移与回归验证。
- 不在范围：
  - 后端数据建模与大盘可视化实现细节（另见服务端方案）。

### 3. 总体方案与架构
- 前端（技术中台包）
  - `@company/telemetry`：埋点/错误/性能/接口统计，内置采样、缓冲、批量上报、TaskQueue 可靠发送、flush 兜底。
  - `@company/realtime`：基于 Socket.IO 的可复用 Hook（自动重连、鉴权、房间订阅、事件总线）。
- 后端（平台服务）
  - `POST /api/telemetry/batch`、`GET /api/telemetry/config`、`GET /api/flags`；限流、校验与脱敏；TTL 与离线聚合任务。
- 业务应用（如 `admin-frontend`）
  - 仅作为消费方：在入口初始化、在路由/请求拦截器/错误钩子触发埋点；按需使用实时能力。

示意目录（建议采用 pnpm workspace monorepo）：

```
root/
  packages/
    telemetry/              # @company/telemetry（TS、无第三方运行时依赖）
    realtime/               # @company/realtime（socket.io-client 封装）
  apps/
    admin-frontend/         # 现有项目，改为依赖包
  .pnpm-workspace.yaml
```

### 4. 技术选型
- 语言与构建：TypeScript + tsup（产出 ESM/CJS + d.ts），或 Rollup 均可。
- 运行依赖：
  - telemetry：零运行依赖（仅使用原生 `fetch`）；复用现有 `src/utils/TaskQueue.ts` 能力（以工厂函数隔离配置）。
  - realtime：`socket.io-client`（已在文档中建议）。
- 质量保证：ESLint + TypeScript 严格模式 + 单元测试（Vitest/Jest）。

### 5. 包 API 设计（对齐现有实现）
- `@company/telemetry`
  - `Telemetry.init({ app, release, endpoint, user?, sampleRate? })`
  - `Telemetry.setUser(user?)`
  - `Telemetry.trackPageView(name, props?)`
  - `Telemetry.trackEvent(name, props?)`
  - `Telemetry.trackError(name, message, stack?, fatal?)`
  - `Telemetry.trackPerf(name, props)`
  - `Telemetry.trackApi(name, status, durationMs, props?)`
  - `Telemetry.flush()`
  - 说明：API 与 `src/monitoring/telemetry.ts` 完全一致，迁移成本低。

- `@company/realtime`
  - `useSocketIO({ url, token?, autoJoinRooms? }) -> { connected, on, emit, lastMessage }`
  - 说明：基于 Socket.IO 封装自动重连、鉴权、房间订阅，暴露统一消息入口。

### 6. 数据契约与上报规范（摘要）
- 事件通用字段：`type(page|event|error|perf|api)`, `name`, `ts`, `props`, `user`, `sessionId?`, `app`, `release`。
- 采样：前端在 push 前判定；默认 B 端全量，C 端 1%~5%，可远程配置覆盖。
- 批量与可靠性：内存缓冲阈值（默认 20）触发；TaskQueue 控制并发、重试与超时；页面隐藏/卸载 `flush`。

### 7. 实施里程碑与交付物
- 里程碑 M1（1～2 天）
  - 建立 pnpm workspace；抽出 `packages/telemetry`，迁移现有实现，完善类型与 README。
  - 交付：`@company/telemetry` 可本地构建与链接，单元测试覆盖核心逻辑（采样、缓冲、flush、队列调度）。

- 里程碑 M2（1～2 天）
  - 抽出 `packages/realtime`，实现 `useSocketIO` 与示例；加入最小单测。
  - 交付：`@company/realtime` 可本地构建与链接，示例页验证连接/重连/订阅能力。

- 里程碑 M3（1～2 天）
  - `apps/admin-frontend` 替换为依赖包接入；完成路由/接口/错误/性能埋点与实时能力回归。
  - 交付：回归通过，无功能回退；上报成功率 > 99%。

- 里程碑 M4（可选，1 周）
  - 接入远程配置与特性开关；完善告警与合规策略文档；对接看板。
  - 交付：按环境/角色灰度采样可控；开关一键熔断。

### 8. 迁移步骤（对当前 `admin-frontend`）
1) 在根目录初始化 pnpm workspace；创建 `packages/telemetry` 与 `packages/realtime`。
2) 将 `src/monitoring/telemetry.ts` 移入 `packages/telemetry/src/index.ts`，保持导出 `Telemetry` 单例与类型一致；抽取对 `TaskQueue` 的依赖为工厂函数 `createTelemetryTaskQueue`（从现有 `src/utils/TaskQueue.ts` 复用实现或复制轻量版本）。
3) 在 `apps/admin-frontend` 中：
   - 替换导入为 `import { Telemetry } from '@company/telemetry'`。
   - 入口 `Telemetry.init(...)`，在请求拦截器/路由与错误钩子中按文档接入。
   - 如需实时能力，按需引入 `@company/realtime` 的 `useSocketIO`。
4) 本地验证与无痕回滚：保留原文件一份临时备份分支；若出现回归，1 次命令回滚到原实现。

### 9. 合规与安全
- 采样与开关：支持远程配置动态调整采样；暴露全局总开关（禁用所有上报）。
- 数据最小化：默认避免 PII；若需上报（如 userId），须按规范脱敏/哈希。
- 传输与存储：限制批量大小与字段长度；后端限流与来源校验；事件 TTL（30～90 天）。

### 10. 运维与监控
- 健康指标：上报成功率、失败分布（4xx/5xx/网络）、队列滞留量、flush 触发频率、页面卸载兜底命中率。
- 告警：错误率 > 2%，API P95 > 阈值，WS 断连率 > 阈值；具备抖动抑制。

### 11. 风险与回滚
- 风险：打包体积增长、与现有请求封装重复埋点、弱网下多次重试对带宽影响。
- 化解：
  - 体积：telemetry 零依赖；realtime 独立可选装。
  - 冲突：统一在封装层落单点埋点，避免页面层重复。
  - 带宽：严格采样与批量阈值；上报接口限流与压缩（如需）。
- 回滚：预留 feature flag 与依赖切换开关；保留原实现分支，可快速回退。

### 12. 工作量预估
- 前端 SDK 抽离与验证：3～5 人日。
- 管理后台接入与回归：1～2 人日。
- 可选远程配置与看板联动：5～10 人日（视现状）。

### 13. 验收标准
- 功能：B 端全链路埋点与实时能力无回退；事件入库结构与规范一致。
- 质量：无控制台报错；类型检查与 ESLint 通过；核心单测覆盖 > 80%。
- 性能与稳定：
  - 上报成功率 ≥ 99%。
  - 批量上报不阻塞主线程；弱网下指数退避有效。
  - 体积增量可控（telemetry < 5KB gzip，realtime 受 socket.io-client 影响）。

### 14. 附：接入要点速查
- 入口：
```ts
import { Telemetry } from '@company/telemetry'

Telemetry.init({
  app: 'admin',
  release: import.meta.env.VITE_APP_VERSION ?? 'dev',
  endpoint: '/api/telemetry/batch',
  sampleRate: 1,
})
```
- 请求拦截器：在请求/响应处记录 `start` 与 `durationMs`，成功/失败均 `trackApi`。
- 路由：监听 `useLocation()`，进入 `trackPageView`，离开上报停留时长。
- 错误：注册 `error/unhandledrejection` 全局捕获。
- 性能：接入 `web-vitals`，通过 `trackPerf` 上报。

— 完 —


