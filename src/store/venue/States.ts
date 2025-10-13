/**
 * 场地状态 Store
 * - 管理场地列表、增删改、状态更新（含本地回滚）
 *
 * 关键点：
 * - updateVenueStatus 采用“先乐观更新，失败回滚”的策略，提升界面响应速度
 * - fetch 系列函数兼容后端可能返回 { data: ... } 或直接返回数据的两种形式
 */
import { create } from 'zustand'
import {
  getVenueList as getVenueListApi,
  getVenueListByStatus as getVenueListByStatusApi,
  addVenue as addVenueApi,
  updateVenue as updateVenueApi,
  updateVenueStatus as updateVenueStatusApi,
  deleteVenue as deleteVenueApi,
} from '@/api/Venue/venueManagementApi'
import type { VenueCardProps as Venue } from '@/components/shared/Card'
import type { addVenueData, updateVenueData } from '@/types/apiTypes/venueManagement'

type VenueStoreState = {
  venueList: Venue[]
  setVenueList: (list: Venue[]) => void
  fetchVenueList: () => Promise<void>
  fetchVenueListByStatus: (status: number) => Promise<void>
  addVenue: (payload: addVenueData) => Promise<void>
  updateVenue: (id: number, payload: updateVenueData) => Promise<void>
  updateVenueStatus: (id: number, status: 0 | 1) => Promise<void>
  deleteVenue: (id: number) => Promise<void>
  getVenueByIdFromCache: (id: number) => Venue | undefined
}

export const useVenueStore = create<VenueStoreState>((set, get) => ({
  venueList: [],
  setVenueList: (list) => set({ venueList: list }),
  fetchVenueList: async () => {
    const res = await getVenueListApi()
    const list = (res?.data ?? res) as unknown as Venue[]
    set({ venueList: list })
  },
  fetchVenueListByStatus: async (status: number) => {
    const res = await getVenueListByStatusApi(status)
    const list = (res?.data ?? res) as unknown as Venue[]
    set({ venueList: list })
  },
  addVenue: async (payload: addVenueData) => {
    await addVenueApi(payload)
    await get().fetchVenueList()
  },
  updateVenue: async (id: number, payload: updateVenueData) => {
    await updateVenueApi(id, payload)
    await get().fetchVenueList()
  },
  updateVenueStatus: async (id: number, status: 0 | 1) => {
    // 1. 先保存当前状态，用于失败时的回滚操作
    // 从当前store中的venueList找到对应ID的场地，获取其当前状态
    const prev = get().venueList.find((v) => v.id === id)?.status
    
    // 2. 乐观更新：立即更新UI状态，不等待API响应
    // 这样用户可以立即看到状态变化，提升用户体验
    set((state) => ({
      venueList: state.venueList.map((v) => 
        // 如果是目标场地，则更新其状态；否则保持不变
        v.id === id ? { ...v, status } : v
      ),
    }))
    
    try {
      // 3. 调用后端API更新场地状态
      // 如果API调用成功，UI状态已经是正确的，不需要额外操作
      await updateVenueStatusApi(id, status)
    } catch (error) {
      // 4. API调用失败时的回滚逻辑
      // 将状态恢复到之前的值，撤销乐观更新
      const rollbackStatus: 0 | 1 = prev === 1 ? 1 : 0  // 确保回滚状态的类型安全
      set((state) => ({
        venueList: state.venueList.map((v) => 
          // 找到目标场地，恢复其原始状态
          v.id === id ? { ...v, status: rollbackStatus } : v
        ),
      }))
      // 5. 重新抛出错误，让调用方知道操作失败
      // 调用方可以据此显示错误提示或执行其他错误处理逻辑
      throw error
    }
  },
  deleteVenue: async (id: number) => {
    await deleteVenueApi(id)
    set((state) => ({ venueList: state.venueList.filter((v) => v.id !== id) }))
  },
  getVenueByIdFromCache: (id: number) => get().venueList.find((v) => v.id === id),
}))

export default useVenueStore