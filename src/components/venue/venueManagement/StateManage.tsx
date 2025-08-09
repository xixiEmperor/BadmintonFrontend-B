/**
 * 场地状态管理
 * - 过滤（可用/不可用/全部）
 * - 新增/编辑/删除/批量状态
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
    // 使用 AntD v5 的 useModal，确保确认弹窗可靠渲染
    const [modal, modalContextHolder] = Modal.useModal()
    const venueList = useVenueStore((s) => s.venueList)
    const fetchVenueList = useVenueStore((s) => s.fetchVenueList)
    const fetchVenueListByStatus = useVenueStore((s) => s.fetchVenueListByStatus)
    const updateVenueStatus = useVenueStore((s) => s.updateVenueStatus)
    const deleteVenue = useVenueStore((s) => s.deleteVenue)

    // 弹窗状态
    const [formOpen, setFormOpen] = useState(false)
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
    const [formInitial, setFormInitial] = useState<Partial<Venue> & { id?: number } | undefined>()
    const [detailOpen, setDetailOpen] = useState(false)
    const [activeId, setActiveId] = useState<number>()
    const [batchOpen, setBatchOpen] = useState(false)

    useEffect(() => {
        fetchVenueList()
    }, [fetchVenueList])

    const handleMenuClick = useCallback<NonNullable<MenuProps['onClick']>>((info) => {
        // 可用=1，不可用=0（或2? 依据后端语义，这里按接口文档“按状态获取场地”使用 status number）
        // 我们定义：1=启用(可用)，0=未启用/停用(不可用)。若需要区分维护中，可在下拉扩展。
        if (info.key === 'all') {
            fetchVenueList()
            return
        }
        const statusMap: Record<string, number> = {
            available: 1,
            unavailable: 0,
        }
        const status = statusMap[info.key]
        if (typeof status === 'number') {
            fetchVenueListByStatus(status)
        }
    }, [fetchVenueList, fetchVenueListByStatus])

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
            <div className="flex flex-wrap gap-8">
                {venueList.map((venue) => (
                    <Card 
                        type="venue" 
                        key={venue.id}
                        content={venue}
                        onVenueToggle={(id, next) => updateVenueStatus(id, next)}
                        onVenueView={(id) => { setActiveId(id); setDetailOpen(true) }}
                        onVenueEdit={(id) => {
                            const v = venueList.find((x) => x.id === id)
                            setFormMode('edit')
                            setFormInitial(v)
                            setFormOpen(true)
                        }}
                        onVenueDelete={(id) => {
                            // 统一用 modal.confirm 弹出操作确认
                            modal.confirm({
                                title: '确认删除该场地？',
                                okText: '确定',
                                cancelText: '取消',
                                okType: 'primary',
                                onOk: async () => {
                                    await deleteVenue(id)
                                    message.success('删除成功')
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