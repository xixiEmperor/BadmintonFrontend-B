## Reservations 预约订单 API - 完整响应示例

### 创建预约订单
POST /api/reservations/create
```json
{
  "code": 0,
  "data": {
    "id": 88,
    "orderNo": "R202405010001",
    "username": "alice",
    "venueName": "1号场",
    "reservationDate": "2024-05-01",
    "startTime": "09:00",
    "endTime": "11:00",
    "duration": 2,
    "pricePerHour": 60,
    "totalAmount": 120,
    "status": 10,
    "statusDesc": "待支付",
    "canCancel": true,
    "canRefund": false,
    "createTime": "2024-05-01 08:00:00"
  }
}
```

### 我的订单（分页）
GET /api/reservations/my-orders
```json
{
  "code": 0,
  "data": {
    "list": [
      { "orderNo": "R202405010001", "venueName": "1号场", "reservationDate": "2024-05-01", "startTime": "09:00", "endTime": "11:00", "status": 10, "statusDesc": "待支付" }
    ],
    "total": 1,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

### 订单详情（ID / 订单号）
GET /api/reservations/{id}
```json
{ "code": 0, "data": { "orderNo": "R202405010001", "status": 10 } }
```

GET /api/reservations/order-no/{orderNo}
```json
{ "code": 0, "data": { "orderNo": "R202405010001", "status": 10 } }
```

### 取消订单
POST /api/reservations/{id}/cancel
```json
{ "code": 0, "data": "订单取消成功" }
```

### 申请退款
POST /api/reservations/{id}/refund
```json
{ "code": 0, "data": "退款申请提交成功，请等待管理员审核" }
```

### 查询某日可用性
GET /api/reservations/availability
```json
{
  "code": 0,
  "data": {
    "isAvailable": true,
    "reservations": [
      { "orderNo": "R202405010001", "venueId": 1, "reservationDate": "2024-05-01", "startTime": "09:00", "endTime": "11:00" }
    ]
  }
}
```

### 查询场地预约记录
GET /api/reservations/venue/{venueId}
```json
{ "code": 0, "data": [ { "orderNo": "R202405010001", "reservationDate": "2024-05-01", "startTime": "09:00", "endTime": "11:00" } ] }
```

### 支付回调 & 关联支付
POST /api/reservations/payment/callback
```json
{ "code": 0, "data": "支付成功" }
```

POST /api/reservations/payment/link
```json
{ "code": 0, "data": "支付信息关联成功" }
```

### 管理员：订单列表（分页搜索）
GET /api/reservations/admin/orders
```json
{
  "code": 0,
  "data": {
    "list": [ { "orderNo": "R202405010001", "username": "alice", "status": 10 } ],
    "total": 1,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

### 管理员：完成订单
POST /api/reservations/admin/{id}/complete
```json
{ "code": 0, "data": "订单完成" }
```

### 管理员：审批退款
POST /api/reservations/admin/{id}/approve-refund
```json
{ "code": 0, "data": "退款审批通过，已完成退款" }
```

## Reservations 预约订单 API

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`

### 数据模型
- ReservationOrderVo: 见源码（id, orderNo, username, venueName, reservationDate, startTime, endTime, duration, pricePerHour, totalAmount, status, statusDesc, payType, payTypeDesc, payTime, refundAmount, refundTime, cancelReason, remark, createTime, updateTime, canCancel, canRefund）
- ReservationOrderDto: venueId, reservationDate(YYYY-MM-DD), startTime(HH:mm), endTime(HH:mm), remark?
- ReservationOrderQueryDto: userId?, venueId?, status?, startDate?, endDate?, payType?, orderNo?, username?, page=1, size=10

### 用户端

#### 创建预约订单
- POST `/api/reservations/create`
- Body: `ReservationOrderDto`
- 返回: `ResponseVo<ReservationOrderVo>`

#### 我的订单（分页）
- GET `/api/reservations/my-orders`
- Query: `page?: number=1, size?: number=10, status?: number`
- 返回: `ResponseVo<{ list: ReservationOrderVo[], total: number, page: number, size: number, totalPages: number }>`

#### 订单详情（根据ID）
- GET `/api/reservations/{id}`
- 返回: `ResponseVo<ReservationOrderVo>`

#### 订单详情（根据订单号）
- GET `/api/reservations/order-no/{orderNo}`
- 返回: `ResponseVo<ReservationOrderVo>`

#### 取消订单
- POST `/api/reservations/{id}/cancel`
- Query: `reason?: string`
- 返回: `ResponseVo<string>`

#### 申请退款
- POST `/api/reservations/{id}/refund`
- Query: `reason?: string`
- 返回: `ResponseVo<string>`

#### 查询某日可用性（可选固定时段）
- GET `/api/reservations/availability`
- Query: `venueId?: number, date: string(YYYY-MM-DD), startTime?: string(HH:mm), endTime?: string(HH:mm)`
- 返回: `ResponseVo<{ isAvailable?: boolean, reservations: ReservationOrderVo[] }>`

#### 查询场地预约记录
- GET `/api/reservations/venue/{venueId}`
- Query: `date: string(YYYY-MM-DD)`
- 返回: `ResponseVo<ReservationOrderVo[]>`

#### 支付回调（供支付系统）
- POST `/api/reservations/payment/callback`
- Query: `orderNo: string, payInfoId: number`
- 返回: `ResponseVo<string>`

#### 关联支付信息（下单后生成二维码后调用）
- POST `/api/reservations/payment/link`
- Query: `orderNo: string, payInfoId: number`
- 返回: `ResponseVo<string>`

### 管理端

#### 预约订单列表（分页搜索）
- GET `/api/reservations/admin/orders`
- Query: `ReservationOrderQueryDto`（见上）
- 返回: `ResponseVo<{ list: ReservationOrderVo[], total: number, page: number, size: number, totalPages: number }>`

#### 完成订单
- POST `/api/reservations/admin/{id}/complete`
- 返回: `ResponseVo<string>`

#### 审批退款
- POST `/api/reservations/admin/{id}/approve-refund`
- Query: `approved: boolean, adminRemark?: string`
- 返回: `ResponseVo<string>`

### 响应示例（我的订单）
```json
{
  "code": 0,
  "data": {
    "list": [{ "orderNo": "R202405010001", "venueName": "1号场", "status": 10 }],
    "total": 1,
    "page": 1,
    "size": 10,
    "totalPages": 1
  }
}
```

