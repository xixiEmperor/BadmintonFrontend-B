/**
 * 仪表盘 Store
 * - 缓存仪表盘 overview 数据
 */
import { create } from 'zustand'
import type { statisticsData } from '@/components/Dashboard/types/returnData'

type DashBoardState = {
  dashBoardData: statisticsData | null
  setDashBoardData: (data: statisticsData) => void
}

export const useDashBoardStore = create<DashBoardState>((set) => ({
  dashBoardData: null,
  setDashBoardData: (data) => set({ dashBoardData: data })
}))

export default useDashBoardStore