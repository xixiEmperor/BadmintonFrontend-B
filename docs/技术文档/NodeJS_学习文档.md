## Node.js 学习文档（工程实践版）

面向实际工程与日常开发场景，系统梳理 Node.js 核心能力与常用模块，示例均为可直接运行的最小化代码片段。按模块组织，HTTP 模块仅作简述。

- 适用读者：具备 JavaScript 基础的前端/全栈/后端同学
- Node 版本建议：长期支持版（LTS，如 v18/20/22），保持与生产环境一致

### 目录
- 基础与运行环境
  - 版本管理与 CLI
  - 模块系统（CJS/ESM）与包管理
  - 事件循环与异步模型
  - 调试、性能分析与诊断
- 核心模块与能力
  - Buffer（二进制）、Stream（流）与背压
  - 事件系统（EventEmitter）
  - 文件系统（fs / fs/promises）与路径（path、URL）
  - 进程（process）与系统（os）
  - 子进程（child_process）与多线程（worker_threads）
  - 网络：TCP/UDP（net、dgram）、TLS/加密（crypto、tls）、压缩（zlib）
  - DNS、定时器（timers）、诊断通道（diagnostics_channel）、性能（perf_hooks）
  - Web 能力：fetch、URL、AbortController、Web Streams
- 简述：HTTP/HTTPS/HTTP2
- 测试与覆盖率（node:test）
- 安全与最佳实践
- 常见陷阱与排错清单
- 学习路线建议与参考资料

---

## 基础与运行环境

### 版本管理与 CLI

- 推荐使用 `nvm` 或 `fnm` 管理多版本 Node，确保与生产一致。
- 常用 CLI：
  - `node -v` / `npm -v` / `pnpm -v`
  - `node --version`、`node --help`
  - `node --inspect`（调试）、`node --trace-gc`（GC 追踪）、`node --max-old-space-size=4096`（内存上限）
  - `node --watch`（开发时监听重启，v18+）
  - `node --env-file=.env`（读取环境变量文件，v20+）

### 模块系统（CJS/ESM）与包管理

- CommonJS（CJS）与 ES Modules（ESM）并存：
  - CJS：`require()` / `module.exports`
  - ESM：`import` / `export`，`package.json` 中 `"type": "module"`
- 互操作：
  - 在 ESM 中没有 `__dirname`/`__filename`，需通过 `import.meta.url` 与 `url.fileURLToPath` 构造。
  - 在 CJS 中可通过 `import()` 动态加载 ESM。
- 包导出：使用 `package.json` 的 `exports`、`imports` 与条件导出（`node`, `default`, `types` 等）组织公共 API。

示例（ESM 下 `__dirname` 替代）：
```js
// file: esm-demo.mjs  或 package.json 中 { "type": "module" }
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log({ __filename, __dirname });
```

包管理：
- 首选 `pnpm`（复用缓存、硬链接，高效），其次 `npm`/`yarn`。
- 锁定版本并提交锁文件（`pnpm-lock.yaml` / `package-lock.json`）。

### 事件循环与异步模型

- 宏任务阶段：`timers` → `pending callbacks` → `idle/prepare` → `poll` → `check` → `close callbacks`
- 微任务：`Promise.then/catch/finally`、`queueMicrotask`，在每个宏任务阶段末尾清空。
- 特殊队列：`process.nextTick` 优先于微任务（谨慎使用，避免饿死）。
- 对比：`setImmediate` 在 `check` 阶段，`setTimeout(..., 0)` 在 `timers` 阶段。

顺序示例：
```js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('microtask'));
process.nextTick(() => console.log('nextTick'));
// 可能输出：nextTick → microtask → timeout | immediate（取决于 I/O 与阶段切换）
```

基于 Promise 的定时器（v15+）：
```js
import { setTimeout as sleep } from 'node:timers/promises';
await sleep(100);
```

### 调试、性能分析与诊断

- 调试：`node --inspect`（或 `--inspect-brk` 首行断点），使用 Chrome DevTools 或 VSCode。
- 性能：
  - `--prof`/`--prof-process` 生成与解析 CPU 分析
  - `--trace-gc`，`--heap-prof`，`--heapsnapshot-signal=SIGUSR2`
  - `perf_hooks`（`PerformanceObserver`、`eventLoopUtilization`）
- 诊断：`diagnostics_channel` 订阅内部事件；`inspector` 模块直连协议。

---

## 核心模块与能力

### Buffer（二进制）

- Buffer 是 Node 专有的二进制容器（非 TypedArray 但基于 ArrayBuffer）。
- 常见操作：编码转换、文件/网络二进制处理、加密/压缩输入。

```js
const buf = Buffer.from('你好', 'utf8');
console.log(buf.toString('hex')); // e4bda0e5a5bd
const again = Buffer.from(buf).toString('utf8');
console.log(again);
```

零拷贝要点：优先传递 Buffer 引用（避免 toString/concat 大量复制）。

### Stream（流）与背压（Backpressure）

- 类型：`Readable`、`Writable`、`Duplex`、`Transform`。
- 优势：节省内存、边读边写、处理大文件/长连接。
- 背压：`write()` 返回 `false` 需暂停上游；`drain` 事件恢复。

管道与 Promise 化（推荐）：
```js
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

await pipeline(
  createReadStream('input.log'),
  createGzip(),
  createWriteStream('input.log.gz')
);
```

Web Streams 互转：`stream/web`、`Readable.fromWeb`、`Writable.toWeb`。

### 事件系统（EventEmitter）

```js
import { EventEmitter } from 'node:events';
import { once } from 'node:events';

const bus = new EventEmitter();
bus.setMaxListeners(50); // 避免监听器过多告警

setTimeout(() => bus.emit('ready', 42), 10);
const [value] = await once(bus, 'ready');
console.log(value); // 42
```

要点：
- 使用 `once`/`off` 管理生命周期，防止内存泄漏。
- 大型系统倾向显式流或消息队列，EventEmitter 更适合进程内解耦。

### 文件系统（fs / fs/promises）与路径（path、URL）

首选 Promise API：
```js
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dir = join(__dirname, 'tmp');
await mkdir(dir, { recursive: true });

const file = join(dir, 'data.json');
await writeFile(file, JSON.stringify({ t: Date.now() }));
console.log(JSON.parse(await readFile(file, 'utf8')));
console.log((await stat(file)).size);
```

文件变更监听：
```js
import { watch } from 'node:fs';
const watcher = watch('./', { recursive: true });
for await (const e of watcher) {
  console.log(e.eventType, e.filename);
}
```

路径与 URL：
- `path.posix`/`path.win32` 跨平台处理
- `fileURLToPath` 与 `pathToFileURL` 互转

### 进程（process）与系统（os）

```js
import process from 'node:process';
import os from 'node:os';

console.log(process.pid, process.cwd());
console.log(process.env.NODE_ENV);
console.log(os.platform(), os.cpus().length);

process.on('SIGTERM', () => {
  console.log('graceful shutdown');
  process.exit(0);
});
```

要点：
- 使用信号优雅退出（`SIGINT`、`SIGTERM`）。
- 通过 `resourceUsage`/`memoryUsage` 监控资源。
- 使用 `process.env` 管理配置（配合 `--env-file`）。

### 子进程（child_process）与多线程（worker_threads）

- 子进程适合调用系统工具、独立脚本；多线程适合 CPU 密集型 JS 计算。

子进程：
```js
import { execFile, spawn } from 'node:child_process';

// 避免命令注入：优先 execFile，禁用 shell
execFile('node', ['-v'], (err, stdout) => {
  if (err) throw err;
  console.log(stdout.trim());
});

// 流式读取大输出
const ls = spawn('ls', ['-la'], { stdio: ['ignore', 'pipe', 'inherit'] });
ls.stdout.on('data', (chunk) => process.stdout.write(chunk));
```

多线程：
```js
// main.mjs
import { Worker } from 'node:worker_threads';
const worker = new Worker(new URL('./worker.mjs', import.meta.url), { workerData: 10000000 });
worker.on('message', (m) => console.log('sum =', m));
worker.on('error', console.error);

// worker.mjs
import { parentPort, workerData } from 'node:worker_threads';
let sum = 0;
for (let i = 0; i < workerData; i++) sum += i;
parentPort.postMessage(sum);
```

说明：`cluster` 方案已不再推荐新项目使用，优先用 `worker_threads` + 进程管理器（如 systemd、容器编排或 PM2）。

### 网络：TCP/UDP（net、dgram）、TLS/加密（crypto、tls）、压缩（zlib）

TCP：
```js
// tcp-server.mjs
import net from 'node:net';
const server = net.createServer((socket) => {
  socket.write('hello');
  socket.on('data', (d) => console.log('client:', d.toString()));
});
server.listen(3000);

// tcp-client.mjs
import net from 'node:net';
const socket = net.createConnection(3000);
socket.on('data', (d) => console.log('server:', d.toString()));
socket.write('hi');
```

UDP：
```js
import dgram from 'node:dgram';
const s = dgram.createSocket('udp4');
s.on('message', (msg, rinfo) => console.log('recv', msg.toString(), rinfo.port));
s.bind(41234, () => {
  s.send(Buffer.from('ping'), 41234, '127.0.0.1');
});
```

Crypto：
```js
import { createHash, createHmac, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const sha256 = createHash('sha256').update('data').digest('hex');
const hmac = createHmac('sha256', 'secret').update('data').digest('hex');

const key = randomBytes(32);
const iv = randomBytes(16);
const cipher = createCipheriv('aes-256-ctr', key, iv);
const enc = Buffer.concat([cipher.update('hello'), cipher.final()]);
const decipher = createDecipheriv('aes-256-ctr', key, iv);
const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString();
```

压缩（含 Brotli）：
```js
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createBrotliCompress } from 'node:zlib';
await pipeline(createReadStream('a.txt'), createBrotliCompress(), createWriteStream('a.txt.br'));
```

TLS：`tls.createServer` / `tls.connect` 提供加密传输，实际项目常通过反向代理（如 Nginx）处理 TLS 终止。

### DNS、定时器、诊断与性能

DNS：
```js
import dns from 'node:dns/promises';
console.log(await dns.lookup('example.com'));
console.log(await dns.resolve4('example.com'));
```

定时器：`timers` / `timers/promises`，优先使用 Promise 版本并配合 `AbortController` 实现可取消：
```js
import { setTimeout } from 'node:timers/promises';
const ac = new AbortController();
setTimeout(10_000, undefined, { signal: ac.signal }).catch(() => {});
ac.abort();
```

性能（perf_hooks）：
```js
import { performance, PerformanceObserver } from 'node:perf_hooks';

const obs = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) console.log(entry.name, entry.duration);
});
obs.observe({ entryTypes: ['measure'] });

performance.mark('A');
// do work
performance.mark('B');
performance.measure('A->B', 'A', 'B');
```

事件循环利用率：
```js
import { eventLoopUtilization } from 'node:perf_hooks';
let elu = eventLoopUtilization();
setInterval(() => {
  const delta = eventLoopUtilization(eventLoopUtilization(), elu);
  elu = delta;
  console.log('ELU', delta.utilization.toFixed(3));
}, 1000);
```

诊断通道（diagnostics_channel）：
```js
import dc from 'node:diagnostics_channel';
const ch = dc.channel('my:step');
ch.subscribe((message) => console.log('diag', message));
ch.publish({ t: Date.now(), step: 'start' });
```

### Web 能力：fetch、URL、AbortController、Web Streams

- v18+ 提供全局 `fetch`（基于 undici）。
- 使用 `AbortController` 取消请求；`URL`/`URLSearchParams` 构造请求。

```js
const ctrl = new AbortController();
const p = fetch('https://httpbin.org/delay/3', { signal: ctrl.signal });
setTimeout(() => ctrl.abort(), 100);
try { await p; } catch (e) { console.log('aborted'); }
```

Web Streams：
```js
const res = await fetch('https://example.com');
const reader = res.body.getReader();
let total = 0;
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  total += value.byteLength;
}
console.log('bytes', total);
```

---

## 简述：HTTP/HTTPS/HTTP2（少说）

- HTTP 服务：`http.createServer((req, res) => { ... })`，或使用 Koa/Express/Fastify 等框架。
- HTTPS：与 TLS 证书结合（`https.createServer`），生产常由网关/代理终止。
- HTTP/2：`http2.createServer` 支持多路复用与服务器推送（现多用 HTTP/2，无需过度手写底层）。

建议：应用层首选成熟框架，关注中间件、路由、校验、鉴权、可观测性。

---

## 测试与覆盖率（node:test）

Node 内置测试框架（v18+）：
```js
// math.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

function add(a, b) { return a + b; }

test('add', () => {
  assert.equal(add(1, 2), 3);
});
```

运行：
```bash
node --test
```

并行/子测试、跳过与仅运行：
```js
test('group', async (t) => {
  await t.test('case 1', () => {});
  await t.test('case 2', { only: true }, () => {});
});
```

覆盖率：
- Node 20+ 提供内置覆盖率（在部分平台上），或使用 `c8` 基于 V8 覆盖率。

---

## 安全与最佳实践

- 依赖安全：启用 `npm audit`/`pnpm audit`，定期升级。
- 配置管理：环境变量 + `.env`（`--env-file`）；避免把密钥写入代码库。
- 输入校验与序列化：避免命令/路径注入、原型污染（对象合并时小心）。
- 子进程安全：优先 `execFile`，禁用 shell；限制 `maxBuffer`，流式处理。
- 资源管理：
  - 文件/网络/流及时关闭；`pipeline`/`finished` 确认完成
  - 背压友好；大文件分块
  - 避免 `nextTick` 滥用导致事件循环饥饿
- 错误处理：
  - `unhandledRejection`/`uncaughtException` 记录并快速退出 + 由外部重启
  - 使用 `AbortController` 可取消异步任务
  - 保持幂等与可重试
- 可观测性：结构化日志（JSON），Trace/Metric/Log 三件套，关键区段打点（`perf_hooks`）。
- 权限模型（实验特性）：`--experimental-permission` 精细限制文件/网络访问，按版本文档使用。

---

## 常见陷阱与排错清单

- ESM/CJS 互操作：`__dirname` 缺失 → 使用 `import.meta.url` + `fileURLToPath`。
- 事件循环顺序误判：微任务/`nextTick` 优先级导致 UI 卡顿或饿死。
- 流背压未处理：`write()` 返回 `false` 未暂停上游，导致内存暴涨。
- 大对象 JSON 序列化：阻塞事件循环 → 使用流式或 `worker_threads`。
- 文件监听差异：不同平台行为不一致 → 引入库（如 chokidar）或退回轮询。
- 子进程缓冲区溢出：`exec` 默认 `maxBuffer` 太小 → 改用 `spawn` 流式。
- TLS/证书问题：路径、权限、链证书配置错误最常见。
- DNS 缓存与解析差异：服务发现要设置合理 TTL 与重试。

---

## 学习路线建议与参考资料

建议路径：
1) 掌握模块系统（CJS/ESM）、事件循环、Buffer/Stream 基础
2) 熟练使用 fs/path、process/os、child_process/worker_threads
3) 理解网络（net/dgram/tls）、crypto、zlib 的常用场景
4) 熟练诊断：调试、`perf_hooks`、日志、覆盖率
5) 工程化与安全：配置、权限、依赖、监控、部署

官方与社区资料（按主题检索最新版本文档）：
- Node.js 官方文档（API、指南、发布说明）
- V8/Chromium 文档（性能、覆盖率）
- WHATWG/TC39 规范（URL、Streams、语言特性）
- 优质社区框架文档（Express/Koa/Fastify 等）

---

## 附：实用片段速查

异步重试（带退避）：
```js
export async function retry(fn, { retries = 5, base = 100 } = {}) {
  let err;
  for (let i = 0; i < retries; i++) {
    try { return await fn(); } catch (e) {
      err = e; await new Promise(r => setTimeout(r, base * 2 ** i));
    }
  }
  throw err;
}
```

限速并发（简单版）：
```js
export async function mapLimit(items, limit, mapper) {
  const ret = []; let i = 0; const workers = new Set();
  async function run() {
    const idx = i++; if (idx >= items.length) return;
    const p = Promise.resolve(mapper(items[idx], idx)).then((v) => { ret[idx] = v; workers.delete(p); });
    workers.add(p);
    if (workers.size >= limit) await Promise.race(workers);
    await run();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return ret;
}
```

结构化日志：
```js
function log(level, msg, extra = {}) {
  const record = { level, msg, time: new Date().toISOString(), pid: process.pid, ...extra };
  process.stdout.write(JSON.stringify(record) + '\n');
}
log('info', 'service started', { port: 3000 });
```

优雅退出：
```js
const signals = ['SIGINT', 'SIGTERM'];
for (const s of signals) process.on(s, async () => {
  try { /* close server/db */ } finally { process.exit(0); }
});
```

---

以上文档覆盖了 Node.js 在工程中的主要能力点，HTTP 模块按你的要求仅作简述。可在此基础上结合实际项目逐步深化（如：框架选型、配置化、A/B 测试、可观测性、灰度与扩缩容策略等）。

