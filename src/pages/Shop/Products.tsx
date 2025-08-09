/**
 * 商城-商品管理页
 * - 列表/筛选/新增编辑/上下架/规格管理
 */
import { useEffect, useMemo, useState } from 'react'
import { Table, Input, Select, Button, Space, Tag, message, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime } from '@/utils/date'
import {
  deleteProduct,
  onSaleProduct,
  offSaleProduct,
} from '@/api/Shop/productsApi'
import type { ProductData } from '@/types/apiTypes/products'
import ProductDialog from '@/components/Products/ProductDialog'
import SpecificationManager from '@/components/Products/SpecificationManager'
import { useProductStore } from '@/store'

export default function Products() {
  const [modal, modalContextHolder] = Modal.useModal()
  const [loading, setLoading] = useState(false)

  const {
    list: data,
    total,
    params,
    categories,
    setParams,
    fetchList,
    fetchCategories,
  } = useProductStore()

  const [dialogOpen, setDialogOpen] = useState<{
    visible: boolean
    product?: ProductData
  }>({ visible: false })

  const [specOpen, setSpecOpen] = useState<{
    visible: boolean
    product?: ProductData
  }>({ visible: false })

  useEffect(() => {
    fetchCategories().catch(() => {})
    ;(async () => {
      setLoading(true)
      try {
        await fetchList()
      } finally {
        setLoading(false)
      }
    })()
  }, [fetchCategories, fetchList])

  useEffect(() => {
    setLoading(true)
    fetchList()
      .catch((e) => message.error((e as { message?: string })?.message || '获取商品列表失败'))
      .finally(() => setLoading(false))
  }, [params.pageNum, params.pageSize, params.keyword, params.categoryId, params.orderBy, fetchList])

  const columns = useMemo<ColumnsType<ProductData>>(
    () => [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
      },
      {
        title: '商品图片',
        dataIndex: 'mainImage',
        width: 80,
        render: (url?: string) => (url ? <img src={url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /> : '-'),
      },
      {
        title: '商品名称',
        dataIndex: 'name',
        render: (_, record) => (
          <div>
            <div className="font-medium">{record.name}</div>
            {record.subtitle && <div className="text-gray-500 text-xs">{record.subtitle}</div>}
          </div>
        ),
      },
      { title: '分类', dataIndex: 'categoryName', width: 120 },
      {
        title: '价格',
        dataIndex: 'price',
        width: 100,
        render: (v: number) => (v != null ? `¥${Number(v).toFixed(2)}` : '-'),
      },
      {
        title: '库存',
        dataIndex: 'stock',
        width: 100,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (s: number) => (s === 1 ? <Tag color="green">上架</Tag> : <Tag>下架</Tag>),
      },
      {
        title: '规格',
        dataIndex: 'hasSpecification',
        width: 80,
        render: (v?: number) => (v === 1 ? <Tag color="gold">多规格</Tag> : <Tag>单规格</Tag>),
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        width: 180,
        render: (t?: string) => formatDateTime(t),
      },
      {
        title: '操作',
        fixed: 'right',
        width: 260,
        render: (_, record) => (
          <Space>
            <Button type="link" onClick={() => setDialogOpen({ visible: true, product: record })}>编辑</Button>
            <Button type="link" onClick={() => setSpecOpen({ visible: true, product: record })}>规格</Button>
            {record.status === 1 ? (
              <Button type="link" danger onClick={() => {
                modal.confirm({
                  title: '确定下架该商品？',
                  okText: '确认',
                  cancelText: '取消',
                  okType: 'primary',
                  onOk: () => handleOffSale(record.id!),
                })
              }}>下架</Button>
            ) : (
              <Button type="link" onClick={() => {
                modal.confirm({
                  title: '确定上架该商品？',
                  okText: '确认',
                  cancelText: '取消',
                  okType: 'primary',
                  onOk: () => handleOnSale(record.id!),
                })
              }}>上架</Button>
            )}
            <Button type="link" danger onClick={() => {
              modal.confirm({
                title: '确定删除该商品？',
                okText: '确认',
                cancelText: '取消',
                okType: 'primary',
                onOk: () => handleDelete(record.id!),
              })
            }}>删除</Button>
          </Space>
        ),
      },
    ],
    []
  )

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(id)
      message.success('删除成功')
      fetchList()
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }
  const handleOnSale = async (id: number) => {
    try {
      await onSaleProduct(id)
      message.success('已上架')
      fetchList()
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }
  const handleOffSale = async (id: number) => {
    try {
      await offSaleProduct(id)
      message.success('已下架')
      fetchList()
    } catch (e: any) {
      message.error(e?.message || '操作失败')
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
        <Space wrap>
          <Input.Search
            placeholder="搜索名称/副标题"
            allowClear
            onSearch={(v) => setParams({ keyword: v, pageNum: 1 })}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="分类"
            style={{ width: 160 }}
            options={categories.map((c) => ({ label: c.name, value: String(c.id) }))}
            onChange={(v) => setParams({ categoryId: v, pageNum: 1 })}
          />
          <Select
            allowClear
            placeholder="状态"
            style={{ width: 120 }}
            options={[
              { label: '上架', value: 1 },
              { label: '下架', value: 0 },
            ]}
            onChange={(v) => setParams({ status: v as 0 | 1, pageNum: 1 })}
          />
          <Select
            allowClear
            placeholder="排序"
            style={{ width: 180 }}
            options={[
              { label: '价格升序', value: 'price_asc' },
              { label: '价格降序', value: 'price_desc' },
              { label: '销量降序', value: 'sales_desc' },
            ]}
            onChange={(v) => setParams({ orderBy: v as any, pageNum: 1 })}
          />
          <Button type="primary" onClick={() => setDialogOpen({ visible: true })}>新增商品</Button>
        </Space>
      </div>

      <Table<ProductData>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{
          current: params.pageNum,
          pageSize: params.pageSize,
          total,
          showSizeChanger: true,
          onChange: (page, pageSize) => setParams({ pageNum: page, pageSize }),
        }}
        scroll={{ x: 960 }}
      />

      {dialogOpen.visible && (
        <ProductDialog
          open={dialogOpen.visible}
          product={dialogOpen.product}
          onCancel={() => setDialogOpen({ visible: false })}
          onOk={() => {
            setDialogOpen({ visible: false })
            fetchList()
          }}
        />
      )}

      {specOpen.visible && (
        <SpecificationManager
          open={specOpen.visible}
          product={specOpen.product!}
          onCancel={() => setSpecOpen({ visible: false })}
          onOk={() => {
            setSpecOpen({ visible: false })
            fetchList()
          }}
        />
      )}
      {modalContextHolder}
    </div>
  )
}
