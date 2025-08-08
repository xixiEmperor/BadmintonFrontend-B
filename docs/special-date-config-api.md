## Venue 特殊日期配置 API（管理员）- 完整响应示例

### 创建配置
POST /api/venue/special-config
```json
{ "code": 0, "data": "操作成功" }
```

### 配置列表
GET /api/venue/special-config/list
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
        "id": 1,
        "configName": "春节维护",
        "specialDate": "2024-02-10T00:00:00.000+0000",
        "configType": 2,
        "affectedVenueIds": "1,2",
        "startTime": "09:00",
        "endTime": "12:00",
        "venueStatus": 4,
        "bookable": 0,
        "description": "维护",
        "enabled": 1,
        "createTime": "2024-01-01T00:00:00.000+0000",
        "updateTime": "2024-01-01T00:00:00.000+0000"
      }
    ]
  }
}
```

### 配置详情
GET /api/venue/special-config/{id}
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "configName": "春节维护",
    "specialDate": "2024-02-10T00:00:00.000+0000",
    "configType": 2,
    "affectedVenueIds": "1,2",
    "startTime": "09:00",
    "endTime": "12:00",
    "venueStatus": 4,
    "bookable": 0,
    "description": "维护",
    "enabled": 1,
    "createTime": "2024-01-01T00:00:00.000+0000",
    "updateTime": "2024-01-01T00:00:00.000+0000"
  }
}
```

### 更新/删除/启用禁用
PUT /api/venue/special-config/{id}
```json
{ "code": 0, "data": "操作成功" }
```

DELETE /api/venue/special-config/{id}
```json
{ "code": 0, "data": "操作成功" }
```

PUT /api/venue/special-config/{id}/toggle
```json
{ "code": 0, "data": "操作成功" }
```

