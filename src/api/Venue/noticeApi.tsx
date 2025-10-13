import request from "@/utils/request"
import type { PaginationParams } from '@/types/apiTypes/common'
import type { createNoticeData } from "@/types/apiTypes/notice"


/**
 * 管理员获取所有通知列表（包含草稿）
 * @param {Object} params - 查询参数
 * @param {number} [params.pageNum=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @returns {Promise<Object>} 通知列表
 */
export const getAdminNoticeList = (params: PaginationParams = { pageNum: 1, pageSize: 10 }) => {
  return request.get('/api/reservation/notice/admin', { params })
}


/**
 * 创建通知（草稿）
 * @param {Object} data - 通知数据
 * @param {string} data.title - 通知标题
 * @param {string} data.content - 通知内容
 * @param {number} data.type - 通知类型：1-普通通知，2-重要通知
 * @returns {Promise<Object>} 创建结果
 */
export const createNotice = (data: createNoticeData) => {
  return request.post('/api/reservation/notice', data)
}

/**
 * 更新通知内容
 * @param {number} id - 通知ID
 * @param {Object} data - 通知数据
 * @param {string} data.title - 通知标题
 * @param {string} data.content - 通知内容
 * @param {number} data.type - 通知类型：1-普通通知，2-重要通知
 * @returns {Promise<Object>} 更新结果
 */
export const updateNotice = (id: number, data: createNoticeData) => {
  return request.put(`/api/reservation/notice/${id}`, data)
}

/**
 * 发布通知
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 发布结果
 */
export const publishNotice = (id: number) => {
  return request.post(`/api/reservation/notice/${id}/publish`)
}

/**
 * 删除通知
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteNotice = (id: number) => {
  return request.delete(`/api/reservation/notice/${id}`)
}