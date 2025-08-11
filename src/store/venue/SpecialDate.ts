/**
 * 特殊日期配置 Store
 * - 列表/详情/增删改
 *
 * 兼容性说明：
 * - 后端有时返回 { data: { list, total } }，有时直接返回数组，因此使用 unwrap/类型守卫做兼容
 * - 翻页：每次 create/update 之后，按当前 pagination 重新刷新列表，确保视图与服务端一致
 */
import { create } from 'zustand'
import {
  getSpecialDateConfigList,
  getSpecialDateConfigById,
  createSpecialDateConfig,
  updateSpecialDateConfig,
  deleteSpecialDateConfig,
} from '@/api/Venue/venueManagementApi'

export interface SpecialDateItem {
  id: number
  configName: string
  specialDate: string
  configType: number
  affectedVenueIds?: string
  startTime?: string
  endTime?: string
  venueStatus: number
  bookable: number
  description?: string
  enabled?: number
}

type Pagination = { pageNum: number; pageSize: number; total: number }

type StoreState = {
  list: SpecialDateItem[]
  pagination: Pagination
  fetchList: (pageNum?: number, pageSize?: number) => Promise<void>
  fetchDetail: (id: number) => Promise<SpecialDateItem | undefined>
  createItem: (payload: Omit<SpecialDateItem, 'id'>) => Promise<void>
  updateItem: (id: number, payload: Omit<SpecialDateItem, 'id'>) => Promise<void>
  deleteItem: (id: number) => Promise<void>
}

export const useSpecialDateStore = create<StoreState>((set, get) => ({
  list: [],
  pagination: { pageNum: 1, pageSize: 10, total: 0 },
  async fetchList(pageNum = 1, pageSize = 10) {
    const res = await getSpecialDateConfigList({ pageNum, pageSize })
    // 兼容后端返回结构 { code, data: { list, total, pageNum, pageSize } } 或 { code, data: [] }
    const data = (res as unknown as { data?: { list?: SpecialDateItem[]; total?: number } | SpecialDateItem[] })?.data ?? (res as { list?: SpecialDateItem[]; total?: number } | SpecialDateItem[])
    const list = Array.isArray((data as any)?.list) ? (data as any).list : Array.isArray(data) ? (data as SpecialDateItem[]) : []
    const total = (data as any)?.total ?? list.length
    set({ list, pagination: { pageNum, pageSize, total } })
  },
  async fetchDetail(id) {
    type ApiResp<T> = { data?: T } | T
    function unwrap<T>(resp: ApiResp<T>): T {
      if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
        return (resp as { data?: T }).data as T
      }
      return resp as T
    }
    const res = await getSpecialDateConfigById(id)
    return unwrap<SpecialDateItem>(res as ApiResp<SpecialDateItem>)
  },
  async createItem(payload) {
    await createSpecialDateConfig(payload as Omit<SpecialDateItem, 'id'>)
    const { pageNum, pageSize } = get().pagination
    await get().fetchList(pageNum, pageSize)
  },
  async updateItem(id, payload) {
    await updateSpecialDateConfig(id, payload as Omit<SpecialDateItem, 'id'>)
    const { pageNum, pageSize } = get().pagination
    await get().fetchList(pageNum, pageSize)
  },
  async deleteItem(id) {
    await deleteSpecialDateConfig(id)
    set((state) => ({ list: state.list.filter((i) => i.id !== id) }))
  },
}))

export default useSpecialDateStore


