/**
 * 商品 Store
 * - 管理列表/分页参数/分类缓存
 *
 * 兼容性说明：
 * - 列表接口可能返回 { data: { list, total } } 或直接返回数组
 * - 分类接口 normalize：优先取 data.list，否则取 data
 */
import { create } from 'zustand'
import type { Category, GetProductsParams, ProductData } from '@/types/apiTypes/products'
import { getCategories, getProductsByAdmin } from '@/api/Shop/productsApi'

type ProductStoreState = {
  list: ProductData[]
  total: number
  params: GetProductsParams
  categories: Category[]
  setParams: (patch: Partial<GetProductsParams>) => void
  setList: (list: ProductData[], total?: number) => void
  fetchList: (overrideParams?: Partial<GetProductsParams>) => Promise<void>
  fetchCategories: () => Promise<void>
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  list: [],
  total: 0,
  params: { pageNum: 1, pageSize: 10 },
  categories: [],
  setParams: (patch) => set((state) => ({ params: { ...state.params, ...patch } })),
  setList: (list, total) => set((state) => ({ list, total: typeof total === 'number' ? total : state.total })),
  fetchList: async (overrideParams) => {
    const params = { ...get().params, ...(overrideParams || {}) }
    const res = await getProductsByAdmin(params)
    const data = (res as unknown as { data?: { list?: ProductData[]; total?: number } })?.data ?? (res as { list?: ProductData[]; total?: number })
    const list = (data?.list ?? data) as ProductData[]
    const total = data?.total ?? list.length
    set({ list, total, params })
  },
  fetchCategories: async () => {
    type ApiResp<T> = { data?: T } | T
    function unwrap<T>(resp: ApiResp<T>): T {
      if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
        return (resp as { data?: T }).data as T
      }
      return resp as T
    }
    const res = await getCategories()
    const data = unwrap<Category[] | { list?: Category[] }>(res as ApiResp<Category[] | { list?: Category[] }>)
    const list = Array.isArray((data as any)?.list) ? (data as any).list : (Array.isArray(data) ? (data as Category[]) : [])
    set({ categories: list })
  },
}))

export default useProductStore


