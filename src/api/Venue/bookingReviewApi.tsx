import request from "@/utils/request";
import type { GetAdminOrdersParams, ApproveRefundData, CancelReservationData } from "@/types/apiTypes/bookingReview";

/**
 * 管理员查询所有订单
 * @param {Object} params - 查询参数
 * @param {number} [params.page] - 页码，默认1
 * @param {number} [params.size] - 每页大小，默认10
 * @param {number} [params.status] - 订单状态
 * @param {number} [params.userId] - 用户ID
 * @param {number} [params.venueId] - 场地ID
 * @param {string} [params.startDate] - 开始日期，格式：yyyy-MM-dd
 * @param {string} [params.endDate] - 结束日期，格式：yyyy-MM-dd
 * @returns {Promise}
 */
export const getAdminOrders = (params: GetAdminOrdersParams = {}) => {
  return request.get('/api/reservations/admin/orders', { params })
}

/**
 * 管理员完成订单
 * @param {number} id - 订单ID
 * @returns {Promise}
 */
export const completeOrder = (id: number) => {
  return request.post(`/api/reservations/admin/${id}/complete`)
}

/**
 * 管理员审批退款
 * @param {number} id - 订单ID
 * @param {Object} data - 审批信息
 * @param {boolean} data.approved - 是否批准退款
 * @param {string} [data.adminRemark] - 管理员备注
 * @returns {Promise}
 */
// 审批退款
// 注意：后端使用 @RequestParam，必须以查询参数传递 approved/adminRemark
// 路径: POST /api/reservations/admin/{id}/approve-refund?approved=true&adminRemark=xxx
export const approveRefund = (id: number, data: ApproveRefundData) => {
  const params = new URLSearchParams()
  // 必填：approved
  params.set('approved', String(data.approved))
  // 可选：管理员备注
  if (data.adminRemark) params.set('adminRemark', data.adminRemark)
  return request.post(`/api/reservations/admin/${id}/approve-refund?${params.toString()}`)
}

/**
 * 取消订单
 * @param {number} id - 订单ID
 * @param {Object} data - 取消信息
 * @param {string} [data.reason] - 取消原因
 * @returns {Promise}
 */
export const cancelReservation = (id: number, data: CancelReservationData = {}) => {
  return request.post(`/api/reservations/${id}/cancel`, data)
}