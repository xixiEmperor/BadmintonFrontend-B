/**
 * 通用图表组件（ECharts）
 * - 由父组件传入拉取数据的方法与参数
 * - 根据后端返回的 type 渲染 pie/bar/line
 */
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { chartParams, ChartApiResponse } from '@/types/apiTypes/dashBoard'
import type { AxiosResponse } from 'axios'

interface ChartProps {
  id: string
  title?: string
  className?: string
  fn: (params: chartParams) => Promise<AxiosResponse<ChartApiResponse>>
  params: chartParams
  extra?: object
}

export default function Chart({ 
  id, 
  title, 
  className = "w-full h-[400px]", 
  fn, 
  params, 
  extra = {} 
}: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    // 异步初始化图表的主函数
    const initChart = async () => {
      // 1. 检查DOM引用是否存在
      // 如果chartRef.current为null，说明DOM还未挂载，直接返回
      if (!chartRef.current) return

      try {
        // 2. 调用父组件传入的API函数获取图表数据
        // fn是从props接收的API调用函数，params是查询参数
        const res = await fn(params)

        // 3. 初始化ECharts实例
        // 基于DOM元素创建图表实例，并保存引用供后续操作使用
        const chartInstance = echarts.init(chartRef.current)
        chartInstanceRef.current = chartInstance

        // 4. 提取API响应中的图表数据
        // res.data包含图表类型、数据、标签等信息
        const chartData = res.data

        // 5. 定义通用的基础配置项
        // 所有图表类型都会应用这些基础配置
        const baseOptions: echarts.EChartsOption = {
          title: {
            text: chartData.title || title,  // 优先使用API返回的标题，fallback到props中的title
            left: 'center'  // 标题居中显示
          },
          tooltip: {
            trigger: 'item' as const  // 默认为item触发模式，部分图表类型会覆盖
          }
        }

        // 6. 初始化图表配置对象，后续会根据图表类型进行具体配置
        let chartOptions: echarts.EChartsOption = { ...baseOptions }

        // 7. 根据后端返回的图表类型，配置不同的图表选项
        switch (chartData.type) {
          case 'pie': {
            // 7.1 饼图配置
            chartOptions = {
              ...baseOptions,
              tooltip: {
                trigger: 'item' as const,  // 饼图使用item触发模式
                formatter: '{a} <br/>{b}: {c} ({d}%)'  // 自定义tooltip格式：显示系列名、数据名、数值和百分比
              },
              legend: {
                orient: 'vertical' as const,  // 图例垂直排列
                left: 'left'  // 图例位置在左侧
              },
              series: [{
                name: chartData.title || title,  // 系列名称
                type: 'pie' as const,  // 指定为饼图类型
                radius: '60%',  // 饼图半径为容器的60%
                center: ['50%', '60%'],  // 饼图中心位置：水平居中，垂直60%处
                data: chartData.data,  // 使用API返回的数据
                emphasis: {
                  // 鼠标悬停时的样式增强
                  itemStyle: {
                    shadowBlur: 10,  // 阴影模糊度
                    shadowOffsetX: 0,  // 阴影X偏移
                    shadowColor: 'rgba(0, 0, 0, 0.5)'  // 阴影颜色
                  }
                }
              }]
            }
            break
          }

          case 'bar': {
            chartOptions = {
              ...baseOptions,
              tooltip: {
                trigger: 'axis' as const
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
              },
              xAxis: {
                type: 'category' as const,
                data: chartData.labels || []
              },
              yAxis: {
                type: 'value' as const
              },
              series: [{
                name: chartData.title || title,
                type: 'bar' as const,
                data: chartData.data,
                itemStyle: {
                  color: '#5470c6'
                }
              }]
            }
            break
          }

          case 'line': {
            chartOptions = {
              ...baseOptions,
              tooltip: {
                trigger: 'axis' as const
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
              },
              xAxis: {
                type: 'category' as const,
                data: chartData.labels || []
              },
              yAxis: {
                type: 'value' as const
              },
              series: [{
                name: chartData.title || title,
                type: 'line' as const,
                data: chartData.data,
                smooth: true,
                lineStyle: {
                  color: '#91cc75'
                }
              }]
            }
            break
          }

          default: {
            console.warn(`未支持的图表类型: ${chartData.type}`)
            return
          }
        }

        // 8. 合并用户自定义的额外配置
        // extra参数允许父组件传入自定义配置来覆盖默认设置
        const finalOptions = {
          ...chartOptions,  // 基础图表配置
          ...extra          // 用户自定义配置（优先级更高）
        }

        // 9. 将最终配置应用到图表实例
        // setOption会重新渲染图表，应用所有配置项
        chartInstance.setOption(finalOptions)

        // 10. 添加窗口大小变化的响应式处理
        const handleResize = () => {
          // 当窗口大小改变时，重新计算图表尺寸
          chartInstance.resize()
        }
        // 监听窗口resize事件
        window.addEventListener('resize', handleResize)

        // 11. 返回清理函数，用于组件卸载或重新渲染时清理事件监听器
        return () => {
          window.removeEventListener('resize', handleResize)
        }

      } catch (error) {
        // 12. 错误处理
        // 忽略请求取消错误（通常发生在组件快速卸载时）
        if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') return
        
        // 记录其他类型的错误，便于调试
        console.error(`图表 ${id} 初始化错误:`, error)
      }
    }

    // 13. 调用初始化函数开始图表创建流程
    initChart()

    // 14. useEffect的清理函数：组件卸载或依赖项变化时执行
    return () => {
      // 检查图表实例是否存在
      if (chartInstanceRef.current) {
        // 销毁图表实例，释放内存和事件监听器
        chartInstanceRef.current.dispose()
        // 清空引用，避免内存泄漏
        chartInstanceRef.current = null
      }
    }
  }, [
    // 15. useEffect的依赖数组：当这些值变化时重新执行effect
    id,      // 图表ID变化时重新初始化
    fn,      // API函数变化时重新获取数据
    params,  // 查询参数变化时重新获取数据
    extra,   // 额外配置变化时重新渲染图表
    title    // 标题变化时重新渲染图表
  ])

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <div 
        ref={chartRef} 
        id={id}
        className={className}
      />
    </div>
  )
}