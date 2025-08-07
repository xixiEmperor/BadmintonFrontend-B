import Chart from '@/components/shared/Chart'
import { 
    getUserRegistrationTrend,
    getUserRoleDistribution,
    getReservationTrend,
    getVenueUsageRanking,
    getReservationStatusDistribution,
    getRevenueTrend,
 } from "@/api/DashBoard/dashBoardApi"
import { AxiosResponse } from "axios"
import { chartParams, ChartApiResponse } from "@/types/apiTypes/dashBoard"

interface ChartItemType {
    id: string
    title: string
    fn: (params: chartParams) => Promise<AxiosResponse<ChartApiResponse>>
    params: chartParams
    extra?: object
}

const charts: ChartItemType[] = [
    {
        id: 'user-registration-trend-chart',
        title: '用户注册趋势',
        fn: getUserRegistrationTrend,
        params: {
            period: '30d'
        }
    },
    {
        id: 'user-role-distribution-chart',
        title: '用户角色分布',
        fn: getUserRoleDistribution,
        params: {}
    },
    {
        id: 'reservation-trend-chart',
        title: '预约趋势',
        fn: getReservationTrend,
        params: {
            period: '30d'
        }
    },
    {
        id: 'venue-usage-ranking-chart',
        title: '场地使用率排行',
        fn: getVenueUsageRanking,
        params: {}
    },
    {
        id: 'reservation-status-distribution-chart',
        title: '预约状态分布',
        fn: getReservationStatusDistribution,
        params: {}
    },
    {
        id: 'revenue-trend-chart',
        title: '收入趋势',
        fn: getRevenueTrend,
        params: {
            period: '30d',
            type: 'all'
        }
    },
]

export default function Charts() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {charts.map((chart) => (
                <Chart
                    key={chart.id}
                    id={chart.id}
                    fn={chart.fn}
                    params={chart.params}
                    extra={chart.extra}
                    className="w-full h-[400px]"
                />
            ))}
        </div>
    )
}