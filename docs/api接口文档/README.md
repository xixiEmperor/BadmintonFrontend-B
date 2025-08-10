## 接口响应示例总览

本目录按模块给出“完整成功响应”的 JSON 示例，结构统一为：

```json
{
  "code": 0,
  "data": { /* 各接口的具体数据结构 */ }
}
```

模块文件：
- analytics-api.md（仪表盘/图表）
- forum-api.md（论坛）
- mall-api.md（商城订单与商品）
- user-api.md（用户管理-管理员）
- venue-api.md（场地查询与管理）
- venue-notice-api.md（通知管理）
- reservations-api.md（预约订单-用户与管理员）
- special-date-config-api.md（特殊日期配置-管理员）

## 接口文档目录

本目录按模块拆分，基于后端代码自动整理：

- analytics-api.md: 仪表盘与图表分析（管理员）
- forum-api.md: 论坛帖子与回复
- mall-api.md: 商城订单、商品与规格（含管理员）
- user-api.md: 用户资料与后台用户管理
- venue-api.md: 场地查询与场地管理
- venue-notice-api.md: 场地通知管理
- reservations-api.md: 场地预约订单（用户与管理员）
- special-date-config-api.md: 特殊日期配置（管理员）

通用返回体：

```json
{
  "code": 0,
  "msg": "可选消息",
  "data": {}
}
```

错误码参见 `src/main/java/com/wuli/badminton/enums/ResponseEnum.java`。

