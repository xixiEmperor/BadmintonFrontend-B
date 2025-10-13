// 预约订单状态常量与工具函数（仅此处集中维护，供全局复用）

// 订单状态码：1-待支付，2-已支付，3-已完成，4-已取消，5-已关闭(退款完成)，6-退款中
export const RESERVATION_STATUS = {
  PENDING: 1,
  PAID: 2,
  COMPLETED: 3,
  CANCELED: 4,
  CLOSED: 5,
  REFUNDING: 6,
} as const

export type ReservationStatusCode = typeof RESERVATION_STATUS[keyof typeof RESERVATION_STATUS]

// 状态码 → 文案
export const RESERVATION_STATUS_LABEL: Record<ReservationStatusCode, string> = {
  [RESERVATION_STATUS.PENDING]: '待支付',
  [RESERVATION_STATUS.PAID]: '已支付',
  [RESERVATION_STATUS.COMPLETED]: '已完成',
  [RESERVATION_STATUS.CANCELED]: '已取消',
  [RESERVATION_STATUS.CLOSED]: '已关闭', // 退款完成
  [RESERVATION_STATUS.REFUNDING]: '退款中',
}

// 筛选项只包含这五类：已支付、已完成、已取消、退款中、已关闭(已退款)
export const RESERVATION_FILTER_OPTIONS = [
  { label: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.PAID], value: RESERVATION_STATUS.PAID },
  { label: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.COMPLETED], value: RESERVATION_STATUS.COMPLETED },
  { label: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CANCELED], value: RESERVATION_STATUS.CANCELED },
  { label: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.REFUNDING], value: RESERVATION_STATUS.REFUNDING },
  { label: RESERVATION_STATUS_LABEL[RESERVATION_STATUS.CLOSED], value: RESERVATION_STATUS.CLOSED },
]

// 常用判断函数，便于 UI 渲染
export const isPaid = (code?: number) => code === RESERVATION_STATUS.PAID
export const isRefunding = (code?: number) => code === RESERVATION_STATUS.REFUNDING
export const isFinishedOrClosed = (code?: number) => code === RESERVATION_STATUS.CANCELED || code === RESERVATION_STATUS.CLOSED

export const getStatusLabel = (code?: number, fallback = '') => {
  if (!code) return fallback
  return RESERVATION_STATUS_LABEL[code as ReservationStatusCode] ?? fallback
}


