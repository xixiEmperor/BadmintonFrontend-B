import StateManage from './StateManage'
import SpecialDateManage from './SpecialData'

export default function VenueManagement() {
    return (
        <>
            {/* 头部标题 */}
            <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
                <h2 className="text-xl font-bold mb-4">场地管理</h2>
                <p className="text-gray-500">管理羽毛球场地的上架状态和特殊日期设置</p>
            </div>

            {/* 场地状态管理部分 */}
            <StateManage />

            {/* 特殊日期管理部分 */}
            <SpecialDateManage />
        </>
    )
}