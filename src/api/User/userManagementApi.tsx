import request from "@/utils/request"
import type { GetUserListParams } from "@/types/apiTypes/userManagement"

/**
 * 分页查询用户列表
 * @param {Object} params - 查询参数
 * @param {string} [params.keyword] - 用户名搜索关键词（可选）
 * @param {string} [params.role] - 角色过滤（可选，如：ROLE_USER, ROLE_ADMIN）
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @returns {Promise<Object>} 分页用户列表
 */
export const getUserList = (params: GetUserListParams = { page: 1, size: 10 }) => {
  return request.get('/api/user/admin/users', { params })
}

/**
 * 重置用户密码
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 重置结果
 */
export const resetUserPassword = (userId: number) => {
  return request.put(`/api/user/admin/users/${userId}/reset-password`)
}

/**
 * 获取用户详细信息
 * @param {number} userId - 用户ID
 * @returns {Promise<Object>} 用户详细信息
 */
export const getUserDetail = (userId: number) => {
  return request.get(`/api/user/admin/users/${userId}`)
}
