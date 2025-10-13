import request from "@/utils/request"
import type { GetUserListParams } from "@/types/apiTypes/userManagement"

/**
 * 分页查询用户列表
 * 
 * 查询处理流程：
 * 1. 接收查询参数，设置默认分页值
 * 2. 发送GET请求到管理员用户管理端点
 * 3. 后端执行权限验证（确保是管理员）
 * 4. 根据关键词和角色条件过滤用户数据
 * 5. 返回分页结果和用户基本信息列表
 * 
 * @param {Object} params - 查询参数
 * @param {string} [params.keyword] - 用户名搜索关键词（模糊匹配用户名、邮箱等）
 * @param {string} [params.role] - 角色过滤（如：ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR）
 * @param {number} [params.page=1] - 页码（从1开始）
 * @param {number} [params.size=10] - 每页数量（建议10-50之间）
 * @returns {Promise<Object>} 分页用户列表，包含：
 *   - content: User[] - 用户列表
 *   - totalElements: number - 总用户数
 *   - totalPages: number - 总页数
 *   - currentPage: number - 当前页码
 */
export const getUserList = (params: GetUserListParams = { page: 1, size: 10 }) => {
  // 发送到管理员专用的用户管理端点
  // 后端会验证当前用户是否具有管理员权限
  // params对象会被转换为URL查询字符串
  return request.get('/api/user/admin/users', { params })
}

/**
 * 重置用户密码
 * 
 * 重置操作流程：
 * 1. 发送PUT请求到指定用户的密码重置端点
 * 2. 后端验证管理员权限和目标用户存在性
 * 3. 生成新的临时密码或重置为默认密码
 * 4. 更新数据库中的密码哈希值
 * 5. 可选：发送密码重置通知邮件给用户
 * 6. 返回操作结果和新密码信息
 * 
 * @param {number} userId - 要重置密码的用户ID
 * @returns {Promise<Object>} 重置结果，可能包含：
 *   - success: boolean - 操作是否成功
 *   - newPassword?: string - 新密码（如果返回）
 *   - message: string - 操作结果消息
 */
export const resetUserPassword = (userId: number) => {
  // 使用PUT请求更新用户密码，符合RESTful语义
  // 路径参数包含用户ID，便于后端定位目标用户
  // 密码重置是敏感操作，通常需要管理员权限
  return request.put(`/api/user/admin/users/${userId}/reset-password`)
}

/**
 * 获取用户详细信息
 * 
 * 信息获取流程：
 * 1. 发送GET请求到指定用户的详情端点
 * 2. 后端验证访问权限（管理员或用户本人）
 * 3. 查询用户的完整信息，包括敏感数据
 * 4. 根据请求者权限过滤返回字段
 * 5. 返回用户详细信息对象
 * 
 * @param {number} userId - 要查询的用户ID
 * @returns {Promise<Object>} 用户详细信息，包含：
 *   - 基本信息：id, username, email, phone等
 *   - 状态信息：status, isActive, lastLogin等
 *   - 权限信息：roles, permissions等
 *   - 统计信息：注册时间、登录次数等
 *   - 注意：敏感信息（如密码哈希）不会返回
 */
export const getUserDetail = (userId: number) => {
  // 使用RESTful风格的GET请求获取单个用户资源
  // 用户ID作为路径参数，确保请求的明确性
  // 后端会根据请求者身份决定返回信息的详细程度
  return request.get(`/api/user/admin/users/${userId}`)
}
