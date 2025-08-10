## Forum 论坛 API - 完整响应示例

### 获取帖子列表
GET /api/forum/posts

```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 2,
    "total": 2,
    "list": [
      {
        "id": 1,
        "title": "周末约球",
        "author": "张三",
        "avatar": "/uploads/a1.jpg",
        "category": "约球",
        "categoryCode": "match",
        "views": 20,
        "replyCount": 3,
        "likes": 5,
        "publishTime": "2024-05-01T10:00:00.000+0000",
        "lastReply": "2024-05-01T12:00:00.000+0000",
        "isTop": false
      },
      {
        "id": 2,
        "title": "装备推荐",
        "author": "李四",
        "avatar": "/uploads/a2.jpg",
        "category": "装备",
        "categoryCode": "gear",
        "views": 50,
        "replyCount": 10,
        "likes": 12,
        "publishTime": "2024-05-02T08:00:00.000+0000",
        "lastReply": "2024-05-02T09:30:00.000+0000",
        "isTop": true
      }
    ]
  }
}
```

### 获取帖子详情
GET /api/forum/posts/detail?postId=1

```json
{
  "code": 0,
  "msg": "请求成功",
  "data": {
    "id": 1,
    "title": "周末约球",
    "content": "本周六下午两点，3、4号场，欢迎报名",
    "author": "张三",
    "category": "约球",
    "views": 21,
    "replyCount": 3,
    "likes": 5,
    "isLiked": false,
    "publishTime": "2024-05-01T10:00:00.000+0000",
    "lastReply": "2024-05-01T12:00:00.000+0000",
    "isTop": false
  }
}
```

### 获取帖子回复
GET /api/forum/posts/{postId}/replies

```json
{
  "code": 0,
  "data": [
    {
      "id": 101,
      "postId": 1,
      "userId": 10001,
      "nickname": "王五",
      "username": "wangwu",
      "avatar": "/uploads/u1.jpg",
      "content": "报名+1",
      "parentId": null,
      "likes": 2,
      "isLiked": false,
      "replyTime": "2024-05-01 11:00:00",
      "children": [],
      "replyToId": null,
      "replyToUserId": null,
      "replyToUsername": null,
      "replyToNickname": null
    }
  ]
}
```

### 创建帖子（需登录）
POST /api/forum/posts/create

```json
{ "code": 0, "msg": "帖子发布成功", "data": { "postId": 123 } }
```

### 新增回复（需登录）
POST /api/forum/posts/{postId}/replies

```json
{ "code": 0, "data": 106 }
```

### 删除回复（作者/管理员）
DELETE /api/forum/posts/{postId}/replies/{replyId}

```json
{ "code": 0, "data": true }
```

### 点赞/取消点赞帖子
POST /api/forum/posts/{postId}/like → `{ "code": 0, "data": true }`

DELETE /api/forum/posts/{postId}/like → `{ "code": 0, "data": true }`

### 点赞/取消点赞回复
POST /api/forum/posts/{postId}/replies/{replyId}/like → `{ "code": 0, "data": true }`

DELETE /api/forum/posts/{postId}/replies/{replyId}/like → `{ "code": 0, "data": true }`

### 设置帖子置顶（管理员）
PUT /api/forum/posts/{id}/top

```json
{ "code": 0, "msg": "帖子已置顶", "data": true }
```

### 获取某用户发帖
GET /api/forum/posts/user

```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 1,
    "total": 1,
    "list": [
      { "id": 2, "title": "装备推荐", "author": "李四", "category": "装备", "likes": 12, "isTop": true }
    ]
  }
}
```

## Forum 论坛 API

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`
  - `code`: number（0 成功，非0失败）
  - `msg`: string（可选）
  - `data`: T

### 数据模型

- PageResult<T>
  - pageNum: number
  - pageSize: number
  - size: number
  - total: number
  - list: T[]

- PostListDto
  - id: number
  - title: string
  - author: string
  - avatar: string
  - category: string
  - categoryCode: string
  - views: number
  - replyCount: number
  - likes: number
  - publishTime: string
  - lastReply: string
  - isTop: boolean

- PostDetailDto
  - id, title, content, author, category, views, replyCount, likes, isLiked, publishTime, lastReply, isTop

- PostReplyDto
  - id, postId, userId, nickname, username, avatar, content, parentId, likes, isLiked, replyTime, children: PostReplyDto[], replyToId, replyToUserId, replyToUsername, replyToNickname

- PostCategory
  - id, name, code, description, sortOrder, createTime, updateTime

### 接口列表

#### 获取帖子列表
- 方法: GET
- 路径: `/api/forum/posts`
- Query:
  - page?: number = 1
  - pageSize?: number = 10
  - category?: string（分类代码，可空，默认 all）
  - keyword?: string
- 返回: `ResponseVo<PageResult<PostListDto>>`

#### 获取帖子分类列表
- 方法: GET
- 路径: `/api/forum/categories`
- 返回: `ResponseVo<PostCategory[]>`

#### 创建帖子（需登录）
- 方法: POST
- 路径: `/api/forum/posts/create`
- Body: `{ title: string, content: string, category: string }`
- 返回: `ResponseVo<{ postId: number }>`

#### 更新帖子（作者或管理员）
- 方法: PUT
- 路径: `/api/forum/posts/{id}`
- Body: `Post` 的可修改字段
- 返回: `ResponseVo<boolean>`

#### 删除帖子（作者或管理员）
- 方法: DELETE
- 路径: `/api/forum/posts/{id}`
- 返回: `ResponseVo<boolean>`

#### 获取帖子详情
- 方法: GET
- 路径: `/api/forum/posts/detail`
- Query: `postId: number`
- 返回: `ResponseVo<PostDetailDto>`

#### 获取帖子回复
- 方法: GET
- 路径: `/api/forum/posts/{postId}/replies`
- Query: `orderBy?: string = likes`（likes|time）
- 返回: `ResponseVo<PostReplyDto[]>`

#### 新增回复（需登录）
- 方法: POST
- 路径: `/api/forum/posts/{postId}/replies`
- Body: `{ content: string, parentId?: number, replyToId?: number, replyToUserId?: number }`
- 返回: `ResponseVo<number>`（新建回复ID）

#### 删除回复（作者或管理员）
- 方法: DELETE
- 路径: `/api/forum/posts/{postId}/replies/{replyId}`
- 返回: `ResponseVo<boolean>`

#### 点赞/取消点赞帖子（需登录）
- POST `/api/forum/posts/{postId}/like` → `ResponseVo<boolean>`
- DELETE `/api/forum/posts/{postId}/like` → `ResponseVo<boolean>`

#### 点赞/取消点赞回复（需登录）
- POST `/api/forum/posts/{postId}/replies/{replyId}/like` → `ResponseVo<boolean>`
- DELETE `/api/forum/posts/{postId}/replies/{replyId}/like` → `ResponseVo<boolean>`

#### 设置帖子置顶（管理员）
- 方法: PUT
- 路径: `/api/forum/posts/{id}/top`
- Query: `isTop: boolean`
- 返回: `ResponseVo<boolean>`

#### 获取用户发帖列表
- 方法: GET
- 路径: `/api/forum/posts/user`
- Query: `userId: number, page?: number=1, pageSize?: number=10`
- 返回: `ResponseVo<PageResult<PostListDto>>`

### 响应示例（获取帖子列表）
```json
{
  "code": 0,
  "data": {
    "pageNum": 1,
    "pageSize": 10,
    "size": 2,
    "total": 2,
    "list": [
      { "id": 1, "title": "招募同伴", "author": "张三", "category": "约球", "likes": 3, "isTop": false },
      { "id": 2, "title": "装备推荐", "author": "李四", "category": "装备", "likes": 5, "isTop": true }
    ]
  }
}
```

