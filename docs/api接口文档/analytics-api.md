## Analytics 数据分析 API - 完整响应示例

### 仪表盘统计
GET /api/analytics/dashboard

```json
{
  "code": 0,
  "data": {
    "totalUsers": 1200,
    "newUsersToday": 15,
    "newUsersThisMonth": 320,
    "activeUsersToday": 210,
    "totalReservations": 850,
    "reservationsToday": 22,
    "reservationsThisMonth": 190,
    "reservationRevenue": 32500.50,
    "revenueToday": 980.00,
    "revenueThisMonth": 15230.00,
    "totalOrders": 560,
    "ordersToday": 12,
    "ordersThisMonth": 140,
    "mallRevenue": 46800.00,
    "mallRevenueToday": 320.00,
    "mallRevenueThisMonth": 8200.00,
    "totalPosts": 420,
    "postsToday": 8,
    "totalReplies": 1050,
    "repliesToday": 34,
    "totalVenues": 12,
    "availableVenues": 10,
    "venueUtilizationRate": 0.72
  }
}
```

### 通用图表响应（适用于所有 charts/*）
```json
{
  "code": 0,
  "data": {
    "labels": ["2024-05-01", "2024-05-02", "2024-05-03"],
    "data": [12, 18, 9],
    "title": "示例标题",
    "type": "line"
  }
}
```

## Analytics 数据分析 API

- Base URL: `http://localhost:8080`
- 认证: 需要管理员权限（类上有 `@PreAuthorize('hasRole('ADMIN')')`）
- 统一返回: `ResponseVo<T>`
  - `code`: number（0 成功，非0失败，见响应码）
  - `msg`: string（可选）
  - `data`: T

### 数据模型

- DashboardStatsDto
  - totalUsers: number
  - newUsersToday: number
  - newUsersThisMonth: number
  - activeUsersToday: number
  - totalReservations: number
  - reservationsToday: number
  - reservationsThisMonth: number
  - reservationRevenue: number
  - revenueToday: number
  - revenueThisMonth: number
  - totalOrders: number
  - ordersToday: number
  - ordersThisMonth: number
  - mallRevenue: number
  - mallRevenueToday: number
  - mallRevenueThisMonth: number
  - totalPosts: number
  - postsToday: number
  - totalReplies: number
  - repliesToday: number
  - totalVenues: number
  - availableVenues: number
  - venueUtilizationRate: number

- ChartDataDto
  - labels: string[]
  - data: any[]
  - title: string
  - type: string

### 接口列表

#### 获取仪表板统计
- 方法: GET
- 路径: `/api/analytics/dashboard`
- Query: -
- 返回: `ResponseVo<DashboardStatsDto>`

#### 用户注册趋势
- 方法: GET
- 路径: `/api/analytics/charts/user-registration-trend`
- 返回: `ResponseVo<ChartDataDto>`

#### 用户角色分布
- 方法: GET
- 路径: `/api/analytics/charts/user-role-distribution`
- 返回: `ResponseVo<ChartDataDto>`

#### 预约趋势
- 方法: GET
- 路径: `/api/analytics/charts/reservation-trend`
- 返回: `ResponseVo<ChartDataDto>`

#### 场地使用率排行
- 方法: GET
- 路径: `/api/analytics/charts/venue-usage-ranking`
- 返回: `ResponseVo<ChartDataDto>`

#### 预约状态分布
- 方法: GET
- 路径: `/api/analytics/charts/reservation-status-distribution`
- 返回: `ResponseVo<ChartDataDto>`

#### 每小时预约分布
- 方法: GET
- 路径: `/api/analytics/charts/hourly-reservation-distribution`
- 返回: `ResponseVo<ChartDataDto>`

#### 收入趋势
- 方法: GET
- 路径: `/api/analytics/charts/revenue-trend`
- 返回: `ResponseVo<ChartDataDto>`

#### 商城订单趋势
- 方法: GET
- 路径: `/api/analytics/charts/mall-order-trend`
- 返回: `ResponseVo<ChartDataDto>`

#### 热门商品排行
- 方法: GET
- 路径: `/api/analytics/charts/popular-products`
- 返回: `ResponseVo<ChartDataDto>`

#### 商城订单状态分布
- 方法: GET
- 路径: `/api/analytics/charts/mall-order-status-distribution`
- 返回: `ResponseVo<ChartDataDto>`

#### 发帖趋势
- 方法: GET
- 路径: `/api/analytics/charts/post-trend`
- 返回: `ResponseVo<ChartDataDto>`

#### 帖子分类分布
- 方法: GET
- 路径: `/api/analytics/charts/post-category-distribution`
- 返回: `ResponseVo<ChartDataDto>`

#### 最活跃用户排行
- 方法: GET
- 路径: `/api/analytics/charts/most-active-users`
- 返回: `ResponseVo<ChartDataDto>`

### 响应示例

```json
{
  "code": 0,
  "msg": "获取成功",
  "data": {
    "labels": ["2024-05-01", "2024-05-02"],
    "data": [10, 12],
    "title": "用户注册趋势",
    "type": "line"
  }
}
```

