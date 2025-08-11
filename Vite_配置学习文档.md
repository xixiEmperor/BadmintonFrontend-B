### Vite 配置学习文档（结合本项目实践）

适用版本与上下文：
- vite: ^7.0.4（本项目）
- @vitejs/plugin-react: ^4.6.0（React 19 快速刷新）
- TypeScript: ~5.8.3
- React 19、react-router-dom 7、Ant Design 5、Zustand、@tanstack/react-query、ECharts 6、Tailwind 3 + DaisyUI

本文以你的项目实际配置为样例，覆盖核心配置项、常见优化、环境变量、代理、CSS/Tailwind、构建与部署实战，并附备忘清单。

---

### 1. 快速上手与项目现状

项目 `package.json` 脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

当前 `vite.config.ts` 关键点：
- 插件：`@vitejs/plugin-react`
- 路径别名：`@ -> ./src`
- 开发服务器：`port: 5000`，启动自动打开浏览器；预留了 `proxy` 注释
- 构建：`outDir: dist`，`assetsDir: assets`，`minify: esbuild`，`sourcemap: false`

示例（等价于当前配置）：

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5000,
    open: true,
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
  },
})
```

提示：本仓库 `package.json` 使用 `"type": "module"`。若在 ESM 环境中 `__dirname` 未定义，可使用如下方式：

```ts
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// 之后可使用 path.resolve(__dirname, './src')
```

---

### 2. 配置文件结构与核心概念

- 配置入口：`vite.config.ts`（建议使用 `defineConfig` 获取类型提示）
- 两种运行模式：
  - `dev`（开发）：`vite`
  - `build`（生产构建）：`vite build`
  - `preview`（本地预览生产包）：`vite preview`
- 条件式配置：

```ts
export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'
  return {
    // 可基于 isBuild / mode 分支控制配置
  }
})
```

---

### 3. 常用配置详解（含最佳实践）

#### 3.1 路径解析 `resolve`

- 项目已设置别名 `@ -> ./src`。
- 请与 TypeScript `tsconfig.json` 的 `paths` 保持一致：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

如果需要多别名：

```ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '#assets': path.resolve(__dirname, './src/assets'),
  },
}
```

#### 3.2 插件 `plugins`

- `@vitejs/plugin-react`：集成 React 19 Fast Refresh、JSX 处理等。
- 构建分析（可选）：

```bash
pnpm add -D rollup-plugin-visualizer
```

```ts
import { visualizer } from 'rollup-plugin-visualizer'

plugins: [
  react(),
  visualizer({ open: true, gzipSize: true, brotliSize: true }),
]
```

#### 3.3 开发服务器 `server`

常用字段：
- `port`: 端口（本项目为 5000）
- `open`: 自动打开浏览器
- `host`: 是否可通过局域网访问（`true` 或指定 IP）
- `strictPort`: 端口被占用时直接退出
- `proxy`: 反向代理 API 或 WebSocket

示例（REST + WebSocket 代理）：

```ts
server: {
  host: true,
  port: 5000,
  open: true,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      secure: false,
      // rewrite: path => path.replace(/^\/api/, ''),
    },
    '/ws': {
      target: 'ws://localhost:9000',
      ws: true,
    },
  },
}
```

HMR 在代理或 HTTPS 反代下异常时，可尝试：

```ts
server: {
  hmr: {
    clientPort: 443,
    protocol: 'wss',
  }
}
```

#### 3.4 环境变量与多模式 `env`

- 文件命名：`.env`、`.env.development`、`.env.production`、`.env.staging` 等
- 前缀：仅以 `VITE_` 开头的变量会注入客户端
- 读取：`import.meta.env.VITE_SOME_KEY`
- 切换模式：`vite --mode staging`、`vite build --mode production`

示例：

```
# .env.development
VITE_API_BASE_URL=http://localhost:8080

# .env.production
VITE_API_BASE_URL=https://api.example.com
```

```ts
const apiBase = import.meta.env.VITE_API_BASE_URL
```

如需自定义目录：`envDir`；如需自定义可注入前缀：`envPrefix`（默认 `VITE_`）。

#### 3.5 CSS、PostCSS、Tailwind

- 本项目已启用 PostCSS：`postcss.config.js` 中包含 `tailwindcss` 与 `autoprefixer`
- Tailwind 配置：`tailwind.config.js`（已集成 DaisyUI 插件）
- Vite CSS 常用配置：

```ts
css: {
  // 启用 CSS Modules 命名规范
  modules: { localsConvention: 'camelCaseOnly' },
  // 预处理器（如需使用 less/scss 时）
  preprocessorOptions: {
    scss: { additionalData: `@use "./src/styles/variables" as *;` },
    less: { javascriptEnabled: true },
  },
}
```

静态资源：`public/` 下的文件会以原路径拷贝到构建产物，使用时以根路径引用，如 `/vite.svg`。

#### 3.6 生产构建 `build`

关键字段：
- `outDir`: 输出目录（本项目 `dist`）
- `assetsDir`: 静态资源子目录（本项目 `assets`）
- `sourcemap`: 是否生成源码映射（上报 Sentry 可设为 `hidden` 或 `true`）
- `minify`: `esbuild`（默认，极快）或 `terser`（更细压缩选项）
- `cssCodeSplit`: 是否拆分 CSS
- `assetsInlineLimit`: 资源内联阈值（字节）
- `rollupOptions`: 细粒度的输出与拆包控制

常见优化范例：

```ts
build: {
  sourcemap: false,
  minify: 'esbuild',
  cssCodeSplit: true,
  rollupOptions: {
    output: {
      manualChunks: {
        react: ['react', 'react-dom'],
        antd: ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
        state: ['zustand'],
        query: ['@tanstack/react-query'],
        echarts: ['echarts'],
        net: ['axios'],
      },
      chunkFileNames: 'assets/js/[name]-[hash].js',
      entryFileNames: 'assets/js/[name]-[hash].js',
      assetFileNames: ({ name }) => {
        if (/\.css$/.test(name ?? '')) return 'assets/css/[name]-[hash][extname]'
        if (/\.(png|jpe?g|svg|gif|webp|ico)$/.test(name ?? '')) return 'assets/img/[name]-[hash][extname]'
        return 'assets/[name]-[hash][extname]'
      },
    },
  },
}
```

更强压缩（可选）：

```ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
}
```

或使用 esbuild 的快速丢弃：

```ts
esbuild: {
  drop: ['console', 'debugger']
}
```

#### 3.7 依赖预构建 `optimizeDeps`

控制开发期依赖预构建（提升冷启动与热更新性能）：

```ts
optimizeDeps: {
  include: ['react', 'react-dom', 'axios', 'zustand', '@tanstack/react-query'],
  // exclude: ['echarts'] // 某些包遇到 ESM/CJS 兼容问题时可排除
}
``;

---

### 4. 结合本项目的推荐实践

- 环境变量：新增 `.env.development` 与 `.env.production`，注入后通过 `import.meta.env.VITE_*` 读取。
- API 代理：本地开发建议开启 `server.proxy` 对接后端，避免 CORS 与 Cookie 问题。
- 路由与按需加载：结合 React Router 的 `lazy()`/`Suspense` 做路由级代码分割。
- 构建拆包：为 `react/antd/echarts` 等常见大包单独拆分，有助于浏览器缓存与首屏优化。
- SourceMap：调试/监控对接时开启，生产对外隐藏可用 `hidden`。
- 体积分析：集成 `rollup-plugin-visualizer`，定期检查包体结构。

示例：路由懒加载（与 Vite 构建配合良好）

```tsx
import { lazy, Suspense } from 'react'
const Products = lazy(() => import('@/pages/Shop/Products'))

export default function Routes() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Products />
    </Suspense>
  )
}
```

---

### 5. 部署与预览

- 基础路径 `base`：若部署在子路径（如 `/admin/`），需在生产模式下设置：

```ts
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
}))
```

- 预览生产包：`pnpm build && pnpm preview`
- 反向代理/HMR：在 Nginx/网关后面时，必要时为 HMR 配置 `server.hmr`（见上文）。

---

### 6. 常见问题排查（FAQ）

1) `__dirname` 未定义（ESM）
- 见上文 `fileURLToPath` 用法。

2) `@` 别名在 TS 报错
- 需同时配置 `vite.config.ts` 与 `tsconfig.json` 的 `paths`。IDE 需重启或重新加载 TS 工程。

3) HMR 失效或卡顿
- 检查是否被代理、HTTPS、内网访问，按需设置 `server.hmr`。

4) 构建产物路径异常
- 部署子路径忘记设置 `base`；或静态资源用相对路径且未考虑 `base`。

5) 包体过大
- 使用构建分析、手动拆包（`manualChunks`）、路由懒加载、`drop console`。

---

### 7. 参考配置清单（速查）

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'
  return {
    base: '/',
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: true,
      port: 5000,
      open: true,
      strictPort: false,
      proxy: {
        // '/api': { target: 'http://localhost:8080', changeOrigin: true },
      },
    },
    css: {
      modules: { localsConvention: 'camelCaseOnly' },
      preprocessorOptions: { scss: { additionalData: '' } },
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    esbuild: {
      drop: isBuild ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'axios', 'zustand', '@tanstack/react-query'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            antd: ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
            state: ['zustand'],
            query: ['@tanstack/react-query'],
            echarts: ['echarts'],
            net: ['axios'],
          },
        },
      },
    },
    preview: { port: 8080, open: true },
    clearScreen: false,
  }
})
```

---

### 8. 参考资料

- Vite 官方配置手册（v7）：`https://vite.dev/config/`
- React 插件文档：`https://github.com/vitejs/vite-plugin-react` 
- 环境变量与模式：`https://vite.dev/guide/env-and-mode`
- 静态资源处理：`https://vite.dev/guide/assets`
- Rollup 输出与拆包：`https://rollupjs.org/configuration-options/#output`

如需我基于上述建议为本项目直接优化 `vite.config.ts`（例如：按需拆包、HMR 在代理下的兼容、生产环境 base、Sourcemap 策略等），告诉我你的部署环境与接口域名，我可以直接完成编辑。

