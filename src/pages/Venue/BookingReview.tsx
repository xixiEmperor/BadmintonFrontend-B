/**
 * 场地预定审核页
 * - 支持按场地/状态/日期筛选
 * - 可完成订单、审批退款
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Modal, Pagination, Select, Space, Table, Tag, message } from 'antd'
import { formatDate, formatDateTime, toRangeParams } from '@/utils/date'
import dayjs, { Dayjs } from 'dayjs'
import { getAdminOrders, completeOrder, approveRefund } from '@/api/Venue/bookingReviewApi'
import { getVenueList } from '@/api/Venue/venueManagementApi'
// 订单状态常量与工具函数，集中管理
import {
  RESERVATION_FILTER_OPTIONS,
  getStatusLabel,
  isFinishedOrClosed,
  isPaid,
  isRefunding,
} from '@/constants/reservations'

type OrderItem = {
  id: number
  orderNo: string
  username: string
  venueName: string
  venueId?: number
  reservationDate: string
  startTime: string
  endTime: string
  totalAmount?: number
  pricePerHour?: number
  status?: number
  statusDesc?: string
  createTime?: string
}

// 通用的接口返回解包工具：兼容 { data: T } 与直接返回 T 两种后端风格
type ApiResp<T> = { data?: T } | T
function unwrap<T>(resp: ApiResp<T>): T {
  if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
    return (resp as { data?: T }).data as T
  }
  return resp as T
}

// 状态颜色（用于表格 Tag）
const STATUS_COLOR: Record<string, 'success' | 'processing' | 'error' | 'warning' | 'default'> = {
  待支付: 'warning',
  已支付: 'processing',
  已完成: 'success',
  已取消: 'error',
  退款中: 'warning',
  已关闭: 'success',
}

type VenueOption = { label: string; value: number }

export default function BookingReview() {
  // 统一用 useModal，解决环境下 confirm 不显示的问题
  const [modal, modalContextHolder] = Modal.useModal()
  const [venues, setVenues] = useState<VenueOption[]>([])
  const [list, setList] = useState<OrderItem[]>([])
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [venueId, setVenueId] = useState<number | undefined>(undefined)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)

  const [detail, setDetail] = useState<OrderItem | null>(null)

  useEffect(() => {
    ;(async () => {
      const res: ApiResp<Array<{ id: number; name: string }>> = await getVenueList() as ApiResp<Array<{ id: number; name: string }>>
      const raw = unwrap<Array<{ id: number; name: string }>>(res)
      const options: VenueOption[] = raw.map((v) => ({ value: v.id, label: v.name }))
      setVenues(options)
    })()
  }, [])

  const fetchList = useCallback(async (curPage = page, curSize = size) => {
    const params: Record<string, unknown> = { page: curPage, size: curSize }
    if (venueId) params.venueId = venueId
    if (typeof status === 'number') params.status = status
    if (dateRange) {
      const r = toRangeParams(dateRange)
      params.startDate = r.startDate
      params.endDate = r.endDate
    }
    const res: ApiResp<{ list?: OrderItem[]; total?: number; page?: number; size?: number }> = await getAdminOrders(params) as ApiResp<{ list?: OrderItem[]; total?: number; page?: number; size?: number }>
    const data = unwrap<{ list?: OrderItem[]; total?: number; page?: number; size?: number }>(res)
    const listData: OrderItem[] = data?.list ?? []
    setList(listData)
    setTotal(data?.total ?? 0)
    setPage(data?.page ?? curPage)
    setSize(data?.size ?? curSize)
  }, [page, size, venueId, status, dateRange])

  useEffect(() => {
    fetchList(1, size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetFilters = async () => {
    setVenueId(undefined)
    setStatus(undefined)
    setDateRange(null)
    await fetchList(1, size)
  }

  // 获取状态文本（优先使用后端 statusDesc）
  const statusText = (record: OrderItem) => record.statusDesc || getStatusLabel(record.status, '—')

  const columns = useMemo(() => [
    { title: '订单ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    {
      title: '状态', key: 'status', width: 110,
      render: (_: unknown, record: OrderItem) => {
        const text = statusText(record)
        const color = STATUS_COLOR[text] || 'default'
        return <Tag color={color}>{text}</Tag>
      }
    },
    { title: '预定用户', dataIndex: 'username', key: 'username', width: 120 },
    { title: '场地名称', dataIndex: 'venueName', key: 'venueName', width: 140 },
    { title: '预约日期', dataIndex: 'reservationDate', key: 'reservationDate', width: 140, render: (t?: string) => formatDate(t) },
    {
      title: '时间段', key: 'timeRange', width: 140,
      render: (_: unknown, r: OrderItem) => `${r.startTime} - ${r.endTime}`
    },
    {
      title: '金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 110,
      render: (v: number | undefined) => <span style={{ color: '#cf1322' }}>{v != null ? `¥${v}` : '-'}</span>
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170, render: (t?: string) => formatDateTime(t) },
    {
      title: '操作', key: 'action', fixed: 'right' as const, width: 260,
      render: (_: unknown, record: OrderItem) => {
        const code = record.status
        const isRefundingFlag = isRefunding(code)
        const isPaidFlag = isPaid(code)
        const isFinishedOrClosedFlag = isFinishedOrClosed(code)
        return (
          <Space>
            <Button size="small" onClick={() => setDetail(record)}>详情</Button>
            {isPaidFlag && (
              <Button size="small" type="primary" onClick={() => {
                modal.confirm({
                  title: '确认完成该订单？',
                  okText: '确定',
                  cancelText: '取消',
                  okType: 'primary',
                  onOk: async () => {
                    await completeOrder(record.id)
                    message.success('订单已完成')
                    fetchList(page, size)
                  }
                })
              }}>完成订单</Button>
            )}
            {isRefundingFlag && (
              <>
                <Button size="small" type="primary" onClick={() => {
                  modal.confirm({
                    title: '确认批准该退款申请？',
                    okText: '确定',
                    cancelText: '取消',
                    okType: 'primary',
                    onOk: async () => {
                      await approveRefund(record.id, { approved: true })
                      message.success('已批准退款')
                      fetchList(page, size)
                    }
                  })
                }}>批准退款</Button>
                <Button size="small" danger onClick={() => {
                  modal.confirm({
                    title: '确认拒绝该退款申请？',
                    okText: '确定',
                    cancelText: '取消',
                    okType: 'primary',
                    onOk: async () => {
                      await approveRefund(record.id, { approved: false })
                      message.success('已拒绝退款申请')
                      fetchList(page, size)
                    }
                  })
                }}>拒绝退款</Button>
              </>
            )}
            {isFinishedOrClosedFlag && null}
          </Space>
        )
      }
    },
  ], [page, size, fetchList, modal])

  return (
    <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
      {/* Header */}
      <div className="w-full flex justify-between items-center py-4">
        <h2 className="text-xl font-bold">预定管理</h2>
        <div />
      </div>
      <hr className="mb-4" />

      {/* Filters */}
      <div className="w-full flex flex-wrap items-center gap-3 mb-4">
        {/* 场地选择 */}
        <Select
          allowClear
          placeholder="请选择场地"
          options={venues}
          style={{ width: 200 }}
          value={venueId}
          onChange={(v) => setVenueId(v)}
        />
        {/* 订单状态筛选（五类） */}
        <Select
          allowClear
          placeholder="订单状态"
          style={{ width: 160 }}
          value={status}
          onChange={(v) => setStatus(v)}
          options={RESERVATION_FILTER_OPTIONS}
        />
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
        />
        <Space>
          <Button type="primary" onClick={() => fetchList(1, size)}>筛选</Button>
          <Button onClick={resetFilters}>重置</Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={list}
        pagination={false}
        size="middle"
        scroll={{ x: 1000 }}
      />

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>共 {total} 条</div>
        <Pagination
          current={page}
          pageSize={size}
          total={total}
          onChange={(p, s) => {
            setPage(p)
            setSize(s)
            fetchList(p, s)
          }}
          showSizeChanger
        />
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detail}
        title="订单详情"
        onCancel={() => setDetail(null)}
        onOk={() => setDetail(null)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ type: 'primary' }}
      >
        {detail && (
          <div className="space-y-2 text-sm">
            <div>订单ID：{detail.id}</div>
            <div>订单号：{detail.orderNo}</div>
            <div>状态：{statusText(detail)}</div>
            <div>预定用户：{detail.username}</div>
            <div>场地名称：{detail.venueName}</div>
            <div>预约日期：{detail.reservationDate}</div>
            <div>时间段：{detail.startTime} - {detail.endTime}</div>
            <div>金额：{detail.totalAmount != null ? `¥${detail.totalAmount}` : '-'}</div>
            <div>创建时间：{detail.createTime || '-'}</div>
          </div>
        )}
      </Modal>
      {/* AntD useModal 的上下文渲染占位 */}
      {modalContextHolder}
    </div>
  )
}

