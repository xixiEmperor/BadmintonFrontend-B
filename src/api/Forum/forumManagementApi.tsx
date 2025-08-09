import request from "@/utils/request";
import type { PaginationParams } from "@/types/apiTypes/common";
import type { SetPostTopStatusData } from "@/types/apiTypes/forumManagement";

// 删除帖子
export const deletePostService = (postId: number) => {
  return request.delete(`/api/forum/posts/${postId}`)
}

// 获取用户发帖列表
export const getUserPosts = (params: PaginationParams) => {
  return request.get('/api/forum/posts/user', { params })
}

// 设置帖子置顶状态
export const setPostTopStatus = (postId: number, data: SetPostTopStatusData) => {
  return request.put(`/api/forum/posts/${postId}/top`, data)
}

// 管理员：获取帖子列表（含分类、关键字）
export const getForumList = (params: { page?: number; size?: number; keyword?: string; category?: string }) => {
  const { page = 1, size = 10, keyword, category } = params || {}
  return request.get('/api/forum/posts', { params: { page, size, keyword, category } })
}