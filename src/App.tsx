/**
 * 应用根组件
 * 职责：承载路由容器，渲染各业务页面
 */
import { RouterProvider } from 'react-router-dom'
import router from './router/index'

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
