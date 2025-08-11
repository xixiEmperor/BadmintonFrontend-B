/**
 * 场地状态管理
 * - 过滤（可用/不可用/全部）
 * - 新增/编辑/删除/批量状态
 *
 * 交互/状态流说明：
 * - 顶部 Dropdown 切换筛选：触发 store.fetchVenueList / fetchVenueListByStatus
 * - 卡片区域渲染自 `venueList`，并向下传递 onVenueToggle/onVenueEdit/onVenueDelete 等回调
 * - 删除等破坏性操作使用 AntD Modal.useModal 的 modal.confirm 统一确认
 * - 新增/编辑/详情/批量 操作都通过对应 Modal 控制 open/close，数据刷新由 store 负责
 */
import { Button, Dropdown, Modal, message } from "antd"
import type { MenuProps } from "antd"
import Card from "../../shared/Card"
import type { VenueCardProps as Venue } from "../../shared/Card"
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useVenueStore } from "@/store"
import VenueFormModal from './VenueFormModal'
import BatchStatusModal from './BatchStatusModal'
import VenueDetailModal from './VenueDetailModal'

export default function StateManage() {
    // 1. 初始化Modal实例 - 使用 AntD v5 的 useModal Hook，避免Modal渲染时机问题
    const [modal, modalContextHolder] = Modal.useModal()
    
    // 2. 从Zustand store中获取场地相关的状态和方法
    // 这些都是响应式的，当store状态变化时组件会重新渲染
    const venueList = useVenueStore((s) => s.venueList)  // 场地列表数据
    const fetchVenueList = useVenueStore((s) => s.fetchVenueList)  // 获取全部场地的异步方法
    const fetchVenueListByStatus = useVenueStore((s) => s.fetchVenueListByStatus)  // 按状态筛选场地的异步方法
    const updateVenueStatus = useVenueStore((s) => s.updateVenueStatus)  // 更新场地状态的异步方法
    const deleteVenue = useVenueStore((s) => s.deleteVenue)  // 删除场地的异步方法

    // 3. 定义各种Modal弹窗的控制状态
    // 这些状态控制不同Modal的显示/隐藏和传递的数据
    const [formOpen, setFormOpen] = useState(false)  // 新增/编辑表单弹窗是否打开
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')  // 表单模式：新增还是编辑
    const [formInitial, setFormInitial] = useState<Partial<Venue> & { id?: number } | undefined>()  // 表单初始数据（编辑时使用）
    const [detailOpen, setDetailOpen] = useState(false)  // 详情查看弹窗是否打开
    const [activeId, setActiveId] = useState<number>()  // 当前操作的场地ID
    const [batchOpen, setBatchOpen] = useState(false)  // 批量操作弹窗是否打开

    // 4. 组件挂载后的初始化逻辑
    // 使用useEffect确保在组件首次渲染后自动加载场地列表
    useEffect(() => {
        // 调用store中的fetchVenueList方法，从后端API获取场地数据
        // 这个方法会自动更新store中的venueList状态
        fetchVenueList()
    }, [fetchVenueList])  // 依赖数组包含fetchVenueList，但由于是store方法，引用稳定，只会执行一次

    // 5. 下拉筛选菜单的点击处理函数
    // 使用useCallback优化性能，避免每次渲染都创建新函数
    const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>((info) => {
        // 根据点击的菜单项key来决定加载哪种状态的场地
        // 状态映射: 1=可用/启用, 0=不可用/停用
        
        // 如果点击的是"全部场地"选项
        if (info.key === 'all') {
            // 直接调用fetchVenueList获取所有场地，不做状态筛选
            fetchVenueList()
            return  // 提前返回，避免执行后续逻辑
        }
        
        // 定义菜单key到状态码的映射关系
        const statusMap: Record<string, number> = {
            available: 1,    // "可用场地" -> 状态码1
            unavailable: 0,  // "不可用场地" -> 状态码0
        }
        
        // 从映射表中获取对应的状态码
        const status = statusMap[info.key]
        
        // 确保状态码是有效的数字类型
        if (typeof status === 'number') {
            // 调用按状态筛选的API方法，只获取指定状态的场地
            fetchVenueListByStatus(status)
        }
        // 如果状态码无效（比如未知的菜单key），则不执行任何操作
    }, [fetchVenueList, fetchVenueListByStatus])  // 依赖数组包含使用的store方法

    const items: MenuProps['items'] = useMemo(() => ([
        {
            key: 'available',
            label: '可用场地',
        },
        {
            key: 'unavailable',
            label: '不可用场地',
        },
        {
            key: 'all',
            label: '全部场地',
        }
    ]), [])
    return (
        <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
            <div className="w-full flex justify-between items-center py-4">
                <h2 className="text-xl font-bold">场地状态管理</h2>
                <div className="flex items-center gap-6">
                    <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={['click']}>
                        <Button>场地状态</Button>
                    </Dropdown>
                    <Button variant="solid" color="blue" onClick={() => { setFormMode('create'); setFormInitial(undefined); setFormOpen(true) }}>添加场地</Button>
                    <Button variant="solid" color="danger" onClick={() => setBatchOpen(true)}>批量操作</Button>
                </div>
            </div>
            <hr className="mb-4"/>
            {/* 6. 场地卡片列表渲染区域 */}
            <div className="flex flex-wrap gap-8">
                {/* 遍历venueList数组，为每个场地渲染一个Card组件 */}
                {venueList.map((venue) => (
                    <Card 
                        type="venue"  // 指定Card类型为venue，决定Card内部的渲染逻辑
                        key={venue.id}  // 使用场地ID作为React key，确保列表更新时的性能
                        content={venue}  // 将场地数据传递给Card组件
                        
                        // 7. 场地状态切换回调 - 当用户点击可用/不可用开关时触发
                        onVenueToggle={(id, next) => {
                            // 直接调用store的updateVenueStatus方法
                            // 该方法内部使用"乐观更新"策略：先更新UI，再调用API，失败时回滚
                            updateVenueStatus(id, next)
                        }}
                        
                        // 8. 查看详情回调 - 当用户点击"查看详情"按钮时触发
                        onVenueView={(id) => { 
                            setActiveId(id)  // 设置当前活跃的场地ID
                            setDetailOpen(true)  // 打开详情查看弹窗
                        }}
                        
                        // 9. 编辑场地回调 - 当用户点击"编辑"按钮时触发
                        onVenueEdit={(id) => {
                            // 从当前列表中查找要编辑的场地数据
                            const v = venueList.find((x) => x.id === id)
                            setFormMode('edit')  // 设置表单为编辑模式
                            setFormInitial(v)  // 将找到的场地数据作为表单初始值
                            setFormOpen(true)  // 打开表单弹窗
                        }}
                        
                        // 10. 删除场地回调 - 当用户点击"删除"按钮时触发
                        onVenueDelete={(id) => {
                            // 显示确认删除的对话框，防止误操作
                            modal.confirm({
                                title: '确认删除该场地？',
                                okText: '确定',
                                cancelText: '取消',
                                okType: 'primary',
                                // 用户确认删除后的处理逻辑
                                onOk: async () => {
                                    try {
                                        // 调用store的deleteVenue方法执行删除
                                        await deleteVenue(id)
                                        // 删除成功后显示成功消息
                                        message.success('删除成功')
                                    } catch {
                                        // 如果删除失败，错误会被store方法抛出，这里可以添加错误处理
                                        // 通常store方法内部已经处理了错误提示
                                    }
                                }
                            })
                        }}
                    />
                ))}
            </div>

            {/* 复用的新增/编辑表单 */}
            <VenueFormModal
                open={formOpen}
                mode={formMode}
                initialValues={formInitial}
                onCancel={() => setFormOpen(false)}
                onSuccess={() => setFormOpen(false)}
            />

            {/* 查看详情，走缓存 */}
            <VenueDetailModal
                open={detailOpen}
                venueId={activeId}
                onCancel={() => setDetailOpen(false)}
                onEdit={(id) => {
                    const v = venueList.find((x) => x.id === id)
                    setDetailOpen(false)
                    setFormMode('edit')
                    setFormInitial(v)
                    setFormOpen(true)
                }}
            />

            {/* 批量操作 */}
            <BatchStatusModal
                open={batchOpen}
                onCancel={() => setBatchOpen(false)}
                onSuccess={() => setBatchOpen(false)}
            />
            {/* AntD useModal 必须将 contextHolder 渲染到树中 */}
            {modalContextHolder}
        </div>
    )
}