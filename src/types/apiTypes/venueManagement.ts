export interface addVenueData {
  name: string
  location: string
  description: string
  pricePerHour: number
  type: number
  status: number
}

export interface updateVenueData {
  name: string
  location: string
  description?: string
  pricePerHour: number
  type: number
  status: number
}

export interface createSpecialDateConfigData {
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

export interface updateSpecialDateConfigData {
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

