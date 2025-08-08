## Shop 商城 API - 完整响应示例

### 创建订单
POST /api/mall/orders
```json
{ "code": 0, "data": 202405010001 }
```

### 获取订单列表
GET /api/mall/orders
```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 1,
    "orderBy": null,
    "startRow": 1,
    "endRow": 1,
    "total": 1,
    "pages": 1,
    "list": [
      {
        "id": 10,
        "orderNo": 202405010001,
        "userId": 1,
        "totalPrice": 199.0,
        "paymentType": 1,
        "status": 10,
        "paymentTime": null,
        "pickupCode": null,
        "username": null,
        "userEmail": null,
        "createTime": "2024-05-01 10:00:00",
        "orderItemList": [
          {
            "id": 100,
            "orderNo": 202405010001,
            "productId": 3,
            "productName": "羽毛球拍",
            "productImage": "/imgs/p3.jpg",
            "currentUnitPrice": 199.0,
            "quantity": 1,
            "totalPrice": 199.0,
            "specificationId": 12,
            "specs": { "color": "红色", "size": "S" },
            "priceAdjustment": 0
          }
        ]
      }
    ],
    "prePage": 0,
    "nextPage": 0,
    "isFirstPage": true,
    "isLastPage": true,
    "hasPreviousPage": false,
    "hasNextPage": false,
    "navigatePages": 8,
    "navigatepageNums": [1],
    "navigateFirstPage": 1,
    "navigateLastPage": 1
  }
}
```

### 获取订单详情
GET /api/mall/orders/{orderNo}
```json
{
  "code": 0,
  "data": {
    "orderNo": 202405010001,
    "status": 10,
    "orderItemList": [
      { "productName": "羽毛球拍", "quantity": 1, "currentUnitPrice": 199.0, "totalPrice": 199.0 }
    ]
  }
}
```

### 取消订单
POST /api/mall/orders/{orderNo}/cancel
```json
{ "code": 0, "data": "取消订单成功" }
```

### 查询订单状态
GET /api/mall/orders/{orderNo}/status
```json
{ "code": 0, "data": 10 }
```

### 立即购买
POST /api/mall/orders/buy-now
```json
{ "code": 0, "data": 202405010002 }
```

### 管理员订单列表
GET /api/mall/orders/admin
```json
{ "code": 0, "data": { "pageNum": 1, "pageSize": 10, "size": 0, "total": 0, "list": [] } }
```

### 管理员关闭订单
POST /api/mall/orders/admin/{orderNo}/close
```json
{ "code": 0, "data": "订单关闭成功" }
```

### 管理员完成订单（核验提货码）
POST /api/mall/orders/admin/{orderNo}/complete
```json
{ "code": 0, "data": "订单完成成功" }
```

### 获取商品分类
GET /api/mall/categories
```json
{
  "code": 0,
  "data": [
    { "id": 1, "name": "拍类", "status": 1, "sortOrder": 1, "createTime": "2024-01-01T00:00:00.000+0000", "updateTime": "2024-01-01T00:00:00.000+0000" }
  ]
}
```

### 获取商品列表
GET /api/mall/products
```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 1,
    "total": 1,
    "list": [
      {
        "id": 3,
        "categoryId": 1,
        "categoryName": "拍类",
        "name": "羽毛球拍A",
        "subtitle": "轻量碳素",
        "mainImage": "/imgs/a.jpg",
        "price": 199.0,
        "stock": 50,
        "sales": 100,
        "status": 1,
        "hasSpecification": 1
      }
    ]
  }
}
```

### 获取商品详情
GET /api/mall/products/{productId}
```json
{
  "code": 0,
  "data": {
    "id": 3,
    "categoryId": 1,
    "categoryName": "拍类",
    "name": "羽毛球拍A",
    "subtitle": "轻量碳素",
    "mainImage": "/imgs/a.jpg",
    "subImages": "/imgs/a1.jpg,/imgs/a2.jpg",
    "detail": "……",
    "price": 199.0,
    "stock": 50,
    "sales": 100,
    "status": 1,
    "hasSpecification": 1,
    "specifications": [
      { "specs": { "color": "红色", "size": "S" }, "priceAdjustment": 0, "stock": 20 }
    ],
    "specOptions": { "color": ["红色","蓝色"], "size": ["S","M","L"] },
    "createTime": "2024-01-01T00:00:00.000+0000",
    "updateTime": "2024-01-01T00:00:00.000+0000"
  }
}
```

### 上传商品图片（管理员）
POST /api/mall/products/upload
```json
{ "code": 0, "msg": "上传成功", "data": "{\"mainImage\":\"/imgs/a.jpg\",\"subImages\":[\"/imgs/a1.jpg\"]}" }
```

### 新增/更新/上架/下架/删除/更新库存（管理员）
返回均为：
```json
{ "code": 0, "msg": "操作成功" }
```

### 规格相关
GET /api/mall/products/{productId}/specifications
```json
{ "code": 0, "data": [ { "id": 12, "productId": 3, "specifications": {"color":"红色","size":"S"}, "priceAdjustment": 0, "stock": 20, "sales": 5, "status": 1 } ] }
```

POST /api/mall/products/{productId}/specification
```json
{ "code": 0, "data": { "id": 12, "productId": 3, "specifications": {"color":"红色","size":"S"}, "priceAdjustment": 0, "stock": 20, "sales": 5, "status": 1 } }
```

GET /api/mall/products/{productId}/spec_options
```json
{ "code": 0, "data": [ { "id": 1, "productId": 3, "specKey": "color", "specValues": ["红色","蓝色"] } ] }
```

POST /api/mall/products/{productId}/specifications（管理员）
```json
{ "code": 0, "msg": "添加商品规格成功", "data": { "specificationId": 99 } }
```

PUT /api/mall/specifications/{specificationId}（管理员）
```json
{ "code": 0, "msg": "更新商品规格成功" }
```

DELETE /api/mall/specifications/{specificationId}（管理员）
```json
{ "code": 0, "msg": "删除商品规格成功" }
```

PUT /api/mall/specifications/{specificationId}/stock（管理员）
```json
{ "code": 0, "msg": "更新规格库存成功" }
```

## Shop 商城 API

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`

### 数据模型

- OrderVo
  - id, orderNo, userId, totalPrice, paymentType, status, paymentTime, pickupCode, username, userEmail, createTime, orderItemList: OrderItemVo[]
  - OrderItemVo: id, orderNo, productId, productName, productImage, currentUnitPrice, quantity, totalPrice, specificationId, specs: Record<string,string>, priceAdjustment

- ProductListDto / ProductDetailDto（见源码字段）
- ProductSpecification: id, productId, specifications, priceAdjustment, stock, sales, status, createTime, updateTime
- SpecificationOption: id, productId, specKey, specValues[], createTime, updateTime

### 订单

#### 创建订单
- POST `/api/mall/orders`
- 返回: `ResponseVo<number>`（orderNo）

#### 获取订单列表
- GET `/api/mall/orders`
- Query: `pageNum?: number=1, pageSize?: number=10, status?: number`
- 返回: `ResponseVo<PageInfo<OrderVo>>`

#### 获取订单详情
- GET `/api/mall/orders/{orderNo}`
- 返回: `ResponseVo<OrderVo>`

#### 取消订单
- POST `/api/mall/orders/{orderNo}/cancel`
- 返回: `ResponseVo<string>`

#### 查询订单状态
- GET `/api/mall/orders/{orderNo}/status`
- 返回: `ResponseVo<number>`（状态码：10-未付款，20-已付款，30-已取消，40-已完成，50-已关闭）

#### 立即购买
- POST `/api/mall/orders/buy-now`
- Body: `{ productId: number, quantity: number, specs?: Record<string,string> }`
- 返回: `ResponseVo<number>`（orderNo）

### 订单（管理员）

#### 管理员订单列表
- GET `/api/mall/orders/admin`
- Query: `pageNum?: number=1, pageSize?: number=10, username?: string, orderNo?: number`
- 返回: `ResponseVo<PageInfo<OrderVo>>`

#### 管理员关闭订单
- POST `/api/mall/orders/admin/{orderNo}/close`
- 返回: `ResponseVo<string>`

#### 管理员完成订单（核验提货码）
- POST `/api/mall/orders/admin/{orderNo}/complete`
- Query: `pickupCode: string`
- 返回: `ResponseVo<string>`

### 商品与规格

#### 获取商品分类
- GET `/api/mall/categories`
- 返回: `ResponseVo<MallCategory[]>`

#### 获取商品列表
- GET `/api/mall/products`
- Query: `categoryId?: string='all', keyword?: string, pageNum?: number=1, pageSize?: number=10, orderBy?: 'price_asc'|'price_desc'|'sales_desc'`
- 返回: `ResponseVo<PageResult<ProductListDto>>`

#### 获取商品详情
- GET `/api/mall/products/{productId}`
- 返回: `ResponseVo<ProductDetailDto>`

#### 上传商品图片（管理员）
- POST `/api/mall/products/upload`
- Body: FormData: `mainImage: File`, `subImages?: File[]`
- 返回: `ResponseVo<string>`（图片信息JSON）

#### 新增商品（管理员）
- POST `/api/mall/products`
- Body: `ProductAddDto`
- 返回: `ResponseVo<{ productId: number } | string>`

#### 更新商品（管理员）
- PUT `/api/mall/products/{productId}`
- Body: `ProductAddDto`
- 返回: `ResponseVo<string>`

#### 上架商品（管理员）
- PUT `/api/mall/products/{productId}/on_sale`
- 返回: `ResponseVo<string>`

#### 下架商品（管理员）
- PUT `/api/mall/products/{productId}/off_sale`
- 返回: `ResponseVo<string>`

#### 删除商品（管理员）
- DELETE `/api/mall/products/{productId}`
- 返回: `ResponseVo<string>`

#### 更新商品库存（管理员）
- PUT `/api/mall/products/{productId}/stock`
- Body: `{ stock: number }`
- 返回: `ResponseVo<string>`

#### 获取商品规格列表
- GET `/api/mall/products/{productId}/specifications`
- 返回: `ResponseVo<ProductSpecification[]>`

#### 根据规格条件获取具体规格
- POST `/api/mall/products/{productId}/specification`
- Body: `Record<string,string>`
- 返回: `ResponseVo<ProductSpecification>`

#### 获取规格选项
- GET `/api/mall/products/{productId}/spec_options`
- 返回: `ResponseVo<SpecificationOption[]>`

#### 添加商品规格（管理员）
- POST `/api/mall/products/{productId}/specifications`
- Body: `ProductSpecification`
- 返回: `ResponseVo<{ specificationId: number } | string>`

#### 更新商品规格（管理员）
- PUT `/api/mall/specifications/{specificationId}`
- Body: `ProductSpecification`
- 返回: `ResponseVo<string>`

#### 删除商品规格（管理员）
- DELETE `/api/mall/specifications/{specificationId}`
- 返回: `ResponseVo<string>`

#### 更新规格库存（管理员）
- PUT `/api/mall/specifications/{specificationId}/stock`
- Body: `{ stock: number }`
- 返回: `ResponseVo<string>`

### 响应示例（获取订单详情）
```json
{
  "code": 0,
  "data": {
    "orderNo": 202405010001,
    "status": 10,
    "orderItemList": [
      { "productName": "羽毛球拍", "quantity": 1, "currentUnitPrice": 199.0, "totalPrice": 199.0 }
    ]
  }
}
```

