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
export function getAdminOrders(params = {}) {
  return request({
    url: '/api/reservations/admin/orders',
    method: 'get',
    params
  })
}

/**
 * 管理员完成订单
 * @param {number} id - 订单ID
 * @returns {Promise}
 */
export function completeOrder(id) {
  return request({
    url: `/api/reservations/admin/${id}/complete`,
    method: 'post'
  })
}

/**
 * 管理员审批退款
 * @param {number} id - 订单ID
 * @param {Object} data - 审批信息
 * @param {boolean} data.approved - 是否批准退款
 * @param {string} [data.adminRemark] - 管理员备注
 * @returns {Promise}
 */
export function approveRefund(id, params) {
  return request({
    url: `/api/reservations/admin/${id}/approve-refund`,
    method: 'post',
    params
  })
}

/**
 * 取消订单
 * @param {number} id - 订单ID
 * @param {Object} data - 取消信息
 * @param {string} [data.reason] - 取消原因
 * @returns {Promise}
 */
export function cancelReservation(id, data = {}) {
  return request({
    url: `/api/reservations/${id}/cancel`,
    method: 'post',
    data
  })
}