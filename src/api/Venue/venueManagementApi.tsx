import request from "@/utils/request";
import type { addVenueData, updateVenueData, createSpecialDateConfigData, updateSpecialDateConfigData } from "@/types/apiTypes/venueManagement";

/**
 * 获取所有场地列表
 */
export const getVenueList = () => {
  return request.get('/api/venue/list')
}

/**
 * 新增场地（需要管理员权限）
 */
export const addVenue = (data: addVenueData) => {
  return request.post('/api/venue/add', data)
}

/**
 * 更新场地信息（需要管理员权限）
 */
export const updateVenue = (id: number, data: updateVenueData) => {
  return request.put(`/api/venue/update/${id}`, data)
}

/**
 * 更新场地状态（需要管理员权限）
 * - 后端按文档使用 Query 接收 status，这里通过 URL 传参确保兼容
 */
export const updateVenueStatus = (id: number, status: number) => {
  // 后端按文档使用 Query 接收 status，这里通过 URL 传参确保兼容
  return request.put(`/api/venue/status/${id}?status=${status}`)
}

/**
 * 删除场地（需要管理员权限）
 */
export const deleteVenue = (id: number) => {
  return request.delete(`/api/venue/delete/${id}`)
}

/**
 * 根据ID获取场地详情
 */
export const getVenueById = (id: number) => {
  return request.get(`/api/venue/${id}`)
}

/**
 * 根据状态获取场地列表
 */
export const getVenueListByStatus = (status: number) => {
  return request.get(`/api/venue/list/status/${status}`)
}

/**
 * 创建特殊日期配置
 */
export const createSpecialDateConfig = (data: createSpecialDateConfigData) => {
  return request.post('/api/venue/special-config', data)
}

/**
 * 获取特殊日期配置列表
 */
export const getSpecialDateConfigList = (params: { pageNum?: number, pageSize?: number }) => {
  return request.get('/api/venue/special-config/list', { params })
}

/**
 * 获取特殊日期配置详情
 */
export const getSpecialDateConfigById = (id: number) => {
  return request.get(`/api/venue/special-config/${id}`)
}

/**
 * 更新特殊日期配置
 */
export const updateSpecialDateConfig = (id: number, data: updateSpecialDateConfigData) => {
  return request.put(`/api/venue/special-config/${id}`, data)
}

/**
 * 删除特殊日期配置
 */
export const deleteSpecialDateConfig = (id: number) => {
  return request.delete(`/api/venue/special-config/${id}`)
}

/**
 * 启用/禁用特殊日期配置
 */
export const toggleSpecialDateConfig = (id: number, enabled: number) => {
  return request.put(`/api/venue/special-config/${id}/toggle`, { enabled })
}