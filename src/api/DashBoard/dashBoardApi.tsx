import request from '@/utils/request'
import type { periodParams, revenueTrendParams, limitParams } from '@/types/apiTypes/dashBoard'

/**
 * 获取仪表板概览数据
 * @returns {Promise<Object>} 系统整体统计数据
 */
export const getDashboardOverview = () => {
  return request.get('/api/analytics/dashboard')
}

/**
 * 获取用户注册趋势图表数据
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @returns {Promise<Object>} 用户注册趋势数据
 */
export const getUserRegistrationTrend = (params: periodParams) => {
  return request.get('/api/analytics/charts/user-registration-trend', { params })
}

/**
 * 获取用户角色分布图表数据
 * @returns {Promise<Object>} 用户角色分布数据
 */
export const getUserRoleDistribution = () => {
  return request.get('/api/analytics/charts/user-role-distribution')
}

/**
 * 获取预约趋势图表数据
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @returns {Promise<Object>} 预约趋势数据
 */
export const getReservationTrend = (params: periodParams) => {
  return request.get('/api/analytics/charts/reservation-trend', { params })
}

/**
 * 获取场地使用率排行图表数据
 * @returns {Promise<Object>} 场地使用率排行数据
 */
export const getVenueUsageRanking = () => {
  return request.get('/api/analytics/charts/venue-usage-ranking')
}

/**
 * 获取预约状态分布图表数据
 * @returns {Promise<Object>} 预约状态分布数据
 */
export const getReservationStatusDistribution = () => {
  return request.get('/api/analytics/charts/reservation-status-distribution')
}

/**
 * 获取每小时预约分布图表数据
 * @returns {Promise<Object>} 每小时预约分布数据
 */
export const getHourlyReservationDistribution = () => {
  return request.get('/api/analytics/charts/hourly-reservation-distribution')
}

/**
 * 获取收入趋势图表数据
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @param {string} [params.type='all'] - 收入类型 (all/reservation/mall)
 * @returns {Promise<Object>} 收入趋势数据
 */
export const getRevenueTrend = (params: revenueTrendParams) => {
  return request.get('/api/analytics/charts/revenue-trend', { params })
}

/**
 * 获取商城订单趋势图表数据
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @returns {Promise<Object>} 商城订单趋势数据
 */
export const getMallOrderTrend = (params: periodParams) => {
  return request.get('/api/analytics/charts/mall-order-trend', { params })
}

/**
 * 获取热门商品排行图表数据
 * @param {Object} params - 查询参数
 * @param {number} [params.limit=10] - 返回数量限制
 * @returns {Promise<Object>} 热门商品排行数据
 */
export const getPopularProducts = (params: limitParams) => {
  return request.get('/api/analytics/charts/popular-products', { params })
}

/**
 * 获取商城订单状态分布图表数据
 * @returns {Promise<Object>} 商城订单状态分布数据
 */
export const getMallOrderStatusDistribution = () => {
  return request.get('/api/analytics/charts/mall-order-status-distribution')
}

/**
 * 获取发帖趋势图表数据
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @returns {Promise<Object>} 发帖趋势数据
 */
export const getPostTrend = (params: periodParams) => {
  return request.get('/api/analytics/charts/post-trend', { params })
}

/**
 * 获取帖子分类分布图表数据
 * @returns {Promise<Object>} 帖子分类分布数据
 */
export const getPostCategoryDistribution = () => {
  return request.get('/api/analytics/charts/post-category-distribution')
}

/**
 * 获取最活跃用户排行图表数据
 * @param {Object} params - 查询参数
 * @param {number} [params.limit=10] - 返回数量限制
 * @returns {Promise<Object>} 最活跃用户排行数据
 */
export const getMostActiveUsers = (params: limitParams) => {
  return request.get('/api/analytics/charts/most-active-users', { params })
}

export default {
  getDashboardOverview,
  getUserRegistrationTrend,
  getUserRoleDistribution,
  getReservationTrend,
  getVenueUsageRanking,
  getReservationStatusDistribution,
  getHourlyReservationDistribution,
  getRevenueTrend,
  getMallOrderTrend,
  getPopularProducts,
  getMallOrderStatusDistribution,
  getPostTrend,
  getPostCategoryDistribution,
  getMostActiveUsers
}
