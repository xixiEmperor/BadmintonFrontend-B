/**
 * 场地状态 Store
 * - 管理场地列表、增删改、状态更新（含本地回滚）
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
    console.log(res)
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
    const prev = get().venueList.find((v) => v.id === id)?.status
    set((state) => ({
      venueList: state.venueList.map((v) => (v.id === id ? { ...v, status } : v)),
    }))
    try {
      await updateVenueStatusApi(id, status)
    } catch (error) {
      // 回滚
      const rollbackStatus: 0 | 1 = prev === 1 ? 1 : 0
      set((state) => ({
        venueList: state.venueList.map((v) => (v.id === id ? { ...v, status: rollbackStatus } : v)),
      }))
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