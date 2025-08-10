## API 接口文档（src/api）

本文件整理了 `src/api` 目录下的所有前端接口定义，按模块归类列出：方法、路径、参数与类型。请求基于统一封装的 `src/utils/request.ts`。

### 基础信息
- **Base URL**: `http://localhost:8080`
- **约定**:
  - GET 请求的查询参数通过 `{ params }` 方式传入
  - POST/PUT 请求体为 JSON（除特别说明的 `FormData`）
  - 返回值为后端响应的 `data` 字段（类型参考页面/组件使用处与后端定义）

---

### DashBoard 仪表盘分析（`src/api/DashBoard/dashBoardApi.tsx`）
类型定义参考：`src/types/apiTypes/dashBoard.ts`

- getDashboardOverview
  - 方法: GET
  - 路径: `/api/analytics/dashboard`
  - Query: -
  - Body: -

- getUserRegistrationTrend
  - 方法: GET
  - 路径: `/api/analytics/charts/user-registration-trend`
  - Query: `periodParams`
  - Body: -

- getUserRoleDistribution
  - 方法: GET
  - 路径: `/api/analytics/charts/user-role-distribution`
  - Query: -
  - Body: -

- getReservationTrend
  - 方法: GET
  - 路径: `/api/analytics/charts/reservation-trend`
  - Query: `periodParams`
  - Body: -

- getVenueUsageRanking
  - 方法: GET
  - 路径: `/api/analytics/charts/venue-usage-ranking`
  - Query: -
  - Body: -

- getReservationStatusDistribution
  - 方法: GET
  - 路径: `/api/analytics/charts/reservation-status-distribution`
  - Query: -
  - Body: -

- getHourlyReservationDistribution
  - 方法: GET
  - 路径: `/api/analytics/charts/hourly-reservation-distribution`
  - Query: -
  - Body: -

- getRevenueTrend
  - 方法: GET
  - 路径: `/api/analytics/charts/revenue-trend`
  - Query: `revenueTrendParams`
  - Body: -

- getMallOrderTrend
  - 方法: GET
  - 路径: `/api/analytics/charts/mall-order-trend`
  - Query: `periodParams`
  - Body: -

- getPopularProducts
  - 方法: GET
  - 路径: `/api/analytics/charts/popular-products`
  - Query: `limitParams`
  - Body: -

- getMallOrderStatusDistribution
  - 方法: GET
  - 路径: `/api/analytics/charts/mall-order-status-distribution`
  - Query: -
  - Body: -

- getPostTrend
  - 方法: GET
  - 路径: `/api/analytics/charts/post-trend`
  - Query: `periodParams`
  - Body: -

- getPostCategoryDistribution
  - 方法: GET
  - 路径: `/api/analytics/charts/post-category-distribution`
  - Query: -
  - Body: -

- getMostActiveUsers
  - 方法: GET
  - 路径: `/api/analytics/charts/most-active-users`
  - Query: `limitParams`
  - Body: -

---

### Forum 论坛详情（`src/api/Forum/forumDetailApi.tsx`）
类型定义参考：`src/types/apiTypes/forumDetail.ts`

- getForumDetail
  - 方法: GET
  - 路径: `/api/forum/posts/detail`
  - Query: `{ postId: number }`
  - Body: -

- getForumCommentsService
  - 方法: GET
  - 路径: `/api/forum/posts/{postId}/replies`
  - Path: `postId: number`
  - Query: `GetForumCommentsParams`
  - Body: -

- deleteCommentService
  - 方法: DELETE
  - 路径: `/api/forum/posts/{postId}/replies/{replyId}`
  - Path: `postId: number`, `replyId: number`
  - Query: -
  - Body: -

---

### Forum 论坛管理（`src/api/Forum/forumManagementApi.tsx`）
类型定义参考：`src/types/apiTypes/common.ts`, `src/types/apiTypes/forumManagement.ts`

- deletePostService
  - 方法: DELETE
  - 路径: `/api/forum/posts/{postId}`
  - Path: `postId: number`
  - Query: -
  - Body: -

- getUserPosts
  - 方法: GET
  - 路径: `/api/forum/posts/user`
  - Query: `PaginationParams`
  - Body: -

- setPostTopStatus
  - 方法: PUT
  - 路径: `/api/forum/posts/{postId}/top`
  - Path: `postId: number`
  - Query: -
  - Body: `SetPostTopStatusData`

---

### Shop 商城订单（`src/api/Shop/ordersApi.tsx`）
类型定义参考：`src/types/apiTypes/orders.ts`

- getOrdersByAdmin
  - 方法: GET
  - 路径: `/api/mall/orders/admin`
  - Query: `GetOrdersParams`
  - Body: -

- closeOrderByAdmin
  - 方法: POST
  - 路径: `/api/mall/orders/admin/{orderNo}/close`
  - Path: `orderNo: number`
  - Query: -
  - Body: -

- completeOrderByAdmin
  - 方法: POST
  - 路径: `/api/mall/orders/admin/{orderNo}/complete`
  - Path: `orderNo: number`
  - Query: -
  - Body: `{ pickupCode: string }`

---

### Shop 商城商品（`src/api/Shop/productsApi.tsx`）
类型定义参考：`src/types/apiTypes/products.ts`

- getProductsByAdmin
  - 方法: GET
  - 路径: `/api/mall/admin/products`
  - Query: `GetProductsParams`
  - Body: -

- getProductDetail
  - 方法: GET
  - 路径: `/api/mall/products/{productId}`
  - Path: `productId: number`
  - Query: -
  - Body: -

- uploadProductImages
  - 方法: POST
  - 路径: `/api/mall/products/upload`
  - Query: -
  - Body: `FormData`

- addProduct
  - 方法: POST
  - 路径: `/api/mall/products`
  - Query: -
  - Body: `AddProductData`

- updateProduct
  - 方法: PUT
  - 路径: `/api/mall/products/{productId}`
  - Path: `productId: number`
  - Query: -
  - Body: `UpdateProductData`

- onSaleProduct
  - 方法: PUT
  - 路径: `/api/mall/products/{productId}/on_sale`
  - Path: `productId: number`
  - Query: -
  - Body: -

- offSaleProduct
  - 方法: PUT
  - 路径: `/api/mall/products/{productId}/off_sale`
  - Path: `productId: number`
  - Query: -
  - Body: -

- deleteProduct
  - 方法: DELETE
  - 路径: `/api/mall/products/{productId}`
  - Path: `productId: number`
  - Query: -
  - Body: -

- updateProductStock
  - 方法: PUT
  - 路径: `/api/mall/products/{productId}/stock`
  - Path: `productId: number`
  - Query: -
  - Body: `{ stock: number }`

- getProductSpecifications
  - 方法: GET
  - 路径: `/api/mall/products/{productId}/specifications`
  - Path: `productId: number`
  - Query: -
  - Body: -

- getProductSpecification
  - 方法: POST
  - 路径: `/api/mall/products/{productId}/specification`
  - Path: `productId: number`
  - Query: -
  - Body: `Record<string, string>`（规格条件）

- getProductSpecOptions
  - 方法: GET
  - 路径: `/api/mall/products/{productId}/spec_options`
  - Path: `productId: number`
  - Query: -
  - Body: -

- addProductSpecification
  - 方法: POST
  - 路径: `/api/mall/products/{productId}/specifications`
  - Path: `productId: number`
  - Query: -
  - Body: `AddSpecificationData`

- updateSpecification
  - 方法: PUT
  - 路径: `/api/mall/specifications/{specificationId}`
  - Path: `specificationId: number`
  - Query: -
  - Body: `UpdateSpecificationData`

- deleteSpecification
  - 方法: DELETE
  - 路径: `/api/mall/specifications/{specificationId}`
  - Path: `specificationId: number`
  - Query: -
  - Body: -

- updateSpecificationStock
  - 方法: PUT
  - 路径: `/api/mall/specifications/{specificationId}/stock`
  - Path: `specificationId: number`
  - Query: -
  - Body: `{ stock: number }`

---

### User 用户管理（`src/api/User/userManagementApi.tsx`）
类型定义参考：`src/types/apiTypes/userManagement.ts`

- getUserList
  - 方法: GET
  - 路径: `/api/user/admin/users`
  - Query: `GetUserListParams`（默认 `{ page: 1, size: 10 }`）
  - Body: -

- resetUserPassword
  - 方法: PUT
  - 路径: `/api/user/admin/users/{userId}/reset-password`
  - Path: `userId: number`
  - Query: -
  - Body: -

- getUserDetail
  - 方法: GET
  - 路径: `/api/user/admin/users/{userId}`
  - Path: `userId: number`
  - Query: -
  - Body: -

---

### Venue 预约审核（`src/api/Venue/bookingReviewApi.tsx`）
类型定义参考：`src/types/apiTypes/bookingReview.ts`

- getAdminOrders
  - 方法: GET
  - 路径: `/api/reservations/admin/orders`
  - Query: `GetAdminOrdersParams`（可选）
  - Body: -

- completeOrder
  - 方法: POST
  - 路径: `/api/reservations/admin/{id}/complete`
  - Path: `id: number`
  - Query: -
  - Body: -

- approveRefund
  - 方法: POST
  - 路径: `/api/reservations/admin/{id}/approve-refund`
  - Path: `id: number`
  - Query: -
  - Body: `ApproveRefundData`

- cancelReservation
  - 方法: POST
  - 路径: `/api/reservations/{id}/cancel`
  - Path: `id: number`
  - Query: -
  - Body: `CancelReservationData`（可选）

---

### Venue 通知管理（`src/api/Venue/noticeApi.tsx`）
类型定义参考：`src/types/apiTypes/notice.ts`, `src/types/apiTypes/common.ts`

- getAdminNoticeList
  - 方法: GET
  - 路径: `/api/reservation/notice/admin`
  - Query: `PaginationParams`（默认 `{ pageNum: 1, pageSize: 10 }`）
  - Body: -

- createNotice
  - 方法: POST
  - 路径: `/api/reservation/notice`
  - Query: -
  - Body: `createNoticeData`

- updateNotice
  - 方法: PUT
  - 路径: `/api/reservation/notice/{id}`
  - Path: `id: number`
  - Query: -
  - Body: `createNoticeData`

- publishNotice
  - 方法: POST
  - 路径: `/api/reservation/notice/{id}/publish`
  - Path: `id: number`
  - Query: -
  - Body: -

- deleteNotice
  - 方法: DELETE
  - 路径: `/api/reservation/notice/{id}`
  - Path: `id: number`
  - Query: -
  - Body: -

---

### Venue 场地管理（`src/api/Venue/venueManagementApi.tsx`）
类型定义参考：`src/types/apiTypes/venueManagement.ts`

- getVenueList
  - 方法: GET
  - 路径: `/api/venue/list`
  - Query: -
  - Body: -

- addVenue
  - 方法: POST
  - 路径: `/api/venue/add`
  - Query: -
  - Body: `addVenueData`

- updateVenue
  - 方法: PUT
  - 路径: `/api/venue/update/{id}`
  - Path: `id: number`
  - Query: -
  - Body: `updateVenueData`

- updateVenueStatus
  - 方法: PUT
  - 路径: `/api/venue/status/{id}`
  - Path: `id: number`
  - Query: -
  - Body: `{ status: number }`

- deleteVenue
  - 方法: DELETE
  - 路径: `/api/venue/delete/{id}`
  - Path: `id: number`
  - Query: -
  - Body: -

- getVenueById
  - 方法: GET
  - 路径: `/api/venue/{id}`
  - Path: `id: number`
  - Query: -
  - Body: -

- getVenueListByStatus
  - 方法: GET
  - 路径: `/api/venue/list/status/{status}`
  - Path: `status: number`
  - Query: -
  - Body: -

- createSpecialDateConfig
  - 方法: POST
  - 路径: `/api/venue/special-config`
  - Query: -
  - Body: `createSpecialDateConfigData`

- getSpecialDateConfigList
  - 方法: GET
  - 路径: `/api/venue/special-config/list`
  - Query: `{ pageNum?: number, pageSize?: number }`
  - Body: -

- getSpecialDateConfigById
  - 方法: GET
  - 路径: `/api/venue/special-config/{id}`
  - Path: `id: number`
  - Query: -
  - Body: -

- updateSpecialDateConfig
  - 方法: PUT
  - 路径: `/api/venue/special-config/{id}`
  - Path: `id: number`
  - Query: -
  - Body: `updateSpecialDateConfigData`

- deleteSpecialDateConfig
  - 方法: DELETE
  - 路径: `/api/venue/special-config/{id}`
  - Path: `id: number`
  - Query: -
  - Body: -

- toggleSpecialDateConfig
  - 方法: PUT
  - 路径: `/api/venue/special-config/{id}/toggle`
  - Path: `id: number`
  - Query: -
  - Body: `{ enabled: number }`

