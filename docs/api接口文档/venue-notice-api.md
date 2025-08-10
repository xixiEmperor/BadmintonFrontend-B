## Venue 通知管理 API - 完整响应示例

### 获取已发布通知列表（分页）
GET /api/reservation/notice

成功响应：
```json
{
  "code": 0,
  "data": {
    "total": 4,
    "list": [
      {
        "id": 4,
        "title": "羽毛球比赛报名通知",
        "content": "【羽毛球友谊赛】报名开始！\n\n比赛时间：2024年3月15日（周五）19:00-21:00\n比赛地点：本馆1-4号场地\n报名截止：2024年3月10日\n\n比赛分组：\n• 男子单打\n• 女子单打\n• 混合双打\n\n报名费：50元/人（含奖品费用）\n\n请到前台报名或联系客服微信：badminton2024",
        "type": 1,
        "typeDesc": "普通通知",
        "status": 1,
        "statusDesc": "已发布",
        "createTime": "2024-01-19T08:45:00.000+0000",
        "updateTime": "2024-01-19T08:45:00.000+0000",
        "publishTime": "2024-01-19T08:45:00.000+0000"
      },
      {
        "id": 2,
        "title": "春节营业时间调整",
        "content": "亲爱的会员朋友们：\n\n春节期间（2024年2月10日-2024年2月17日）营业时间调整如下：\n\n• 2月10日-2月12日：正常营业（9:00-22:00）\n• 2月13日-2月15日：休息\n• 2月16日-2月17日：正常营业（9:00-22:00）\n\n2月18日起恢复正常营业时间。\n\n祝大家春节快乐！",
        "type": 2,
        "typeDesc": "重要通知",
        "status": 1,
        "statusDesc": "已发布",
        "createTime": "2024-01-18T06:20:00.000+0000",
        "updateTime": "2024-01-18T06:20:00.000+0000",
        "publishTime": "2024-01-18T06:20:00.000+0000"
      },
      {
        "id": 3,
        "title": "新会员优惠活动",
        "content": "新会员福利来啦！\n\n即日起至2024年2月29日，新注册会员可享受：\n\n1. 首次充值满200元送50元\n2. 免费体验课程一次\n3. 专业教练指导\n\n活动详情请咨询前台工作人员。\n\n名额有限，先到先得！",
        "type": 1,
        "typeDesc": "普通通知",
        "status": 1,
        "statusDesc": "已发布",
        "createTime": "2024-01-16T01:15:00.000+0000",
        "updateTime": "2024-01-16T01:15:00.000+0000",
        "publishTime": "2024-01-16T01:15:00.000+0000"
      },
      {
        "id": 1,
        "title": "场地维护通知",
        "content": "尊敬的用户：\n\n为了给大家提供更好的运动环境，本羽毛球馆将于本周六（2024年1月20日）上午8:00-12:00进行场地维护工作。\n\n维护期间暂停对外开放，给您带来的不便敬请谅解。\n\n维护完成后将第一时间恢复正常营业。\n\n感谢您的理解与支持！",
        "type": 2,
        "typeDesc": "重要通知",
        "status": 1,
        "statusDesc": "已发布",
        "createTime": "2024-01-15T02:30:00.000+0000",
        "updateTime": "2024-01-15T02:30:00.000+0000",
        "publishTime": "2024-01-15T02:30:00.000+0000"
      }
    ],
    "pageNum": 1,
    "pageSize": 5,
    "size": 4,
    "startRow": 1,
    "endRow": 4,
    "pages": 1,
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

### 获取通知详情
GET /api/reservation/notice/{id}

成功响应：
```json
{
  "code": 0,
  "data": {
    "id": 4,
    "title": "羽毛球比赛报名通知",
    "content": "……",
    "type": 1,
    "typeDesc": "普通通知",
    "status": 1,
    "statusDesc": "已发布",
    "createTime": "2024-01-19T08:45:00.000+0000",
    "updateTime": "2024-01-19T08:45:00.000+0000",
    "publishTime": "2024-01-19T08:45:00.000+0000"
  }
}
```

（管理员接口列表的完整 JSON 示例见 admin 版接口：列表、创建、更新、发布、删除均返回 `code + data` 的消息或分页结构。）

## Venue 通知管理 API

- Base URL: `http://localhost:8080`
- 统一返回: `ResponseVo<T>`

### 数据模型
- NoticeVo: id, title, content, type, typeDesc, status, statusDesc, createTime, updateTime, publishTime
- NoticeDto: title, content, type(1普通/2重要)

### 前台/公共

#### 获取已发布通知列表
- GET `/api/reservation/notice`
- Query: `pageNum?: number=1, pageSize?: number=10, type?: number`
- 返回: `ResponseVo<PageInfo<NoticeVo>>`

#### 获取通知详情
- GET `/api/reservation/notice/{id}`
- 返回: `ResponseVo<NoticeVo>`

### 管理员

#### 获取所有通知（含草稿）
- GET `/api/reservation/notice/admin`
- Query: `pageNum?: number=1, pageSize?: number=10`
- 返回: `ResponseVo<PageInfo<NoticeVo>>`

#### 创建通知（草稿）
- POST `/api/reservation/notice`
- Body: `NoticeDto`
- 返回: `ResponseVo<number>`（noticeId）

#### 更新通知
- PUT `/api/reservation/notice/{id}`
- Body: `NoticeDto`
- 返回: `ResponseVo<string>`

#### 发布通知
- POST `/api/reservation/notice/{id}/publish`
- 返回: `ResponseVo<string>`

#### 删除通知
- DELETE `/api/reservation/notice/{id}`
- 返回: `ResponseVo<string>`

