import request from "@/utils/request";
import type { PaginationParams } from "@/types/apiTypes/common";
import type { SetPostTopStatusData } from "@/types/apiTypes/forumManagement";

/**
 * 删除帖子
 * 
 * 执行流程：
 * 1. 发送DELETE请求到指定帖子的删除端点
 * 2. 后端验证管理员权限和帖子存在性
 * 3. 执行软删除或硬删除操作
 * 4. 返回删除结果状态
 * 
 * @param {number} postId - 要删除的帖子ID
 * @returns {Promise<Object>} 删除操作结果
 */
export const deletePostService = (postId: number) => {
  // 使用RESTful风格的DELETE请求，将帖子ID作为路径参数
  // 后端会根据ID查找并删除对应的帖子记录
  return request.delete(`/api/forum/posts/${postId}`)
}

/**
 * 获取用户发帖列表
 * 
 * 数据获取流程：
 * 1. 发送GET请求获取当前用户的帖子列表
 * 2. 后端根据用户身份过滤帖子数据
 * 3. 支持分页查询，避免一次性加载大量数据
 * 
 * @param {Object} params - 分页查询参数
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @returns {Promise<Object>} 分页的用户帖子列表
 */
export const getUserPosts = (params: PaginationParams) => {
  // 发送带分页参数的GET请求
  // 后端会根据当前用户的身份返回该用户创建的帖子列表
  return request.get('/api/forum/posts/user', { params })
}

/**
 * 设置帖子置顶状态
 * 
 * 操作流程：
 * 1. 发送PUT请求更新指定帖子的置顶状态
 * 2. 后端验证管理员权限
 * 3. 更新帖子的isTop字段和相关排序权重
 * 4. 返回更新结果
 * 
 * @param {number} postId - 帖子ID
 * @param {Object} data - 置顶状态数据
 * @param {boolean} data.isTop - 是否置顶
 * @returns {Promise<Object>} 更新操作结果
 */
export const setPostTopStatus = (postId: number, data: SetPostTopStatusData) => {
  // 使用PUT请求更新资源状态，符合RESTful规范
  // 路径包含帖子ID和操作类型，便于后端路由处理
  return request.put(`/api/forum/posts/${postId}/top`, data)
}

/**
 * 管理员：获取帖子列表（含分类、关键字）
 * 
 * 查询逻辑：
 * 1. 提取并设置查询参数的默认值
 * 2. 发送GET请求到帖子列表端点
 * 3. 后端执行分页查询和条件过滤
 * 4. 返回符合条件的帖子列表及分页信息
 * 
 * @param {Object} params - 查询参数对象
 * @param {number} [params.page=1] - 页码
 * @param {number} [params.size=10] - 每页数量
 * @param {string} [params.keyword] - 搜索关键词（标题或内容）
 * @param {string} [params.category] - 帖子分类过滤
 * @returns {Promise<Object>} 分页的帖子列表，包含总数和当前页数据
 */
export const getForumList = (params: { page?: number; size?: number; keyword?: string; category?: string }) => {
  // 解构参数并设置默认值，确保必要参数的存在
  const { page = 1, size = 10, keyword, category } = params || {}
  
  // 构建最终的查询参数对象，只包含有值的字段
  // 这样可以避免向后端发送undefined值，保持URL的清洁
  return request.get('/api/forum/posts', { 
    params: { 
      page,     // 页码（必需）
      size,     // 每页大小（必需）
      keyword,  // 搜索关键词（可选）
      category  // 分类过滤（可选）
    } 
  })
}