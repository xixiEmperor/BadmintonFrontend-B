/**
 * 后台布局页
 * - 左侧导航 Sider + 顶部 Header + 面包屑 + 右侧内容区
 * - 负责导航跳转、用户下拉操作、面包屑渲染
 */
import React from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { 
  Layout, 
  Menu, 
  Breadcrumb, 
  Dropdown, 
  Typography,
  Space
} from 'antd'
import { 
  HomeOutlined,
  FieldTimeOutlined,
  MessageOutlined,
  ShopOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { BreadcrumbConfig } from '@/types/adminConfig'
import { useChangeTitle } from '@/hooks/useChangeTitle'
const { Header, Content, Sider } = Layout
const { Title } = Typography

export default function Admin() {
  const location = useLocation()
  const navigate = useNavigate()

  useChangeTitle()

  // 菜单项配置
  const menuItems: MenuProps['items'] = [
    {
      key: '/admin',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: 'venue',
      icon: <FieldTimeOutlined />,
      label: '场地相关',
      children: [
        {
          key: '/admin/venue-management',
          label: '场地管理',
        },
        {
          key: '/admin/booking-review',
          label: '预定管理',
        },
        {
            key: '/admin/notice',
            label: '发布通知',
        },
      ],
    },
    {
      key: '/admin/forum',
      icon: <MessageOutlined />,
      label: '论坛管理',
    },
    {
      key: 'business',
      icon: <ShopOutlined />,
      label: '商城相关',
      children: [
        {
          key: '/admin/products',
          label: '商品管理',
        },
        {
          key: '/admin/orders',
          label: '商品订单',
        },
      ],
    },
    {
      key: '/admin/user-management',
      icon: <UserOutlined />,
      label: '用户管理',
    },
  ]

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ]

  // 面包屑导航配置生成函数
  const getBreadcrumbItems = (): BreadcrumbConfig[] => {
    // 1. 解析当前路径，分割为路径片段数组
    // 过滤空字符串，得到有效的路径片段
    const pathSnippets = location.pathname.split('/').filter(i => i)
    
    // 2. 初始化面包屑数组，首项固定为首页图标
    const breadcrumbItems: BreadcrumbConfig[] = [
      {
        title: <HomeOutlined />,  // 使用图标作为首页标识
        key: 'home',
      }
    ]

    // 3. 处理根路径情况（/admin 或者 /）
    if (pathSnippets.length === 0) {
      // 如果是根路径，添加"首页"链接
      breadcrumbItems.push({
        title: <Link to='/admin' style={{ color: 'white' }}>首页</Link>,
        key: 'dashboard',
      })
    } else {
      // 4. 处理有子路径的情况，逐级构建面包屑
      pathSnippets.forEach((snippet, index) => {
        // 4.1 构建当前层级的完整路径
        // 取前 index+1 个片段，重新拼接成路径
        const path = `/${pathSnippets.slice(0, index + 1).join('/')}`
        let title: React.ReactNode = ''
        
        // 4.2 根据路径片段映射对应的中文名称
        // 这里使用switch语句进行路径到标题的映射
        switch (snippet) {
          case 'venue-management':
            title = '场地管理'
            break
          case 'booking-review':
            title = '预定管理'
            break
          case 'notice':
            title = '发布通知'
            break
          case 'forum':
            title = '论坛管理'
            break
          case 'products':
            title = '商品管理'
            break
          case 'orders':
            title = '商品订单'
            break
          case 'user-management':
            title = '用户管理'
            break
          default:
            // 如果没有匹配的映射，直接使用原路径片段
            title = snippet
        }
        
        // 4.3 将构建的面包屑项添加到数组中
        // 每个面包屑项都是可点击的链接，方便用户快速导航
        breadcrumbItems.push({
          title: <Link to={path} style={{ color: 'white' }}>{title}</Link>,
          key: path,
        })
      })
    }

    // 5. 返回完整的面包屑配置数组
    return breadcrumbItems
  }

  // 侧边栏菜单点击处理函数
  const handleMenuClick = ({ key }: { key: string }) => {
    // 使用React Router的navigate函数进行路由跳转
    // key值对应菜单项的路径，直接传递给navigate进行导航
    navigate(key)
  }

  // 用户下拉菜单点击处理函数
  const handleUserMenuClick = ({ key }: { key: string }) => {
    // 根据点击的菜单项执行相应操作
    switch (key) {
      case 'logout':
        // TODO: 实现完整的退出登录逻辑
        // 1. 清除本地存储的用户信息和token
        // 2. 重置应用状态
        // 3. 跳转到登录页面
        console.log('退出登录')
        window.$wujie.bus.$emit('admin-logout')
        break
      // 可以在这里添加更多用户操作，如个人设置、修改密码等
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Layout style={{ minHeight: '100vh', background: '#f9fafb' }}>
        <Sider 
          width={240} 
          style={{
            background: '#001529',
            borderRight: '1px solid #e5e7eb',
          }}
        >
          {/* Logo区域 */}
          <div style={{ 
            padding: '16px', 
            textAlign: 'center',
            borderBottom: '1px solid #1e3a8a',
            background: '#001529',
          }}>
            <Title level={5} style={{ 
              color: '#ffffff',
              margin: 0,
              fontWeight: 'normal',
            }}>
              羽毛球场地管理系统
            </Title>
          </div>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['venue', 'business']}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              borderRight: 0,
              background: '#001529',
            }}
          />
        </Sider>
        
        <Layout style={{ 
          background: '#f9fafb', 
        }}>
          {/* Header */}
          <Header 
            style={{ 
              padding: '0 24px', 
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            }}
          >
            <Breadcrumb
              items={getBreadcrumbItems().map(item => ({
                ...item,
                title: typeof item.title === 'string' ? item.title : 
                       React.cloneElement(item.title as React.ReactElement<{ style?: React.CSSProperties }>, {
                         style: { color: '#374151' }
                       })
              }))}
              style={{ 
                margin: 0,
                color: '#374151'
              }}
            />
            
            <Dropdown
              menu={{ 
                items: userMenuItems,
                onClick: handleUserMenuClick
              }}
              trigger={['click']}
            >
              <Space style={{ 
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '6px',
                color: '#374151',
                transition: 'all 0.2s ease'
              }}
              className="hover:bg-gray-100"
              >
                <span className='font-medium hover:text-blue-600'>管理员</span>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Header>
          
          {/* Content */}
          <Content
            style={{
              minHeight: 280,
              background: '#f9fafb',
              padding: '24px',
            }}
          >
            <div>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
