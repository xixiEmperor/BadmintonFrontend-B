import request from "@/utils/request";
import type { addVenueData, updateVenueData, createSpecialDateConfigData, updateSpecialDateConfigData } from "@/types/apiTypes/venueManagement";

/**
 * 获取所有场地列表
 * @returns {Promise}
 */
export const getVenueList = () => {
  return request.get('/api/venue/list')
}

/**
 * 新增场地（需要管理员权限）
 * @param {Object} data - 场地信息
 * @param {string} data.name - 场地名称
 * @param {string} data.location - 场地位置
 * @param {string} [data.description] - 场地描述
 * @param {number} data.pricePerHour - 场地价格
 * @param {number} data.type - 场地类型
 * @param {number} data.status - 场地状态（0-停用，1-启用，2-维护中）
 * @returns {Promise}
 */
export const addVenue = (data: addVenueData) => {
  return request.post('/api/venue/add', data)
}

/**
 * 更新场地信息（需要管理员权限）
 * @param {number} id - 场地ID
 * @param {Object} data - 更新的场地信息
 * @param {string} data.name - 场地名称
 * @param {string} data.location - 场地位置
 * @param {string} [data.description] - 场地描述
 * @param {number} data.pricePerHour - 场地价格
 * @param {number} data.type - 场地类型
 * @param {number} data.status - 场地状态
 * @returns {Promise}
 */
export const updateVenue = (id: number, data: updateVenueData) => {
  return request.put(`/api/venue/update/${id}`, data)
}

/**
 * 更新场地状态（需要管理员权限）
 * @param {number} id - 场地ID
 * @param {number} status - 场地状态（0-停用，1-启用，2-维护中）
 * @returns {Promise}
 */
export const updateVenueStatus = (id: number, status: number) => {
  // 后端按文档使用 Query 接收 status，这里通过 URL 传参确保兼容
  return request.put(`/api/venue/status/${id}?status=${status}`)
}

/**
 * 删除场地（需要管理员权限）
 * @param {number} id - 场地ID
 * @returns {Promise}
 */
export const deleteVenue = (id: number) => {
  return request.delete(`/api/venue/delete/${id}`)
}

/**
 * 根据ID获取场地详情
 * @param {number} id - 场地ID
 * @returns {Promise}
 */
export const getVenueById = (id: number) => {
  return request.get(`/api/venue/${id}`)
}

/**
 * 根据状态获取场地列表
 * @param {number} status - 场地状态（0-停用，1-启用，2-维护中）
 * @returns {Promise}
 */
export const getVenueListByStatus = (status: number) => {
  return request.get(`/api/venue/list/status/${status}`)
}

/**
 * 创建特殊日期配置
 * @param {Object} data - 特殊日期配置信息
 * @param {string} data.configName - 配置名称
 * @param {string} data.specialDate - 特殊日期，格式：yyyy-MM-dd
 * @param {number} data.configType - 配置类型：1-节假日，2-维护日，3-特殊开放日
 * @param {string} [data.affectedVenueIds] - 影响的场地ID，多个用逗号分隔，null表示全部场地
 * @param {string} [data.startTime] - 影响开始时间，格式：HH:mm
 * @param {string} [data.endTime] - 影响结束时间，格式：HH:mm
 * @param {number} data.venueStatus - 特殊日期场地状态：1-空闲中，2-使用中，4-维护中
 * @param {number} data.bookable - 是否可预约：1-可预约，0-不可预约
 * @param {string} [data.description] - 配置描述
 * @param {number} [data.enabled] - 是否启用：1-启用，0-禁用，默认1
 * @returns {Promise}
 */
export const createSpecialDateConfig = (data: createSpecialDateConfigData) => {
  return request.post('/api/venue/special-config', data)
}

/**
 * 获取特殊日期配置列表
 * @param {Object} params - 查询参数
 * @param {number} [params.pageNum=1] - 页码
 * @param {number} [params.pageSize=10] - 每页大小
 * @returns {Promise}
 */
export const getSpecialDateConfigList = (params: { pageNum?: number, pageSize?: number }) => {
  return request.get('/api/venue/special-config/list', { params })
}

/**
 * 获取特殊日期配置详情
 * @param {number} id - 配置ID
 * @returns {Promise}
 */
export const getSpecialDateConfigById = (id: number) => {
  return request.get(`/api/venue/special-config/${id}`)
}

/**
 * 更新特殊日期配置
 * @param {number} id - 配置ID
 * @param {Object} data - 更新的配置信息
 * @param {string} data.configName - 配置名称
 * @param {string} data.specialDate - 特殊日期，格式：yyyy-MM-dd
 * @param {number} data.configType - 配置类型：1-节假日，2-维护日，3-特殊开放日
 * @param {string} [data.affectedVenueIds] - 影响的场地ID，多个用逗号分隔，null表示全部场地
 * @param {string} [data.startTime] - 影响开始时间，格式：HH:mm
 * @param {string} [data.endTime] - 影响结束时间，格式：HH:mm
 * @param {number} data.venueStatus - 特殊日期场地状态：1-空闲中，2-使用中，4-维护中
 * @param {number} data.bookable - 是否可预约：1-可预约，0-不可预约
 * @param {string} [data.description] - 配置描述
 * @param {number} [data.enabled] - 是否启用：1-启用，0-禁用
 * @returns {Promise}
 */
export const updateSpecialDateConfig = (id: number, data: updateSpecialDateConfigData) => {
  return request.put(`/api/venue/special-config/${id}`, data)
}

/**
 * 删除特殊日期配置
 * @param {number} id - 配置ID
 * @returns {Promise}
 */
export const deleteSpecialDateConfig = (id: number) => {
  return request.delete(`/api/venue/special-config/${id}`)
}

/**
 * 启用/禁用特殊日期配置
 * @param {number} id - 配置ID
 * @param {number} enabled - 启用状态：1-启用，0-禁用
 * @returns {Promise}
 */
export const toggleSpecialDateConfig = (id: number, enabled: number) => {
  return request.put(`/api/venue/special-config/${id}/toggle`, { enabled })
}