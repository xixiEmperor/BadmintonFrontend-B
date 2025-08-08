import { create } from 'zustand'
import type { statisticsData } from '@/components/dashBoard/types/returnData'

type DashBoardState = {
  dashBoardData: statisticsData | null
  setDashBoardData: (data: statisticsData) => void
}

export const useDashBoardStore = create<DashBoardState>((set) => ({
  dashBoardData: null,
  setDashBoardData: (data) => set({ dashBoardData: data })
}))

export default useDashBoardStore