/**
 * 管理员查询订单参数类型
 */
export interface GetAdminOrdersParams {
  page?: number        // 页码，默认1
  size?: number        // 每页大小，默认10
  status?: number      // 订单状态
  userId?: number      // 用户ID
  venueId?: number     // 场地ID
  startDate?: string   // 开始日期，格式：yyyy-MM-dd
  endDate?: string     // 结束日期，格式：yyyy-MM-dd
}

/**
 * 审批退款参数类型
 */
export interface ApproveRefundData {
  approved: boolean     // 是否批准退款
  adminRemark?: string  // 管理员备注
}

/**
 * 取消订单参数类型
 */
export interface CancelReservationData {
  reason?: string       // 取消原因
}
