/**
 * 应用入口
 * - 注入 React Query、AntD 主题与 CSS-in-JS Provider
 * - 挂载根组件 `App`
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 引入 Ant Design v5 样式重置，确保 Modal 等组件样式与层级正常
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StyleProvider hashPriority="high">
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: '#1677ff',
            },
          }}
        >
          <App />
        </ConfigProvider>
      </StyleProvider>
    </QueryClientProvider>
  </StrictMode>,
)
