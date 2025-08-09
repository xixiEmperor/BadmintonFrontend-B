import request from "@/utils/request";
import type { GetForumCommentsParams } from "@/types/apiTypes/forumDetail";

// 获取论坛帖子详情
export const getForumDetail = (postId: number) => {
  return request.get('/api/forum/posts/detail', { params: { postId } })
}

// 获取帖子回复
// orderBy: 排序方式，可选值(暂未开发)
export const getForumCommentsService = (postId: number, params: GetForumCommentsParams) => {
  return request.get(`/api/forum/posts/${postId}/replies`, { params })
}

// 删除评论/回复
export const deleteCommentService = (postId: number, replyId: number) => {
  return request.delete(`/api/forum/posts/${postId}/replies/${replyId}`)
}