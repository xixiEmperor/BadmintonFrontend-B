import { PaginationParams } from '@/types/apiTypes/common'

export interface GetOrdersParams extends PaginationParams {
  username?: string
  orderNo?: number
}

