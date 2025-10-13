import { Suspense, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from './router'
import { RouterProvider } from 'react-router-dom'
import { useWujie } from './hooks/useWujie'

interface AppProps {
  userInfo?: any
  token?: string
  theme?: string
  language?: string
}

function App(props: AppProps) {
  const { isWujie, wujieProps } = useWujie()
  
  // 合并props
  const finalProps = isWujie ? wujieProps : props

  useEffect(() => {
    // 处理从主应用传递的用户信息
    if (finalProps.userInfo) {
      console.log('收到用户信息:', finalProps.userInfo)
      // 可以更新全局状态
    }
    
    if (finalProps.token) {
      console.log('收到token:', finalProps.token)
      // 可以设置axios默认header
    }
  }, [finalProps])

  return (
    <ConfigProvider locale={zhCN}>
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ConfigProvider>
  )
}

export default App
