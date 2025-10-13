/**
 * 商城-订单管理页
 * - 列表/筛选/查看详情/完成提货/关闭订单
 */
import { useMemo, useState } from 'react'
import { Card, Input, Button, Table, Space, Tag, Modal, Descriptions, Statistic, Row, Col, message, Typography } from 'antd'
import { formatDateTime } from '@/utils/date'
import type { ColumnsType } from 'antd/es/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrdersByAdmin, closeOrderByAdmin, completeOrderByAdmin } from '@/api/Shop/ordersApi'
import type { GetOrdersParams } from '@/types/apiTypes/orders'

type OrderItem = {
  id: number
  orderNo: number
  productId: number
  productName: string
  productImage?: string
  currentUnitPrice: number
  quantity: number
  totalPrice: number
  specificationId?: number
  specs?: Record<string, string>
  priceAdjustment?: number
}

type Order = {
  id: number
  orderNo: number
  userId: number
  username?: string
  userEmail?: string
  totalPrice: number
  paymentType?: number
  status: 10 | 20 | 30 | 40 | 50
  paymentTime?: string | null
  pickupCode?: string | null
  createTime?: string
  orderItemList: OrderItem[]
}

type PageResult<T> = { list: T[]; total: number; pageNum: number; pageSize: number }

function StatusTag({ status }: { status: Order['status'] }) {
  const map: Record<Order['status'], { text: string; color: string }> = {
    10: { text: '待支付', color: 'default' },
    20: { text: '已支付', color: 'green' },
    30: { text: '已取消', color: 'blue' },
    40: { text: '已完成', color: 'processing' },
    50: { text: '已关闭', color: 'red' },
  }
  const { text, color } = map[status]
  return <Tag color={color as any}>{text}</Tag>
}

function OrderDetailDialog({ open, onCancel, order }: { open: boolean; onCancel: () => void; order?: Order }) {
  if (!order) return null
  return (
    <Modal open={open} onCancel={onCancel} onOk={onCancel} okText="确认" cancelText="取消" title={`订单详情 ${order.orderNo}`} width={800}>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
        <Descriptions.Item label="用户">{order.username || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态" span={2}><StatusTag status={order.status} /></Descriptions.Item>
        <Descriptions.Item label="总金额">¥{order.totalPrice}</Descriptions.Item>
        <Descriptions.Item label="支付时间">{formatDateTime(order.paymentTime)}</Descriptions.Item>
        <Descriptions.Item label="创建时间" span={2}>{formatDateTime(order.createTime)}</Descriptions.Item>
      </Descriptions>
      <div className="mt-4" />
      <Table<OrderItem>
        size="small"
        rowKey="id"
        dataSource={order.orderItemList}
        columns={[
          { title: '商品', dataIndex: 'productName' },
          { title: '单价', dataIndex: 'currentUnitPrice', width: 100 },
          { title: '数量', dataIndex: 'quantity', width: 80 },
          { title: '小计', dataIndex: 'totalPrice', width: 100 },
        ]}
        pagination={false}
      />
    </Modal>
  )
}

export default function Orders() {
  const [modal, modalContextHolder] = Modal.useModal()
  const queryClient = useQueryClient()
  const [params, setParams] = useState<GetOrdersParams>({ pageNum: 1, pageSize: 10 })
  const [searchUsername, setSearchUsername] = useState<string>('')
  const [searchOrderNo, setSearchOrderNo] = useState<string>('')
  const [detail, setDetail] = useState<Order | undefined>(undefined)

  const { data, isFetching } = useQuery<PageResult<Order>>({
    queryKey: ['order.list', params],
    queryFn: async () => {
      type ApiResp<T> = { data?: T } | T
      function unwrap<T>(resp: ApiResp<T>): T {
        if (resp && typeof resp === 'object' && 'data' in (resp as Record<string, unknown>)) {
          return (resp as { data?: T }).data as T
        }
        return resp as T
      }
      const resp = await getOrdersByAdmin(params)
      const data = unwrap<PageResult<Order>>(resp as ApiResp<PageResult<Order>>)
      const list = (data?.list ?? []) as Order[]
      const total = data?.total ?? list.length
      const pageNum = data?.pageNum ?? params.pageNum!
      const pageSize = data?.pageSize ?? params.pageSize!
      return { list, total, pageNum, pageSize } as PageResult<Order>
    },
  })

  const completeMutation = useMutation({
    mutationFn: async ({ orderNo, pickupCode }: { orderNo: number; pickupCode: string }) => {
      return completeOrderByAdmin(orderNo, pickupCode)
    },
    onSuccess: () => {
      message.success('完成订单成功')
      queryClient.invalidateQueries({ queryKey: ['order.list'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: async (orderNo: number) => closeOrderByAdmin(orderNo),
    onSuccess: () => {
      message.success('已关闭订单')
      queryClient.invalidateQueries({ queryKey: ['order.list'] })
    },
  })

  const columns = useMemo<ColumnsType<Order>>(
    () => [
      { title: '订单号', dataIndex: 'orderNo', width: 200 },
      { title: '用户', dataIndex: 'username', width: 160 },
      {
        title: '商品明细',
        dataIndex: 'orderItemList',
        render: (items: OrderItem[]) => (
          <Space wrap>
            {items?.slice(0, 3)?.map((i) => (
              <Tag key={i.id}>{i.productName} × {i.quantity}</Tag>
            ))}
            {items && items.length > 3 && <Tag>…{items.length - 3}</Tag>}
          </Space>
        ),
      },
      { title: '总金额', dataIndex: 'totalPrice', width: 120, render: (v: number) => <Typography.Text type="danger">¥{v}</Typography.Text> },
      { title: '状态', dataIndex: 'status', width: 120, render: (s: Order['status']) => <StatusTag status={s} /> },
      { title: '创建时间', dataIndex: 'createTime', width: 200, render: (t?: string) => formatDateTime(t) },
      {
        title: '操作',
        fixed: 'right',
        width: 260,
        render: (_, r) => (
          <Space>
            <Button type="link" onClick={() => setDetail(r)}>查看</Button>
            {r.status === 20 && (
              <Button type="link" onClick={() => promptPickupAndComplete(r.orderNo)}>
                完成提货
              </Button>
            )}
            {r.status !== 50 && r.status !== 40 && (
              <Button type="link" danger onClick={() => closeMutation.mutate(r.orderNo)}>关闭</Button>
            )}
          </Space>
        ),
      },
    ],
    []
  )

  const promptPickupAndComplete = (orderNo: number) => {
    let code = ''
    modal.confirm({
      title: '输入提货码',
      content: (
        <Input.Password placeholder="请输入提货码" onChange={(e) => (code = e.target.value)} />
      ),
      onOk: () => {
        if (!code) {
          message.warning('请输入提货码')
          return Promise.reject()
        }
        return completeMutation.mutateAsync({ orderNo, pickupCode: code })
      },
    })
  }

  const list: Order[] = data?.list ?? []
  const total: number = data?.total ?? 0

  // 统计卡片（示例：当前页统计）
  const statistics = useMemo(() => {
    let unpaid = 0, paid = 0, cancelled = 0, completed = 0, closed = 0, totalAmount = 0
    list.forEach((o: Order) => {
      if (o.status === 10) unpaid += 1
      if (o.status === 20) { paid += 1; totalAmount += o.totalPrice }
      if (o.status === 30) cancelled += 1
      if (o.status === 40) completed += 1
      if (o.status === 50) closed += 1
    })
    return { unpaid, paid, cancelled, completed, closed, totalAmount }
  }, [list])

  return (
    <div className="p-6">
      <Row gutter={16} className="mb-4">
        <Col span={4}><Card><Statistic title="待支付" value={statistics.unpaid} /></Card></Col>
        <Col span={4}><Card><Statistic title="已支付" value={statistics.paid} /></Card></Col>
        <Col span={4}><Card><Statistic title="已取消" value={statistics.cancelled} /></Card></Col>
        <Col span={4}><Card><Statistic title="已完成" value={statistics.completed} /></Card></Col>
        <Col span={4}><Card><Statistic title="已关闭" value={statistics.closed} /></Card></Col>
        <Col span={4}><Card><Statistic title="本页金额(已支付/完成)" prefix="¥" value={statistics.totalAmount} /></Card></Col>
      </Row>

      <Card className="mb-4">
        <Space wrap>
          <Input
            allowClear
            placeholder="请输入用户名"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            style={{ width: 240 }}
          />
          <Input
            allowClear
            placeholder="请输入订单号"
            value={searchOrderNo}
            onChange={(e) => setSearchOrderNo(e.target.value)}
            style={{ width: 240 }}
          />
          <Button type="primary" onClick={() => setParams((p) => ({
            ...p,
            pageNum: 1,
            username: searchUsername || undefined,
            orderNo: searchOrderNo ? Number(searchOrderNo) : undefined,
          }))}>搜索</Button>
          <Button onClick={() => {
            setSearchUsername('')
            setSearchOrderNo('')
            setParams({ pageNum: 1, pageSize: params.pageSize })
          }}>重置</Button>
        </Space>
      </Card>

      <Table<Order>
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={list}
        pagination={{
          current: params.pageNum,
          pageSize: params.pageSize,
          total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setParams((p) => ({ ...p, pageNum: page, pageSize })),
        }}
        scroll={{ x: 1000 }}
      />

      <OrderDetailDialog open={!!detail} onCancel={() => setDetail(undefined)} order={detail} />
      {modalContextHolder}
    </div>
  )
}
