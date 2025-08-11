import request from '@/utils/request'
import type { periodParams, revenueTrendParams, limitParams } from '@/types/apiTypes/dashBoard'

/**
 * 获取仪表板概览数据
 * 
 * 数据流程：
 * 1. 发送GET请求到后端分析服务的仪表板端点
 * 2. 后端聚合各模块的关键指标数据
 * 3. 返回包含用户总数、预约总数、收入统计等核心指标的概览数据
 * 
 * @returns {Promise<Object>} 系统整体统计数据，包含：
 *   - 用户相关：总用户数、今日新增用户、活跃用户等
 *   - 预约相关：总预约数、今日预约、预约收入等  
 *   - 商城相关：订单总数、今日订单、商城收入等
 *   - 论坛相关：帖子总数、今日发帖、活跃用户等
 */
export const getDashboardOverview = () => {
  // 调用统一的请求封装，发送GET请求获取仪表板概览数据
  // 该接口通常返回实时计算的系统核心指标，用于首页数据卡片展示
  return request.get('/api/analytics/dashboard')
}

/**
 * 获取用户注册趋势图表数据
 * 
 * 业务逻辑：
 * 1. 根据传入的时间周期参数查询用户注册数据
 * 2. 后端按日期聚合注册用户数量
 * 3. 返回适用于折线图/柱状图展示的时序数据
 * 
 * @param {Object} params - 查询参数
 * @param {string} [params.period='30d'] - 时间周期 (7d/30d/90d)
 * @returns {Promise<Object>} 用户注册趋势数据，格式：
 *   - type: 'line' | 'bar' - 图表类型
 *   - title: string - 图表标题
 *   - labels: string[] - X轴日期标签
 *   - data: number[] - Y轴注册数量数据
 */
export const getUserRegistrationTrend = (params: periodParams) => {
  // 将查询参数作为URL query string发送到后端
  // params包含period字段，用于指定统计的时间范围
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
