/**
 * 特殊日期列表
 * - 列表/分页/编辑/删除
 */
import { useEffect, useMemo, useState } from 'react'
import { Button, Modal, Table, Tag, Pagination, Space, message } from 'antd'
import { formatDate } from '@/utils/date'
import type { ColumnsType } from 'antd/es/table'
import { useSpecialDateStore } from '@/store'

import SpecialDateFormModal from './SpecialDateFormModal'
import type { SpecialDateItem } from '@/store/venue/SpecialDate'

export default function SpecialData() {
  const { list, pagination, fetchList, deleteItem } = useSpecialDateStore()
  // 使用 AntD useModal，保证确认对话框可靠渲染
  const [modal, modalContextHolder] = Modal.useModal()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | undefined>(undefined)

  useEffect(() => {
    fetchList(1, 10)
  }, [fetchList])

  const columns: ColumnsType<SpecialDateItem> = useMemo(
    () => [
      { title: '日期', dataIndex: 'specialDate', key: 'specialDate', width: 140, render: (t?: string) => formatDate(t) },
      { title: '名称', dataIndex: 'configName', key: 'configName', width: 160 },
      {
        title: '类型',
        dataIndex: 'configType',
        key: 'configType',
        width: 120,
        render: (v: number) => ({ 1: '节假日', 2: '维护日', 3: '特殊开放日' }[v] || v),
      },
      {
        title: '场地状态',
        dataIndex: 'venueStatus',
        key: 'venueStatus',
        width: 120,
        render: (v: number) => ({ 1: '空闲中', 2: '使用中', 4: '维护中' }[v] || v),
      },
      {
        title: '可预约',
        dataIndex: 'bookable',
        key: 'bookable',
        width: 100,
        render: (v: number) => (v === 1 ? <Tag color="green">可预约</Tag> : <Tag color="red">不可预约</Tag>),
      },
      {
        title: '影响场地',
        dataIndex: 'affectedVenueIds',
        key: 'affectedVenueIds',
        width: 180,
        render: (v?: string) => v || '全部场地',
      },
      {
        title: '状态',
        dataIndex: 'enabled',
        key: 'enabled',
        width: 100,
        render: (v: number) => (v === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>),
      },
      {
        title: '操作',
        key: 'action',
        width: 160,
        render: (_: unknown, record: SpecialDateItem) => (
          <Space>
            <Button size="small" onClick={() => { setEditId(record.id); setOpen(true) }}>编辑</Button>
            <Button size="small" danger onClick={() => {
              modal.confirm({
                title: '确认删除该配置？',
                content: `名称：${record.configName}，日期：${record.specialDate}`,
                okText: '确认',
                cancelText: '取消',
                okType: 'primary',
                onOk: async () => {
                  await deleteItem(record.id)
                  message.success('删除成功')
                  // 刷新列表，确保总数与分页正确
                  fetchList(pagination.pageNum, pagination.pageSize)
                }
              })
            }}>删除</Button>
          </Space>
        ),
      },
    ],
    [deleteItem, fetchList, pagination.pageNum, pagination.pageSize, modal],
  )

  return (
    <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
      <div className="w-full flex justify-between items-center py-4">
        <h2 className="text-xl font-bold">特殊日期管理</h2>
        <div className="flex items-center gap-6">
          <Button type="primary" onClick={() => { setEditId(undefined); setOpen(true) }}>添加特殊日期</Button>
        </div>
      </div>
      <hr className="mb-4" />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        pagination={false}
        size="middle"
      />

      <div className="flex justify-between items-center mt-4">
        <div>共 {pagination.total} 条</div>
        <Pagination
          current={pagination.pageNum}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={(page, size) => fetchList(page, size)}
          showSizeChanger
        />
      </div>

      <SpecialDateFormModal open={open} editId={editId} onClose={() => setOpen(false)} />
      {/* AntD useModal 的上下文渲染占位 */}
      {modalContextHolder}
    </div>
  )
}
