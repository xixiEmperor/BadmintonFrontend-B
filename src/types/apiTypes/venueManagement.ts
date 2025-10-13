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

// 与后端 VenueVo 对齐的前端类型
export interface VenueVo {
  id: number
  name: string
  description?: string
  location: string
  pricePerHour: number
  type: number
  typeDesc?: string
  status: number // 0-未启用, 1-启用, 2-维护中
  statusDesc?: string
  createTime?: string
  updateTime?: string
}

