import Card from '@/components/shared/Card'
import { UserOutlined } from '@ant-design/icons'
import { useEffect, useState, useMemo } from 'react'
import { getDashboardOverview } from '@/api/DashBoard/dashBoardApi'
import type { statisticsData } from './types/returnData'

export default function Statistics() {
    const [statistics, setStatistics] = useState<statisticsData | null>(null)

    useEffect(() => {
        let isMounted = true // 用于检查组件是否仍然挂载
        
        const fetchData = async () => {
            try {
                const res = await getDashboardOverview()
                // 只有在组件仍然挂载时才更新状态
                if (isMounted) {
                    setStatistics(res.data)
                }
            } catch (error) {
                // 忽略取消错误，只记录其他错误
                if (error instanceof Error && error.name !== 'CanceledError' && isMounted) {
                    console.error('获取统计数据失败:', error)
                } else if (!(error instanceof Error) && isMounted) {
                    console.error('获取统计数据失败:', error)
                }
            }
        }
        
        fetchData()
        
        // 清理函数：组件卸载时设置标志
        return () => {
            isMounted = false
        }
    }, [])

    const statisticsCards = useMemo(() => {
        if (!statistics) return []
        
        return [
            {
                title: '用户总数',
                value: statistics.totalUsers,
                icon: <UserOutlined />,
                increment: statistics.newUsersToday,
                incrementDesc: '今日新增'
            },
            {
                title: '预约总数',
                value: statistics.totalReservations,
                icon: <UserOutlined />,
                increment: statistics.reservationsToday,
                incrementDesc: '今日预约'
            },
            {
                title: '总收入',
                value: statistics.reservationRevenue,
                icon: <UserOutlined />,
                increment: statistics.revenueToday,
                incrementDesc: '今日收入'
            },
            {
                title: '商城订单',
                value: statistics.totalOrders,
                icon: <UserOutlined />,
                increment: statistics.ordersToday,
                incrementDesc: '今日订单'
            },
        ]
    }, [statistics])

    return (
        <div className="flex flex-wrap justify-between items-center">
            {statisticsCards.map((card, index) => (
                <Card 
                    key={index}
                    type='statistics'
                    content={card}
                />
            ))}
        </div>
    )
}