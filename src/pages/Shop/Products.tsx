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
  // 1. 初始化Modal实例和加载状态
  const [modal, modalContextHolder] = Modal.useModal()  // 用于确认对话框
  const [loading, setLoading] = useState(false)  // 控制表格的加载状态

  // 2. 从商品store中获取状态和方法
  // 使用解构赋值重命名list为data，保持组件内命名一致性
  const {
    list: data,        // 商品列表数据
    total,             // 商品总数（用于分页）
    params,            // 查询参数（分页、筛选、排序）
    categories,        // 商品分类列表
    setParams,         // 更新查询参数的方法
    fetchList,         // 获取商品列表的异步方法
    fetchCategories,   // 获取分类列表的异步方法
  } = useProductStore()

  // 3. 控制商品编辑对话框的状态
  const [dialogOpen, setDialogOpen] = useState<{
    visible: boolean    // 对话框是否可见
    product?: ProductData  // 要编辑的商品数据（新增时为undefined）
  }>({ visible: false })

  // 4. 控制规格管理对话框的状态
  const [specOpen, setSpecOpen] = useState<{
    visible: boolean    // 对话框是否可见
    product?: ProductData  // 要管理规格的商品数据
  }>({ visible: false })

  // 5. 组件挂载时的初始化逻辑
  useEffect(() => {
    // 异步获取分类数据，失败时静默处理（不影响主要功能）
    fetchCategories().catch(() => {})
    
    // 立即执行的异步函数：获取商品列表
    ;(async () => {
      setLoading(true)  // 开始加载
      try {
        await fetchList()  // 调用store方法获取商品数据
      } finally {
        setLoading(false)  // 无论成功还是失败都要停止加载状态
      }
    })()
  }, [fetchCategories, fetchList])  // 只在挂载时执行一次

  // 6. 监听查询参数变化，自动重新获取数据
  useEffect(() => {
    setLoading(true)  // 开始加载
    fetchList()
      .catch((e) => {
        // 提取错误信息并显示给用户
        const errorMsg = (e as { message?: string })?.message || '获取商品列表失败'
        message.error(errorMsg)
      })
      .finally(() => setLoading(false))  // 停止加载状态
  }, [
    // 依赖数组：当这些参数变化时重新获取数据
    params.pageNum,     // 页码变化
    params.pageSize,    // 每页大小变化
    params.keyword,     // 搜索关键词变化
    params.categoryId,  // 分类筛选变化
    params.orderBy,     // 排序方式变化
    fetchList           // store方法引用
  ])

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

  // 7. 删除商品的处理函数
  const handleDelete = async (id: number) => {
    try {
      // 调用API删除商品
      await deleteProduct(id)
      message.success('删除成功')
      // 删除成功后重新获取列表，确保UI同步
      fetchList()
    } catch (e: any) {
      // 删除失败时显示错误信息
      message.error(e?.message || '删除失败')
    }
  }
  
  // 8. 商品上架的处理函数
  const handleOnSale = async (id: number) => {
    try {
      // 调用API将商品状态设置为上架
      await onSaleProduct(id)
      message.success('已上架')
      // 上架成功后重新获取列表，更新商品状态显示
      fetchList()
    } catch (e: any) {
      // 上架失败时显示错误信息
      message.error(e?.message || '操作失败')
    }
  }
  
  // 9. 商品下架的处理函数
  const handleOffSale = async (id: number) => {
    try {
      // 调用API将商品状态设置为下架
      await offSaleProduct(id)
      message.success('已下架')
      // 下架成功后重新获取列表，更新商品状态显示
      fetchList()
    } catch (e: any) {
      // 下架失败时显示错误信息
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
