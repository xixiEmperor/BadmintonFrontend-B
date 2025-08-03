# React Router 详细学习文档

## 目录

1. [React Router 概述](#react-router-概述)
2. [核心概念](#核心概念)
3. [路由配置](#路由配置)
4. [导航组件](#导航组件)
5. [路由参数](#路由参数)
6. [嵌套路由](#嵌套路由)
7. [路由守卫](#路由守卫)
8. [编程式导航](#编程式导航)
9. [懒加载](#懒加载)
10. [状态管理](#状态管理)
11. [实践技巧](#实践技巧)

---

## React Router 概述

React Router 是 React 应用中最主流的客户端路由解决方案，就像 Vue Router 之于 Vue 一样。它让你能够在单页应用中创建多个"页面"视图，并在它们之间导航。

### 版本说明

- **React Router v6**：当前主流版本，本文档基于此版本
- 相比 v5 有重大变化，类似 Vue Router 从 v3 到 v4 的升级

### 安装

```bash
npm install react-router-dom
# 或
pnpm add react-router-dom
```

---

## 核心概念

### 1. Router 容器

就像 Vue Router 的 `<router-view>` 需要一个 Router 实例一样，React Router 需要一个 Router 容器来包裹整个应用。

```jsx
import { BrowserRouter, HashRouter } from 'react-router-dom'

// BrowserRouter = Vue Router 的 history 模式
function App() {
  return (
    <BrowserRouter>
      {/* 你的应用组件 */}
    </BrowserRouter>
  )
}

// HashRouter = Vue Router 的 hash 模式
function App() {
  return (
    <HashRouter>
      {/* 你的应用组件 */}
    </HashRouter>
  )
}
```

### 2. Routes 和 Route

- `<Routes>` = Vue Router 的路由表配置区域
- `<Route>` = Vue Router 中单个路由配置项

```jsx
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 3. 渲染组件

- `element` 属性 = Vue Router 的 `component` 属性
- 直接传入 JSX 元素，而不是组件引用

---

## 路由配置

### 基础路由配置

```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

// 方式一：声明式配置（类似 Vue Router 在模板中写 <router-view>）
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:id" element={<UserDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

// 方式二：配置式路由（类似 Vue Router 的 routes 数组配置）
const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/users/:id",
    element: <UserDetail />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
])

function App() {
  return <RouterProvider router={router} />
}
```

### 路由模式

```jsx
// History 模式（默认，等同于 Vue Router 的 createWebHistory）
import { BrowserRouter } from 'react-router-dom'

// Hash 模式（等同于 Vue Router 的 createWebHashHistory）
import { HashRouter } from 'react-router-dom'

// Memory 模式（类似 Vue Router 的 createMemoryHistory，用于测试）
import { MemoryRouter } from 'react-router-dom'
```

---

## 导航组件

### Link 组件

`<Link>` = Vue Router 的 `<router-link>`

```jsx
import { Link } from 'react-router-dom'

function Navigation() {
  return (
    <nav>
      <Link to="/">首页</Link>
      <Link to="/about">关于我们</Link>
      <Link to="/contact">联系我们</Link>
    
      {/* 带参数的链接 */}
      <Link to="/users/123">用户详情</Link>
    
      {/* 带 query 参数 */}
      <Link to="/search?q=react">搜索</Link>
    
      {/* 替换当前历史记录（类似 router-link 的 replace） */}
      <Link to="/login" replace>登录</Link>
    </nav>
  )
}
```

### NavLink 组件

`<NavLink>` = Vue Router 的带 `active-class` 的 `<router-link>`

```jsx
import { NavLink } from 'react-router-dom'

function Navigation() {
  return (
    <nav>
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? "active" : ""}
      >
        首页
      </NavLink>
    
      <NavLink 
        to="/about"
        style={({ isActive }) => ({
          color: isActive ? "red" : "black"
        })}
      >
        关于
      </NavLink>
    </nav>
  )
}
```

---

## 路由参数

### 路径参数 (params)

类似 Vue Router 的 `$route.params`

```jsx
import { useParams } from 'react-router-dom'

// 路由配置：/users/:id
function UserDetail() {
  const { id } = useParams() // 类似 Vue 的 $route.params.id
  
  return <div>用户ID: {id}</div>
}

// 多个参数：/users/:userId/posts/:postId
function PostDetail() {
  const { userId, postId } = useParams()
  
  return (
    <div>
      用户ID: {userId}, 文章ID: {postId}
    </div>
  )
}
```

### 查询参数 (search params)

类似 Vue Router 的 `$route.query`

```jsx
import { useSearchParams } from 'react-router-dom'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const query = searchParams.get('q') // 类似 Vue 的 $route.query.q
  const page = searchParams.get('page') || '1'
  
  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery, page: '1' })
  }
  
  return (
    <div>
      <p>搜索词: {query}</p>
      <p>页码: {page}</p>
      <button onClick={() => handleSearch('新搜索词')}>
        更新搜索
      </button>
    </div>
  )
}
```

### 位置信息

类似 Vue Router 的 `$route`

```jsx
import { useLocation } from 'react-router-dom'

function CurrentPage() {
  const location = useLocation()
  
  return (
    <div>
      <p>当前路径: {location.pathname}</p>
      <p>查询字符串: {location.search}</p>
      <p>哈希: {location.hash}</p>
      <p>状态: {JSON.stringify(location.state)}</p>
    </div>
  )
}
```

---

## 嵌套路由

### 基础嵌套路由

类似 Vue Router 的 `children` 配置

```jsx
import { Outlet } from 'react-router-dom'

// 父组件（需要 Outlet 来渲染子路由，类似 Vue 的 <router-view>）
function Layout() {
  return (
    <div>
      <header>网站头部</header>
      <nav>
        <Link to="/dashboard">仪表板</Link>
        <Link to="/dashboard/users">用户管理</Link>
        <Link to="/dashboard/posts">文章管理</Link>
      </nav>
      <main>
        <Outlet /> {/* 子路由渲染位置 */}
      </main>
    </div>
  )
}

// 路由配置
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} /> {/* 默认子路由 */}
          <Route path="users" element={<Users />} />
          <Route path="posts" element={<Posts />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

### 配置式嵌套路由

```jsx
const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <Layout />,
    children: [
      {
        index: true, // 默认子路由
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
      {
        path: "posts",
        element: <Posts />,
        children: [
          {
            path: ":id",
            element: <PostDetail />,
          }
        ]
      },
    ],
  },
])
```

---

## 路由守卫

React Router 没有 Vue Router 那样的全局守卫和路由守卫概念，但可以通过高阶组件或自定义 Hook 实现类似功能。

### 认证守卫

```jsx
import { Navigate, useLocation } from 'react-router-dom'

// 类似 Vue Router 的 beforeRouteEnter
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth() // 自定义认证 Hook
  const location = useLocation()
  
  if (!isAuthenticated) {
    // 重定向到登录页，并保存当前位置
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return children
}

// 使用
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  )
}
```

### 权限守卫

```jsx
function RoleBasedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  
  if (!user || user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// 使用
<Route path="/admin" element={
  <RoleBasedRoute requiredRole="admin">
    <AdminPanel />
  </RoleBasedRoute>
} />
```

---

## 编程式导航

### useNavigate Hook

类似 Vue Router 的 `$router.push` 和 `$router.replace`

```jsx
import { useNavigate } from 'react-router-dom'

function LoginForm() {
  const navigate = useNavigate()
  
  const handleLogin = async () => {
    try {
      await login()
    
      // 类似 Vue 的 $router.push
      navigate('/dashboard')
    
      // 类似 Vue 的 $router.replace
      navigate('/dashboard', { replace: true })
    
      // 带参数导航
      navigate('/users/123')
    
      // 带查询参数
      navigate('/search?q=react')
    
      // 带状态
      navigate('/profile', { state: { from: 'login' } })
    
      // 相对导航
      navigate('../parent') // 上一级
      navigate('child') // 子路径
    
      // 历史导航（类似 Vue 的 $router.go）
      navigate(-1) // 后退
      navigate(2)  // 前进2步
    
    } catch (error) {
      console.error('登录失败')
    }
  }
  
  return (
    <form onSubmit={handleLogin}>
      {/* 表单内容 */}
    </form>
  )
}
```

---

## 懒加载

### 路由级别的代码分割

类似 Vue Router 的动态导入

```jsx
import { lazy, Suspense } from 'react'

// 懒加载组件（类似 Vue 的 () => import('./About.vue')）
const About = lazy(() => import('./components/About'))
const Contact = lazy(() => import('./components/Contact'))
const Dashboard = lazy(() => import('./components/Dashboard'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>加载中...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 自定义加载组件

```jsx
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="spinner">加载中...</div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 路由配置 */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

---

## 状态管理

### 路由状态传递

```jsx
// 传递状态
function UserList() {
  const navigate = useNavigate()
  
  const handleUserClick = (user) => {
    navigate('/user-detail', { 
      state: { user, from: 'user-list' } 
    })
  }
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id} onClick={() => handleUserClick(user)}>
          {user.name}
        </div>
      ))}
    </div>
  )
}

// 接收状态
function UserDetail() {
  const location = useLocation()
  const { user, from } = location.state || {}
  
  if (!user) {
    return <Navigate to="/users" replace />
  }
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>来自: {from}</p>
    </div>
  )
}
```

### 路由参数持久化

```jsx
// 自定义 Hook 来同步 URL 和状态
function useUrlState(key, defaultValue) {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const value = searchParams.get(key) || defaultValue
  
  const setValue = (newValue) => {
    const newParams = new URLSearchParams(searchParams)
    if (newValue) {
      newParams.set(key, newValue)
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }
  
  return [value, setValue]
}

// 使用
function SearchPage() {
  const [query, setQuery] = useUrlState('q', '')
  const [page, setPage] = useUrlState('page', '1')
  
  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
      <p>当前页: {page}</p>
    </div>
  )
}
```

---

## 实践技巧

### 1. 路由配置组织

```jsx
// routes/index.js - 集中管理路由配置
import { lazy } from 'react'

const Home = lazy(() => import('../pages/Home'))
const About = lazy(() => import('../pages/About'))
const Dashboard = lazy(() => import('../pages/Dashboard'))

export const routes = [
  {
    path: '/',
    element: <Home />,
    name: 'home'
  },
  {
    path: '/about',
    element: <About />,
    name: 'about'
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    name: 'dashboard',
    requiresAuth: true
  }
]
```

### 2. 错误边界处理

```jsx
import { useRouteError } from 'react-router-dom'

function ErrorBoundary() {
  const error = useRouteError()
  
  return (
    <div className="error-page">
      <h1>出错了！</h1>
      <p>{error.statusText || error.message}</p>
    </div>
  )
}

// 在路由配置中使用
const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorBoundary />,
    children: [
      // 子路由
    ]
  }
])
```

### 3. 面包屑导航

```jsx
import { useLocation } from 'react-router-dom'

function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)
  
  return (
    <nav className="breadcrumb">
      <Link to="/">首页</Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
      
        return isLast ? (
          <span key={name}> / {name}</span>
        ) : (
          <span key={name}> / <Link to={routeTo}>{name}</Link></span>
        )
      })}
    </nav>
  )
}
```

### 4. 路由元信息

```jsx
// 类似 Vue Router 的 meta 字段
const router = createBrowserRouter([
  {
    path: "/dashboard",
    element: <Dashboard />,
    handle: {
      meta: {
        title: "仪表板",
        requiresAuth: true,
        roles: ["admin", "user"]
      }
    }
  }
])

// 使用路由元信息
function useRouteTitle() {
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  const title = currentMatch?.handle?.meta?.title
  
  useEffect(() => {
    if (title) {
      document.title = title
    }
  }, [title])
}
```

### 5. 性能优化

```jsx
// 预加载路由组件
function Navigation() {
  const handleMouseEnter = () => {
    // 鼠标悬停时预加载组件
    import('../pages/About')
  }
  
  return (
    <nav>
      <Link 
        to="/about" 
        onMouseEnter={handleMouseEnter}
      >
        关于我们
      </Link>
    </nav>
  )
}
```

---

## 与 Vue Router 的主要差异

| 特性     | React Router              | Vue Router          |
| -------- | ------------------------- | ------------------- |
| 路由配置 | JSX 元素或配置对象        | 配置对象            |
| 导航组件 | `<Link>`, `<NavLink>` | `<router-link>`   |
| 路由出口 | `<Outlet>`              | `<router-view>`   |
| 获取参数 | `useParams()`           | `$route.params`   |
| 获取查询 | `useSearchParams()`     | `$route.query`    |
| 编程导航 | `useNavigate()`         | `$router.push()`  |
| 路由信息 | `useLocation()`         | `$route`          |
| 守卫     | 高阶组件                  | beforeRouteEnter 等 |
| 懒加载   | `lazy()` + `Suspense` | 动态导入            |

---

## 总结

React Router 与 Vue Router 在核心概念上非常相似，主要差异在于：

1. **声明式 vs 配置式**：React Router 更偏向声明式（JSX），Vue Router 更偏向配置式
2. **Hook vs 实例属性**：React Router 使用 Hook 获取路由信息，Vue Router 使用实例属性
3. **组件化程度**：React Router 的一切都是组件，包括路由配置
4. **类型安全**：React Router v6 + TypeScript 提供了更好的类型推导

掌握了 Vue Router 的你，学习 React Router 会发现很多概念是相通的，主要是 API 形式的差异。建议多实践，熟悉 React 的 Hook 思维方式。
