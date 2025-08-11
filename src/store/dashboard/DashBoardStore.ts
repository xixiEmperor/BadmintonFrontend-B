/**
 * 仪表盘 Store
 * 
 * 功能职责：
 * - 缓存仪表盘概览数据，避免重复API调用
 * - 提供仪表盘数据的读取和更新接口
 * - 管理加载状态和错误状态（可扩展）
 * 
 * 设计理念：
 * - 简单轻量：目前只需要基本的数据缓存功能
 * - 易于扩展：后续可以添加加载状态、错误处理等
 * - 类型安全：使用TypeScript严格类型定义
 */
import { create } from 'zustand'
import type { statisticsData } from '@/components/dashBoard/types/returnData'

/**
 * 仪表盘状态类型定义
 */
type DashBoardState = {
  // 仪表盘概览数据，初始为null表示未加载
  dashBoardData: statisticsData | null
  
  // 设置仪表盘数据的方法
  setDashBoardData: (data: statisticsData) => void
}

/**
 * 创建仪表盘状态管理store
 * 
 * 使用Zustand创建轻量级状态管理：
 * 1. 定义初始状态：dashBoardData为null
 * 2. 提供数据更新方法：setDashBoardData
 * 3. 自动生成选择器和订阅机制
 */
export const useDashBoardStore = create<DashBoardState>((set) => ({
  // 初始状态：数据为null，表示尚未从API获取数据
  dashBoardData: null,
  
  // 数据更新方法：接收新的统计数据并更新state
  // 使用set函数触发状态更新，所有订阅的组件会自动重新渲染
  setDashBoardData: (data) => set({ dashBoardData: data })
}))

// 默认导出，方便其他模块导入使用
export default useDashBoardStore