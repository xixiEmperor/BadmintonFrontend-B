/**
 * 仪表盘页面组件
 * - 顶部统计卡 + 下方图表区
 */
import Statistics from './Statistics'
import Charts from './charts'

export default function DashBoard() {
    return (
        <div>
            <Statistics />
            <Charts />
        </div>
    )
}