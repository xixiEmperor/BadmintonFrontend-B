import request from '@/utils/request'
import { ApiResponse, PaginationParams } from '@/types/apiTypes/common'
import { Notice } from '@/types/apiTypes/notice'

interface NoticeApi {
  
}


/**
 * 管理员获取所有通知列表（包含草稿）
 * @param {Object} params - 查询参数
 * @param {number} [params.pageNum=1] - 页码
 * @param {number} [params.pageSize=10] - 每页数量
 * @returns {Promise<Object>} 通知列表
 */
export function getAdminNoticeList(params: PaginationParams = { pageNum: 1, pageSize: 10 }): Promise<ApiResponse<Notice>> {
  return request({
    url: '/api/reservation/notice/admin',
    method: 'get',
    params: {
      pageNum: params.pageNum,
      pageSize: params.pageSize,
    },
  })
}

/**
 * 创建通知（草稿）
 * @param {Object} data - 通知数据
 * @param {string} data.title - 通知标题
 * @param {string} data.content - 通知内容
 * @param {number} data.type - 通知类型：1-普通通知，2-重要通知
 * @returns {Promise<Object>} 创建结果
 */
export function createNotice(data) {
  return request({
    url: '/api/reservation/notice',
    method: 'post',
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
    },
  })
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
export function updateNotice(id, data) {
  return request({
    url: `/api/reservation/notice/${id}`,
    method: 'put',
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
    },
  })
}

/**
 * 发布通知
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 发布结果
 */
export function publishNotice(id) {
  return request({
    url: `/api/reservation/notice/${id}/publish`,
    method: 'post',
  })
}

/**
 * 删除通知
 * @param {number} id - 通知ID
 * @returns {Promise<Object>} 删除结果
 */
export function deleteNotice(id) {
  return request({
    url: `/api/reservation/notice/${id}`,
    method: 'delete',
  })
}