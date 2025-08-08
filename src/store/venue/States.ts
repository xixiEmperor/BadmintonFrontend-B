import { create } from 'zustand'
import { getVenueList as getVenueListApi } from '@/api/Venue/venueManagementApi'
import type { VenueCardProps as Venue } from '@/components/shared/Card'

type VenueStoreState = {
  venueList: Venue[]
  setVenueList: (list: Venue[]) => void
  fetchVenueList: () => Promise<void>
}

export const useVenueStore = create<VenueStoreState>((set) => ({
  venueList: [],
  setVenueList: (list) => set({ venueList: list }),
  fetchVenueList: async () => {
    const res = await getVenueListApi()
    console.log(res)
    const list = (res?.data ?? res) as unknown as Venue[]
    set({ venueList: list })
  },
}))

export default useVenueStore