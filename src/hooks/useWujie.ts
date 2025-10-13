import { useEffect, useState } from 'react'

interface WujieProps {
  userInfo?: any
  token?: string
  theme?: string
  language?: string
}

export function useWujie() {
  const [isWujie] = useState(!!window.__POWERED_BY_WUJIE__)
  const [wujieProps, setWujieProps] = useState<WujieProps>({})

  useEffect(() => {
    if (!isWujie) return

    // 获取初始props
    const initialProps = window.__WUJIE?.props || {}
    setWujieProps(initialProps)

    // 监听props更新
    const handlePropsUpdate = (props: WujieProps) => {
      setWujieProps(props)
    }

    if (window.__WUJIE?.bus) {
      window.__WUJIE.bus.$on('user-info-updated', handlePropsUpdate)
      
      return () => {
        window.__WUJIE.bus.$off('user-info-updated', handlePropsUpdate)
      }
    }
  }, [isWujie])

  // 向主应用发送消息
  const emitToParent = (event: string, data?: any) => {
    if (isWujie && window.__WUJIE?.bus) {
      window.__WUJIE.bus.$emit(event, data)
    }
  }

  // 导航到主应用路由
  const navigateToParent = (path: string) => {
    emitToParent('admin-navigate', path)
  }

  // 退出登录
  const logout = () => {
    emitToParent('admin-logout')
  }

  return {
    isWujie,
    wujieProps,
    emitToParent,
    navigateToParent,
    logout
  }
}