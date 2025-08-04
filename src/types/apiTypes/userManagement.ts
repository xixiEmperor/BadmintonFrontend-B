/**
 * 用户列表查询参数类型
 */
export interface GetUserListParams {
  page?: number    // 页码
  size?: number    // 每页数量
  keyword?: string // 用户名搜索关键词
  role?: string    // 角色过滤（如：ROLE_USER, ROLE_ADMIN）
}