import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/types/routes'
import { lazy } from 'react'

// ... 保持组件导入不变
const Admin = lazy(() => import('@/pages/Admin'))
const DashBoard = lazy(() => import('@/pages/DashBoard/DashBoard'))
const BookingReview = lazy(() => import('@/pages/Venue/BookingReview'))
const Notice = lazy(() => import('@/pages/Venue/Notice')) 
const ForumManagement = lazy(() => import('@/pages/Forum/ForumManagement'))
const ForumDetail = lazy(() => import('@/pages/Forum/ForumDetail'))
const Products = lazy(() => import('@/pages/Shop/Products'))
const Orders = lazy(() => import('@/pages/Shop/Orders'))
const VenueManagement = lazy(() => import('@/pages/Venue/VenueManagement'))
const UserManagement = lazy(() => import('@/pages/User/UserManagement'))

// 获取base path
const getBasePath = () => {
  if (window.__POWERED_BY_WUJIE__) {
    // 在无界环境中，路由由主应用管理
    return ''
  }
  return ''
}

const router = createBrowserRouter([
    {
      path: '/',
      element: <Navigate to={ROUTES.ADMIN} replace />
    },
    {
      path: ROUTES.ADMIN,
      element: <Admin />,
      handle: {
        meta: {
          title: '首页',
        },
      },
      children: [
        {
          index: true,
          element: <DashBoard />,
          handle: {
            meta: {
              title: '首页',
            },
          },
        },
        {
          path: ROUTES.BOOKING_REVIEW,
          element: <BookingReview />,
          handle: {
            meta: {
              title: '预定管理',
            },
          },
        },
        {
          path: ROUTES.NOTICE,
          element: <Notice />,
          handle: {
            meta: {
              title: '发布通知',
            },
          },
        },
        {
          path: ROUTES.FORUM,
          element: <ForumManagement />, 
          handle: {
            meta: {
              title: '论坛管理',
            },
          },
        },
        {
          path: ROUTES.FORUM_POST,
          element: <ForumDetail />,
          handle: {
            meta: {
              title: '论坛详情',
            },
          },
        },
        {
          path: ROUTES.PRODUCTS,
          element: <Products />,
          handle: {
            meta: {
              title: '商品管理',
            },
          },
        },
        {
          path: ROUTES.ORDERS,
          element: <Orders />,
          handle: {
            meta: {
              title: '商品订单',
            },
          },
        },
        {
          path: ROUTES.VENUE_MANAGEMENT,
          element: <VenueManagement />,
          handle: {
            meta: {
              title: '场地管理',
            },
          },
        },
        {
          path: ROUTES.USER_MANAGEMENT,
          element: <UserManagement />,
          handle: {
            meta: {
              title: '用户管理',
            },
          },

        },
      ],
    }
], {
  basename: getBasePath()  // 根据环境动态设置基础路径
})

export default router;
