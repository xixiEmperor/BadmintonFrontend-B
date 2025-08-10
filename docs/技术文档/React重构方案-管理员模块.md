### 管理后台（商城/通知/论坛/用户）React 重构方案与实现逻辑

面向文件：`src/views/admin/shop/ProductManagement.vue`、`src/views/admin/shop/OrderManagement.vue`、`src/views/admin/Notice.vue`、`src/views/admin/ForumManagement.vue`、`src/views/admin/ForumPostDetail.vue`、`src/views/admin/UserManagement.vue` 及其依赖的 `src/api/*`、`src/utils/*`。

本文档输出以下内容：

- 各版块的现有实现逻辑拆解
- 对应的 React + TypeScript 重构方案（页面结构、组件划分、状态与数据流、API 交互、关键交互细节、边界场景）
- 目录结构建议与可复用基础设施
- 可直接用于代码生成的提示词（Prompt），按模块给出

建议技术栈：

- UI：Ant Design（或保持 Element Plus React 生态替代方案也可）
- 路由：React Router v6
- 数据：Zustand（极轻全局状态，如用户信息/权限）
- HTTP：Axios（沿用现有拦截器思想），统一 code 判定（后端规范为 `code===0` 成功）
- 语言：TypeScript
- 构建：Vite

---

## 一、公共基础设施（跨模块复用）

### 3. 列表页通用壳与分页

- `TablePageLayout`：页头 + 搜索区 + 表格 + 分页
- `usePagination`：驱动分页参数（`pageNum/pageSize`），与 antd `Pagination` 双向绑定
- `useQueryString`（可选）：将搜索条件与分页写入 URL，便于分享或刷新保持状态

### 4. 图片上传与预览

- 复用现有思路：主图 + 子图，`FormData` 一次性提交至 `/api/mall/products/upload`
- 先本地 `FileReader` 预览，上传返回后以真实 URL 回填；`subImages` 统一逗号拼接字符串

### 5. 时间与标签映射

- `formatDateTime` 直接用 dayjs 或复用现有 `src/utils/format.js` 行为
- 各状态枚举在 `types.ts` 中统一定义，渲染层以映射表输出标签文案与颜色

### 6. 任务队列（并发与重试）

- 将 `src/utils/TaskQueue.js` 改写为 TypeScript 版本，保持：并发控制、指数退避重试、超时、暂停/恢复/停止、进度回调
- 供“商品规格批量保存”使用，避免高并发写入导致的数据库死锁

---

## 二、商城相关

### A. 商品管理（对应 `ProductManagement.vue` + `ProductDialog.vue` + `SpecificationManager.vue`）

#### 现有逻辑拆解

- 列表：`getProductsByAdmin({pageNum,pageSize,keyword,categoryId,status})`
- 分类：`getCategories()` -> 下拉筛选
- 详情：编辑前调用 `getProductDetail(id)` 合并列表数据
- 上/下架：`onSaleProduct(id)` / `offSaleProduct(id)`
- 删除：二次确认后 `deleteProduct(id)`
- 添加/编辑：表单提交前先统一上传图片 `uploadProductImages(formData)`，成功后将返回 URL 写入 `form.mainImage/subImages`，再 `addProduct` 或 `updateProduct`
- 多规格：
  - 读取“规格选项” `getProductSpecOptions(productId)` 填入选择器
  - 基于选项组合生成全量 SKU 组合（全排列），每个组合含 `priceAdjustment/stock`
  - 使用 `createSpecificationTaskQueue` 以 2 并发、重试与间隔批量落库：`addProductSpecification(productId, { specifications, priceAdjustment, stock })`
  - 已有规格的编辑与删除：`updateSpecification(specId,{priceAdjustment,stock})`、`deleteSpecification(specId)`

#### React 重构设计

- 页面：`features/shop/pages/ProductManagementPage.tsx`

  - 搜索表单：关键词、分类、状态；触发时置 `pageNum=1`
  - 表格列：图片、名称/副标题、分类、价格、库存、状态、是否多规格、操作（上/下架、编辑、规格、删除）
  - 分页：与 TanStack Query 参数联动
  - 模态：`ProductDialog`（新增/编辑）、`SpecificationManager`（规格管理）
- 组件：

  - `features/shop/components/ProductDialog.tsx`
    - Form 表单（name/subtitle/categoryId/price/stock/status/hasSpecification/mainImage/subImages/detail）
    - 主图/子图上传：沿用“选择->本地预览->统一上传->回填”的流程
    - 多规格开关：打开时禁用顶层库存输入并展示提示；保存后再去规格管理里设置各 SKU 库存
  - `features/shop/components/SpecificationManager.tsx`
    - Step1：选择规格类型与值（支持预设 key：color/size/material/style、自定义 custom key）
    - Step2：一键生成组合表格，逐行输入价格调整与库存
    - Step3：点击“批量保存”触发队列；展示实时进度、暂停/恢复/停止、失败任务查看与重试
    - 现有规格表：内联编辑（priceAdjustment/stock）、删除
- 数据流与缓存：

  - `useQuery(['shop.products', params], fetcher)` 拉取列表
  - `useMutation`（上/下架、删除、保存）在成功回调中 `invalidateQueries('shop.products')`
  - 规格管理成功后同时失效 `['shop.specs', productId]`
- TS 类型（示例节选）

```ts
export interface Category { id: number; name: string }
export interface Product {
  id: number; name: string; subtitle: string; categoryId: number; categoryName?: string;
  price: number; stock: number; status: 1|2; mainImage: string; subImages?: string; detail?: string;
  hasSpecification: 0|1;
}
export interface ProductSpecification {
  id: number; specifications: Record<string,string>; priceAdjustment: number; stock: number; sales?: number;
}
```

- 边界场景：
  - 图片上传失败或部分成功：确保“临时预览图”在失败时不参与提交；提交前统一 `updateSubImagesString()`
  - 多规格库存=总库存：展示只读提示，交由 SKU 累加计算
  - 队列停止/关闭对话框：若队列有执行中任务，先 CONFIRM；停止后打断未完成项

#### API 映射

- 分类：`GET /api/mall/categories`
- 列表（admin）：`GET /api/mall/admin/products`
- 详情：`GET /api/mall/products/{id}`
- 上传：`POST /api/mall/products/upload`（multipart）
- 新增：`POST /api/mall/products`
- 编辑：`PUT /api/mall/products/{id}`
- 上架/下架：`PUT /api/mall/products/{id}/on_sale`、`/off_sale`
- 删除：`DELETE /api/mall/products/{id}`
- 规格：
  - 列表：`GET /api/mall/products/{id}/specifications`
  - 选项：`GET /api/mall/products/{id}/spec_options`
  - 批量新增（逐个）：`POST /api/mall/products/{id}/specifications`
  - 更新：`PUT /api/mall/specifications/{specId}`
  - 删除：`DELETE /api/mall/specifications/{specId}`

#### 代码生成 Prompt（可直接投喂）

```
你是高级前端工程师。请使用 React + TypeScript + Ant Design + zustand 实现“商品管理”模块：
- 页面：ProductManagementPage.tsx（搜索、表格、分页、上/下架、编辑、规格、删除）
- 组件：ProductDialog.tsx（含主图/子图上传，先 FileReader 预览，提交前统一 upload 接口回填 URL），SpecificationManager.tsx（规格选项->组合->任务队列批量保存，展示进度/暂停/恢复/停止/失败重试；同时支持现有规格的内联编辑与删除）
- API 与字段见文档，所有写操作成功后 invalidateQueries 对应列表
- 注意 TypeScript 类型、错误边界与表单校验
```

---

### B. 订单管理（对应 `OrderManagement.vue`）

#### 现有逻辑拆解

- 列表：`getOrdersByAdmin({pageNum,pageSize,username,orderNo})`
- 统计：遍历当前页数据计算 `unpaid/paid/cancelled/completed/closed/totalAmount`（注意金额以 `status in [20,40]` 累加）
- 操作：
  - 查看详情：弹出 `OrderDetailDialog`（React 需自建）
  - 完成提货：仅 `status===20` 才可，需二次弹窗输入提货码 -> `completeOrderByAdmin(orderNo, pickupCode)`
  - 关闭订单：`closeOrderByAdmin(orderNo)`

#### React 重构设计

- 页面：`features/order/pages/OrderManagementPage.tsx`

  - 统计卡片：从当前页数据计算（或改为后端汇总接口，如有）
  - 搜索：用户名、订单号；重置清空入参
  - 表格：订单号、用户、商品明细（子项列表）、总金额、状态、创建时间、操作（查看/完成提货/关闭）
  - 对话框：`OrderDetailDialog.tsx`（展示完整订单：收货/提货信息、商品项、支付、状态流转按钮）
- 状态与数据：

  - `useQuery(['order.list', params], fetchOrders)`
  - `useMutation` 完成与关闭后统一 `invalidateQueries('order.list')`
- 枚举映射（对齐 Vue）：

  - 文案：`10 待支付`、`20 已支付`、`30 已取消`、`40 已完成`、`50 已关闭`
  - 标签颜色：warning/success/info/primary/danger（Antd 使用对应颜色）

#### API 映射

- 列表：`GET /api/mall/orders/admin`
- 关闭：`POST /api/mall/orders/admin/{orderNo}/close`
- 完成：`POST /api/mall/orders/admin/{orderNo}/complete?pickupCode=xxx`

#### 代码生成 Prompt

```
使用 React + TS + AntD + React Query 编写订单管理：提供统计卡片、搜索、表格、分页；操作包含“查看详情（弹窗）”“完成提货（输入提货码）”“关闭订单”。请实现 API 调用与缓存失效，并封装 OrderDetailDialog 组件。
```

---

## 三、通知管理（对应 `Notice.vue`）

#### 现有逻辑拆解

- 列表（管理员含草稿）：`getAdminNoticeList({pageNum,pageSize})`
- 创建草稿：`createNotice({title,content,type})`
- 发布草稿：`publishNotice(id)`（创建成功后若需要立即发布再调一次）
- 更新：`updateNotice(id,{title,content,type})`
- 删除：`deleteNotice(id)`
- 标签映射：
  - 类型：1 普通、2 重要
  - 状态：0 草稿、1 已发布

#### React 重构设计

- 页面：`features/notice/pages/NoticePage.tsx`

  - 左侧：表单（标题、内容、类型）；按钮：发布通知、保存草稿、重置
  - 右侧：表格（ID/标题/内容/类型Tag/状态Tag/发布时间|创建时间/操作：编辑、发布、删除）
  - 编辑对话框：`NoticeEditModal`（可内联，也可抽成组件）
  - 分页：同一套 `usePagination`
- 数据与交互：

  - `useQuery(['notice.list', params], getAdminNoticeList)`
  - 新建后若“发布”，需用新返回的 `id` 调用 `publishNotice` 再刷新列表
  - 编辑、发布、删除成功后统一 `invalidateQueries('notice.list')`

#### API 映射

- 列表（admin）：`GET /api/reservation/notice/admin`
- 创建：`POST /api/reservation/notice`
- 更新：`PUT /api/reservation/notice/{id}`
- 发布：`POST /api/reservation/notice/{id}/publish`
- 删除：`DELETE /api/reservation/notice/{id}`

#### 代码生成 Prompt

```
实现 Notice 管理页（React + TS + AntD + React Query）：左侧新建/发布表单，右侧表格列表（支持编辑、发布、删除、分页）。类型与状态以 Tag 渲染。成功后统一刷新列表。
```

---

## 四、论坛管理（列表 + 帖子详情）

### A. 列表（对应 `ForumManagement.vue`）

#### 现有逻辑拆解

- Tab 分类：all/team/notice/help/exp
- 列表：`getForumList({page,size,keyword,category})`
- 操作：置顶/取消置顶 `setPostTopStatus(postId, isTop)`；删除 `deletePostService(postId)`；查看详情跳转 `/admin/forum/post/{id}`

#### React 重构设计

- 页面：`features/forum/pages/ForumManagementPage.tsx`

  - 顶部：搜索框（关键字）、分类 Tabs（切换时清空页码）
  - 表格：标题（置顶 Tag + 可点击查看详情）、类别、作者、创建时间、操作（置顶/取消置顶、删除）
  - 分页：同 `usePagination`
- 数据：

  - `useQuery(['forum.list', params], getForumList)`
  - 置顶/删除后刷新

#### API 映射

- 列表：`GET /api/forum/posts`
- 删除：`DELETE /api/forum/posts/{postId}`
- 置顶：`PUT /api/forum/posts/{postId}/top?isTop=true|false`

#### 代码生成 Prompt

```
实现论坛管理页：Tabs 切换类别、关键字搜索、表格展示、置顶/取消置顶、删除、分页；标题点击进入详情页。使用 React + TS + AntD + React Query。
```

### B. 帖子详情（对应 `ForumPostDetail.vue`）

#### 现有逻辑拆解

- 详情：`getForumDetail(postId)`
- 回复列表：`getForumCommentsService(postId, 'time')`
- 删除评论：`deleteCommentService(postId, replyId)`
- 置顶/取消置顶：`setPostTopStatus(postId, isTop)`

#### React 重构设计

- 页面：`features/forum/pages/ForumPostDetailPage.tsx`

  - 顶部：返回按钮 + 置顶/取消置顶
  - 主卡片：标题（置顶 Tag）、作者/发布时间/类别、内容 HTML 展示、统计（点赞/回复）
  - 回复卡片：列表（作者、时间、内容、删除）
  - 空态：暂无回复
- 数据：

  - `useQuery(['forum.detail', postId], getForumDetail)`
  - `useQuery(['forum.comments', postId], getForumCommentsService(postId,'time'))`
  - 删除评论与置顶后刷新对应 query

#### API 映射

- 详情：`GET /api/forum/posts/detail?postId=xxx`
- 评论：`GET /api/forum/posts/{postId}/replies?orderBy=time`
- 删除评论：`DELETE /api/forum/posts/{postId}/replies/{replyId}`
- 置顶：`PUT /api/forum/posts/{postId}/top?isTop=true|false`

#### 代码生成 Prompt

```
实现论坛帖子详情页：顶部操作（返回、置顶/取消置顶），主体信息展示，评论列表（删除评论），空态提示。React + TS + AntD + React Query。
```

---

## 五、用户管理（对应 `UserManagement.vue`）

#### 现有逻辑拆解

- 列表：`getUserList({page,size,keyword,role})`（返回 `list/total/pageNum/pageSize`）
- 详情：`getUserDetail(userId)` -> 弹框展示
- 重置密码：`resetUserPassword(userId)` -> 默认重置为 123456（由后端实现）
- 搜索与重置：重置会清空条件并置 `page=1`

#### React 重构设计

- 页面：`features/user/pages/UserManagementPage.tsx`

  - 顶部：搜索框 + 角色下拉 + 搜索/重置
  - 表格：ID、用户名、昵称、邮箱、手机号、角色（Tag）、性别、地区、注册时间、最后登录、操作（详情、重置密码）
  - 详情对话框：`UserDetailModal.tsx`（渲染 `Descriptions` + 头像）
- 数据：

  - `useQuery(['user.list', params], getUserList)`
  - 重置密码成功后可不刷新列表，仅提示；详情弹出时调用 `getUserDetail`

#### API 映射

- 列表：`GET /api/user/admin/users`
- 详情：`GET /api/user/admin/users/{id}`
- 重置：`PUT /api/user/admin/users/{id}/reset-password`

#### 代码生成 Prompt

```
实现用户管理页：搜索 + 角色筛选、表格、分页、用户详情弹窗、重置密码确认与调用。React + TS + AntD + React Query。
```

---

## 六、路由与权限

- 路由示例：
  - `/admin/shop/products` 商品管理
  - `/admin/shop/orders` 订单管理
  - `/admin/notice` 通知管理
  - `/admin/forum` 论坛管理列表
  - `/admin/forum/post/:id` 帖子详情
  - `/admin/users` 用户管理
- 守卫：登录态 + 角色判定（仅 `ROLE_ADMIN` 进入 `/admin/**`）。未登录或无权限重定向至 `/login`。

---

## 七、关键实现细节清单（Checklist）

- 成功态统一：后端 `code===0`，失败 `message|msg` 兜底
- 列表刷新：所有写操作 `invalidateQueries` 目标列表
- 表单校验：价格、库存、必填字段、上传图片大小/数量上限
- 批量规格：使用队列，UI 提示“正在执行/暂停/失败重试”，关闭弹窗需二次确认
- 订单完成：仅 `status===20`（已支付）才允许输入提货码完成
- 通知发布：新增草稿后若点“发布”，需要再以返回的 `id` 调 `publish` 接口
- 用户详情：字段空值展示“未设置/从未登录”，避免空白

---

## 八、可复用代码骨架（核心片段）

### 1) React Query 列表模板

```ts
const { data, isLoading } = useQuery(['key', params], () => api.list(params), { keepPreviousData: true })
const queryClient = useQueryClient()
const mutation = useMutation(api.doSomething, { onSuccess: () => queryClient.invalidateQueries(['key']) })
```

### 2) 任务队列（TS 入口）

```ts
// utils/TaskQueue.ts：将现有 JS 版本按 1:1 语义改写为 TS，类型化回调与 Task 对象
export class TaskQueue { /* 并发、重试、暂停/恢复/停止、进度回调，与仓库 JS 版一致 */ }
export const createSpecificationTaskQueue = (opts?: Partial<Config>) => new TaskQueue({ maxConcurrent:2, requestInterval:200, maxRetries:3, retryDelay:1500, timeout:15000, ...opts })
```

---

## 九、交付增量建议

- 先完成“用户管理、通知管理”两页（无复杂上传/队列），打通请求链路与权限
- 再上“订单管理”页
- 最后迁移“商品管理”（含图片上传与队列），并做端到端联调

---

## 十、按模块的生成代码提示词索引

- 商品管理：见上文“代码生成 Prompt（商品管理）”
- 订单管理：见上文“代码生成 Prompt（订单管理）”
- 通知管理：见上文“代码生成 Prompt（通知管理）”
- 论坛管理列表：见上文“代码生成 Prompt（论坛管理）”
- 帖子详情：见上文“代码生成 Prompt（帖子详情）”
- 用户管理：见上文“代码生成 Prompt（用户管理）”

以上方案与接口严格对齐你现有 Vue 代码与 `src/api/*` 定义，可直接用于 React 重构与代码生成。
