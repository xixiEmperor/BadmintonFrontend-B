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
    <div className="min-h-screen bg-gray-900">
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Sider 
          width={260} 
          style={{
            background: '#111827',
            borderRight: '1px solid #1f2937',
          }}
        >
          {/* Logo区域 */}
          <div style={{ 
            padding: '20px 16px', 
            textAlign: 'center',
            borderBottom: '1px solid #1f2937',
            background: '#0f172a',
          }}>
            <Title level={4} style={{ 
              color: '#3b82f6',
              margin: 0,
              fontWeight: 'bold',
            }}>
              羽毛球场地管理系统
            </Title>
          </div>

          {/* 自定义深色菜单样式 */}
          <style>
            {`
              .ant-menu-dark {
                background: transparent !important;
                color: #d1d5db !important;
              }
              .ant-menu-dark .ant-menu-item {
                background: transparent !important;
                color: #d1d5db !important;
                border-radius: 6px !important;
                margin: 4px 12px !important;
                transition: all 0.2s ease !important;
              }
              .ant-menu-dark .ant-menu-item:hover {
                background: #1f2937 !important;
                color: #3b82f6 !important;
              }
              .ant-menu-dark .ant-menu-item-selected {
                background: #1e40af !important;
                color: #ffffff !important;
              }
              .ant-menu-dark .ant-menu-submenu-title {
                background: transparent !important;
                color: #d1d5db !important;
                border-radius: 6px !important;
                margin: 4px 12px !important;
                transition: all 0.2s ease !important;
              }
              .ant-menu-dark .ant-menu-submenu-title:hover {
                background: #1f2937 !important;
                color: #3b82f6 !important;
              }
              .ant-menu-dark .ant-menu-submenu-open > .ant-menu-submenu-title {
                color: #3b82f6 !important;
                background: #1f2937 !important;
              }
              .ant-menu-dark .ant-menu-sub {
                background: #0f172a !important;
                border-radius: 6px !important;
                margin: 0 12px !important;
              }
              .ant-menu-dark .ant-menu-item .anticon {
                color: #6b7280 !important;
                margin-right: 12px !important;
              }
              .ant-menu-dark .ant-menu-submenu-title .anticon {
                color: #6b7280 !important;
                margin-right: 12px !important;
              }
              .ant-menu-dark .ant-menu-item:hover .anticon {
                color: #3b82f6 !important;
              }
              .ant-menu-dark .ant-menu-submenu-title:hover .anticon {
                color: #3b82f6 !important;
              }
              .ant-menu-dark .ant-menu-item-selected .anticon {
                color: #ffffff !important;
              }
            `}
          </style>

          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={['venue', 'business']}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ 
              borderRight: 0,
              background: 'transparent',
              padding: '16px 4px'
            }}
          />
        </Sider>
        
        <Layout style={{ 
          background: 'transparent', 
          marginLeft: '20px', 
        }}>
          {/* Header */}
          <Header 
            style={{ 
              marginTop: '10px',
              padding: '0 24px', 
              background: '#1f2937',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #374151',
              borderRadius: '10px',
            }}
          >
            <Breadcrumb
              items={getBreadcrumbItems()}
              style={{ 
                margin: 0,
                color: 'white'
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
                color: '#ffffff',
                transition: 'all 0.2s ease'
              }}
              >
                <span className='font-bold hover:text-blue-500'>管理员</span>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Header>
          
          {/* Content */}
          <Content
            style={{
              minHeight: 280,
              background: 'transparent',
              marginTop: '25px',
            }}
          >
            <div style={{ 
              background: '#1f2937',
              padding: '24px', 
              borderRadius: '8px',
              minHeight: 'calc(100vh - 112px)',
              border: '1px solid #374151',
            }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
