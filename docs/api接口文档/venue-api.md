## Venue 场地 API - 完整响应示例

### 获取场地列表
GET /api/venue/list
```json
{ "code": 0, "data": [ { "id": 1, "name": "1号场", "location": "A区", "pricePerHour": 60, "type": 1, "typeDesc": "羽毛球", "status": 1, "statusDesc": "启用" } ] }
```

### 场地状态矩阵
GET /api/venue/status-matrix
```json
{
  "code": 0,
  "data": {
    "date": "2024-05-01",
    "venues": [ { "id": 1, "name": "1号场", "location": "A区", "pricePerHour": 60, "isAvailable": true } ],
    "timeSlots": ["09:00", "10:00"],
    "statusMatrix": {
      "1": {
        "09:00": { "status": 1, "statusDesc": "空闲中", "bookable": true, "reason": null, "reservationId": null, "username": null },
        "10:00": { "status": 3, "statusDesc": "已预约", "bookable": false, "reason": "用户预约", "reservationId": 1001, "username": "alice" }
      }
    }
  }
}
```

### 时间段可用性查询
GET /api/venue/availability
```json
{
  "code": 0,
  "data": {
    "date": "2024-05-01",
    "timeSlot": "09:00-11:00",
    "totalAvailable": 8,
    "totalVenues": 12,
    "availableVenues": [ { "id": 1, "name": "1号场", "location": "A区", "pricePerHour": 60, "type": 1, "typeDesc": "羽毛球" } ],
    "unavailableVenues": [ { "id": 3, "name": "3号场", "location": "A区", "pricePerHour": 60, "unavailableReason": "维护中", "status": 4, "statusDesc": "维护中" } ]
  }
}
```

### 按状态获取场地
GET /api/venue/list/status/{status}
```json
{ "code": 0, "data": [ { "id": 1, "name": "1号场", "status": 1, "statusDesc": "启用" } ] }
```

### 场地详情
GET /api/venue/{id}
```json
{ "code": 0, "data": { "id": 1, "name": "1号场", "location": "A区", "pricePerHour": 60, "status": 1, "statusDesc": "启用" } }
```

### 管理员：新增/更新/状态/删除
返回均为：
```json
{ "code": 0, "data": "操作成功" }
```

## Venue 场地 API（场地查询与管理）

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`

### 数据模型
- VenueVo: id, name, description, location, pricePerHour, type, typeDesc, status, statusDesc, createTime, updateTime
- VenueStatusMatrixVo
  - date: string
  - venues: { id, name, location, pricePerHour, isAvailable }[]
  - timeSlots: string[]
  - statusMatrix: Record<venueId, Record<timeSlot, { status, statusDesc, bookable, reason, reservationId, username }>>
- VenueAvailabilityVo
  - date, timeSlot, totalAvailable, totalVenues, availableVenues[], unavailableVenues[]

### 场地查询

#### 获取所有场地
- GET `/api/venue/list`
- 返回: `ResponseVo<VenueVo[]>`

#### 获取场地状态矩阵
- GET `/api/venue/status-matrix`
- Query: `date: string(YYYY-MM-DD)`, `venueId?: number`
- 返回: `ResponseVo<VenueStatusMatrixVo>`

#### 查询时间段可用性（可用于找可预约场地）
- GET `/api/venue/availability`
- Query: `date: string(YYYY-MM-DD)`, `startTime: string(HH:mm)`, `endTime: string(HH:mm)`, `venueType?: number`, `minPrice?: number`, `maxPrice?: number`
- 返回: `ResponseVo<VenueAvailabilityVo>`

#### 按状态获取场地
- GET `/api/venue/list/status/{status}`
- Path: `status: number`
- 返回: `ResponseVo<VenueVo[]>`

#### 根据ID获取场地详情
- GET `/api/venue/{id}`
- 返回: `ResponseVo<VenueVo>`

### 场地管理（管理员）

#### 新增场地
- POST `/api/venue/add`
- Body: `VenueDto`
- 返回: `ResponseVo<string>`

#### 更新场地
- PUT `/api/venue/update/{id}`
- Body: `VenueDto`
- 返回: `ResponseVo<string>`

#### 更新场地状态
- PUT `/api/venue/status/{id}`
- Query: `status: number`（0-未启用，1-启用）
- 返回: `ResponseVo<string>`

#### 删除场地
- DELETE `/api/venue/delete/{id}`
- 返回: `ResponseVo<string>`

