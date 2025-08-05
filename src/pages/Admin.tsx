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
import { BreadcrumbConfig } from '@/types/adminConfig'
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

  // 面包屑导航配置
  const getBreadcrumbItems = (): BreadcrumbConfig[] => {
    const pathSnippets = location.pathname.split('/').filter(i => i)
    
    const breadcrumbItems: BreadcrumbConfig[] = [
      {
        title: <HomeOutlined />,
        key: 'home',
      }
    ]

    if (pathSnippets.length === 0) {
      breadcrumbItems.push({
        title: <Link to='/admin' style={{ color: 'white' }}>首页</Link>,
        key: 'dashboard',
      })
    } else {
      // 根据路径生成面包屑
      pathSnippets.forEach((snippet, index) => {
        const path = `/${pathSnippets.slice(0, index + 1).join('/')}`
        let title: React.ReactNode = ''
        
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
            title = snippet
        }
        
        breadcrumbItems.push({
          title: <Link to={path} style={{ color: 'white' }}>{title}</Link>,
          key: path,
        })
      })
    }

    return breadcrumbItems
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        // 处理退出登录逻辑
        console.log('退出登录')
        break
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
            <div style={{ 
              background: '#ffffff',
              padding: '24px', 
              borderRadius: '6px',
              minHeight: 'calc(100vh - 112px)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
