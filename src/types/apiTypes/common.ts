/**
 * 接口响应类型
 * @template T 响应数据类型
 */
export interface ApiResponse<T> {
  code: number
  message?: string
  data: T
}

/**
 * 分页查询参数类型
 */
export interface PaginationParams {
  pageNum: number
  pageSize: number
}

