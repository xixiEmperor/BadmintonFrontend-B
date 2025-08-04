import {PaginationParams} from '@/types/apiTypes/common'

// 获取商品列表的查询参数
export interface GetProductsParams extends PaginationParams {
  categoryId?: string
  keyword?: string
  orderBy?: 'price_asc' | 'price_desc' | 'sales_desc'
}

// 商品数据接口
export interface ProductData {
  id?: number
  name: string
  description?: string
  subtitle?: string
  price: number
  categoryId: number
  mainImage?: string
  subImages?: string[]
  detail?: string
  status: number // 1-上架，0-下架
  stock: number
  sales?: number
  createTime?: string
  updateTime?: string
}

// 添加商品的请求数据
export interface AddProductData {
  name: string
  description?: string
  subtitle?: string
  price: number
  categoryId: number
  mainImage?: string
  subImages?: string[]
  detail?: string
  status?: number
  stock: number
}

// 更新商品的请求数据
export interface UpdateProductData {
  name?: string
  description?: string
  subtitle?: string
  price?: number
  categoryId?: number
  mainImage?: string
  subImages?: string[]
  detail?: string
  status?: number
  stock?: number
}

// 更新库存的请求数据
export interface UpdateStockData {
  stock: number
}

// 商品规格数据接口
export interface ProductSpecification {
  id?: number
  productId: number
  specifications: Record<string, string> // 如 {"color": "红色", "size": "S"}
  priceAdjustment: number
  stock: number
  status: number // 1-正常，0-禁用
  createTime?: string
  updateTime?: string
}

// 添加商品规格的请求数据
export interface AddSpecificationData {
  specifications: Record<string, string>
  priceAdjustment: number
  stock: number
  status?: number
}

// 更新商品规格的请求数据
export interface UpdateSpecificationData {
  specifications?: Record<string, string>
  priceAdjustment?: number
  stock?: number
  status?: number
}

// 商品规格选项接口
export interface ProductSpecOption {
  specName: string
  specValues: string[]
}

// 上传选项接口
export interface UploadOptions {
  signal?: AbortSignal
}
