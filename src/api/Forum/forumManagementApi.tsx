import request from "@/utils/request";
import { PaginationParams } from "@/types/apiTypes/common";
import { SetPostTopStatusData } from "@/types/apiTypes/forumManagement";

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