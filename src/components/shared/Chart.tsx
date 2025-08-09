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
    const initChart = async () => {
      if (!chartRef.current) return

      try {
        // 获取数据
        const res = await fn(params)

        // 初始化图表实例
        const chartInstance = echarts.init(chartRef.current)
        chartInstanceRef.current = chartInstance

        // 获取API返回的数据
        const chartData = res.data

        // 设置基础配置
        const baseOptions: echarts.EChartsOption = {
          title: {
            text: chartData.title || title,
            left: 'center'
          },
          tooltip: {
            trigger: 'item' as const
          }
        }

        // 根据图表类型设置特定配置
        let chartOptions: echarts.EChartsOption = { ...baseOptions }

        switch (chartData.type) {
          case 'pie': {
            chartOptions = {
              ...baseOptions,
              tooltip: {
                trigger: 'item' as const,
                formatter: '{a} <br/>{b}: {c} ({d}%)'
              },
              legend: {
                orient: 'vertical' as const,
                left: 'left'
              },
              series: [{
                name: chartData.title || title,
                type: 'pie' as const,
                radius: '60%',
                center: ['50%', '60%'],
                data: chartData.data,
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
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

        // 合并额外配置
        const finalOptions = {
          ...chartOptions,
          ...extra
        }

        // 设置图表选项
        chartInstance.setOption(finalOptions)

        // 响应式处理
        const handleResize = () => {
          chartInstance.resize()
        }
        window.addEventListener('resize', handleResize)

        // 清理函数
        return () => {
          window.removeEventListener('resize', handleResize)
        }

      } catch (error) {
        if (error && typeof error === 'object' && 'name' in error && error.name === 'CanceledError') return
        console.error(`图表 ${id} 初始化错误:`, error)
      }
    }

    initChart()

    // 组件卸载时销毁图表实例
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose()
        chartInstanceRef.current = null
      }
    }
  }, [id, fn, params, extra, title])

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