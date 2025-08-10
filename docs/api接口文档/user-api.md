## User 用户 API - 完整响应示例

### 获取当前用户基本信息
GET /api/user/info
```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "ROLE_USER",
  "avatar": "/avatars/a.jpg",
  "createTime": "2024-01-01T00:00:00.000+0000"
}
```

### 获取当前用户资料
GET /api/user/profile
```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "username": "alice",
    "nickname": "Alice",
    "phone": "",
    "bio": "",
    "role": "ROLE_USER",
    "gender": null,
    "birthday": null,
    "location": null,
    "avatar": "/avatars/a.jpg",
    "createdAt": "2024-01-01 00:00:00",
    "lastLoginAt": "2024-05-01 09:00:00"
  }
}
```

### 更新当前用户资料
PUT /api/user/profile
```json
{ "code": 0, "msg": "更新成功", "data": { "id": 1, "username": "alice", "nickname": "Alice" } }
```

### 上传头像
POST /api/user/avatar
```json
{ "code": 0, "msg": "上传成功", "data": { "avatarUrl": "/avatars/a.jpg" } }
```

### 管理员：用户列表
GET /api/user/admin/users
```json
{
  "code": 0,
  "msg": "查询成功",
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 1,
    "total": 1,
    "list": [
      { "id": 1, "username": "alice", "email": "alice@example.com", "role": "ROLE_USER", "avatar": "/avatars/a.jpg", "nickname": "Alice" }
    ]
  }
}
```

### 管理员：重置用户密码
PUT /api/user/admin/users/{userId}/reset-password
```json
{ "code": 0, "data": "密码重置成功，新密码为：123456" }
```

### 管理员：用户详情
GET /api/user/admin/users/{userId}
```json
{ "code": 0, "msg": "查询成功", "data": { "id": 1, "username": "alice", "nickname": "Alice", "role": "ROLE_USER" } }
```

## User 用户 API

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`（部分接口直接 `ResponseEntity` 返回用户对象）

### 数据模型
- UserProfileDto: id, username, nickname, phone, bio, role, gender, birthday, location, avatar, createdAt, lastLoginAt
- UserManageDto: id, username, email, role, avatar, nickname, phone, gender, location, createTime, lastLoginAt
- PageResult<T>: 参见通用模型

### 通用

#### 获取当前用户基本信息
- GET `/api/user/info`
- 返回: `200 OK` + `User` 对象（无 password 字段）

#### 获取当前用户个人资料
- GET `/api/user/profile`
- 返回: `ResponseVo<UserProfileDto>`

#### 更新当前用户个人资料
- PUT `/api/user/profile`
- Body: `UserProfileUpdateDto`
- 返回: `ResponseVo<UserProfileDto>`

#### 上传头像
- POST `/api/user/avatar`
- Body: FormData: `file: File`
- 返回: `ResponseVo<AvatarResponseDto>`

### 管理员

#### 分页查询用户列表
- GET `/api/user/admin/users`
- Query: `keyword?: string, role?: string, page?: number=1, size?: number=10`
- 返回: `ResponseVo<PageResult<UserManageDto>>`

#### 重置用户密码
- PUT `/api/user/admin/users/{userId}/reset-password`
- 返回: `ResponseVo<string>`（成功时消息包含新密码：123456）

#### 获取用户详情
- GET `/api/user/admin/users/{userId}`
- 返回: `ResponseVo<UserProfileDto>`

### 响应示例（获取当前用户资料）
```json
{
  "code": 0,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "username": "alice",
    "nickname": "Alice",
    "role": "ROLE_USER"
  }
}
```

