/**
 * 商品规格管理
 * - 录入规格维度，生成笛卡尔积组合，批量创建规格
 * - 内置并发任务队列，支持暂停/恢复/停止/失败重试
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Input, Button, Space, Table, InputNumber, message, Tag, Divider, Progress } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ProductData, ProductSpecOption, ProductSpecification, AddSpecificationData, UpdateSpecificationData } from '@/types/apiTypes/products'
import { getProductSpecOptions, addProductSpecification, getProductSpecifications, updateSpecification, deleteSpecification } from '@/api/Shop/productsApi'
import { createSpecificationTaskQueue, TaskQueue } from '@/utils/TaskQueue'

interface SpecificationManagerProps {
  open: boolean
  product: ProductData
  onOk: () => void
  onCancel: () => void
}

type SpecKV = { key: string; values: string }
type GeneratedRow = { id: string; specifications: Record<string, string>; priceAdjustment: number; stock: number }

export default function SpecificationManager({ open, product, onOk, onCancel }: SpecificationManagerProps) {
  const [modal, modalContextHolder] = Modal.useModal()
  const [options, setOptions] = useState<ProductSpecOption[]>([])
  const [specKVs, setSpecKVs] = useState<SpecKV[]>([])
  const [rows, setRows] = useState<GeneratedRow[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<ProductSpecification[]>([])
  const [progressText, setProgressText] = useState<string>('')
  const [percent, setPercent] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [hasStopped, setHasStopped] = useState<boolean>(false)
  const queueRef = useRef<TaskQueue | null>(null)
  const rowMapRef = useRef<Map<string, GeneratedRow>>(new Map())

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        setLoading(true)
        const [optsRes, listRes] = await Promise.all([
          getProductSpecOptions(product.id!),
          getProductSpecifications(product.id!),
        ])
        const opts = ((optsRes as any)?.data ?? optsRes) as ProductSpecOption[]
        const l = ((listRes as any)?.data ?? listRes) as ProductSpecification[]
        setOptions(opts)
        setList(l)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    })()
  }, [open, product?.id])

  const columns = useMemo<ColumnsType<GeneratedRow>>(
    () => [
      {
        title: '规格组合',
        dataIndex: 'specifications',
        render: (specs) => (
          <Space wrap>
            {Object.entries(specs as Record<string, string>).map(([k, v]) => (
              <Tag key={k}>{k}:{v}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '价格调整',
        dataIndex: 'priceAdjustment',
        width: 140,
        render: (_, record, idx) => (
          <InputNumber
            value={record.priceAdjustment}
            onChange={(v) => updateRow(idx, { priceAdjustment: Number(v || 0) })}
            precision={2}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '库存',
        dataIndex: 'stock',
        width: 120,
        render: (_, record, idx) => (
          <InputNumber
            value={record.stock}
            onChange={(v) => updateRow(idx, { stock: Number(v || 0) })}
            precision={0}
            min={0}
            style={{ width: '100%' }}
          />
        ),
      },
    ],
    []
  )

  const existColumns = useMemo<ColumnsType<ProductSpecification>>(
    () => [
      {
        title: '规格',
        dataIndex: 'specifications',
        render: (specs) => (
          <Space wrap>
            {Object.entries(specs as Record<string, string>).map(([k, v]) => (
              <Tag key={k} color="default">{k}:{v}</Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '价格调整',
        dataIndex: 'priceAdjustment',
        width: 160,
        render: (v: number, r) => (
          <InputNumber
            value={v}
            precision={2}
            onBlur={async (evt) => {
              const next = Number((evt.target as HTMLInputElement).value || 0)
              if (next === v) return
              try {
                await updateSpecification(r.id!, { priceAdjustment: next } as UpdateSpecificationData)
                setList((prev) => prev.map((i) => (i.id === r.id ? { ...i, priceAdjustment: next } : i)))
                message.success('已更新')
              } catch (err: any) {
                message.error(err?.message || '更新失败')
              }
            }}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '库存',
        dataIndex: 'stock',
        width: 140,
        render: (v: number, r) => (
          <InputNumber
            value={v}
            precision={0}
            min={0}
            onBlur={async (evt) => {
              const next = Number((evt.target as HTMLInputElement).value || 0)
              if (next === v) return
              try {
                await updateSpecification(r.id!, { stock: next } as UpdateSpecificationData)
                setList((prev) => prev.map((i) => (i.id === r.id ? { ...i, stock: next } : i)))
                message.success('已更新')
              } catch (err: any) {
                message.error(err?.message || '更新失败')
              }
            }}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (s: number) => (s === 1 ? <Tag color="green">启用</Tag> : <Tag>禁用</Tag>),
      },
      {
        title: '操作',
        width: 160,
        render: (_, r) => (
          <Space>
            <Button type="link" danger onClick={() => {
              modal.confirm({
                title: '删除该规格？',
                okText: '确认',
                cancelText: '取消',
                okType: 'primary',
                onOk: () => handleDelete(r.id!),
              })
            }}>删除</Button>
          </Space>
        ),
      },
    ],
    []
  )

  const updateRow = (index: number, part: Partial<GeneratedRow>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...part } : r)))
  }

  const handleGenerate = () => {
    // 解析输入为规格映射，支持中英文逗号、空白、分号、顿号分隔，并去重
    const specMap: Record<string, string[]> = {}
    specKVs.forEach(({ key, values }) => {
      const cleanKey = key.trim()
      const parts = values
        .split(/[，,、;；\s]+/)
        .map((v) => v.trim())
        .filter(Boolean)
      const uniqueVals = Array.from(new Set(parts))
      if (cleanKey && uniqueVals.length) specMap[cleanKey] = uniqueVals
    })
    const keys = Object.keys(specMap)
    if (!keys.length) {
      return message.warning('请先填写至少一组规格与可选值')
    }
    // 全排列（笛卡尔积）
    const combine = (idx: number, acc: Record<string, string>): GeneratedRow[] => {
      if (idx === keys.length) {
        return [{ id: JSON.stringify(acc), specifications: acc, priceAdjustment: 0, stock: 0 }]
      }
      const key = keys[idx]
      const result: GeneratedRow[] = []
      for (const val of specMap[key]) {
        result.push(...combine(idx + 1, { ...acc, [key]: val }))
      }
      return result
    }
    let newRows = combine(0, {})
    // 过滤已存在的规格组合，避免重复
    if (list.length) {
      const exist = new Set(list.map((s) => JSON.stringify(s.specifications)))
      newRows = newRows.filter((r) => !exist.has(JSON.stringify(r.specifications)))
    }
    if (!newRows.length) {
      return message.info('没有新的规格组合可生成')
    }
    setRows(newRows)
  }

  const handleBatchSave = async () => {
    if (!rows.length) return message.warning('请先生成规格组合')
    setSaving(true)
    setHasStopped(false)
    try {
      // 构建任务队列
      const queue = createSpecificationTaskQueue({ maxConcurrent: 2, maxRetries: 3 })
      queueRef.current = queue
      rowMapRef.current = new Map(rows.map((r) => [r.id, r]))
      rows.forEach((row) => {
        const task = async () => {
          const payload: AddSpecificationData = {
            specifications: row.specifications,
            priceAdjustment: row.priceAdjustment,
            stock: row.stock,
            status: 1,
          }
          await addProductSpecification(product.id!, payload)
        }
        queue.addWithId(row.id, task)
      })

      const unsubscribe = queue.subscribe((p) => {
        const total = p.total || 1
        setPercent(Math.floor(((p.completed + p.failed) / total) * 100))
        setProgressText(`已完成 ${p.completed}/${total}，失败 ${p.failed}，进行中 ${p.running}`)
      })

      await queue.start()
      unsubscribe()

      message.success('批量保存完成')
      const listRes = await getProductSpecifications(product.id!)
      const l = ((listRes as any)?.data ?? listRes) as ProductSpecification[]
      setList(l)
      onOk()
    } catch (e: any) {
      if (hasStopped) {
        message.info('已停止')
      } else {
        message.error(e?.message || '批量保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteSpecification(id)
      setList((prev) => prev.filter((i) => i.id !== id))
      message.success('删除成功')
    } catch (e: any) {
      message.error(e?.message || '删除失败')
    }
  }

  const handlePause = () => {
    if (!queueRef.current) return
    queueRef.current.pause()
    setIsPaused(true)
  }
  const handleResume = () => {
    if (!queueRef.current) return
    queueRef.current.resume()
    setIsPaused(false)
  }
  const handleStop = () => {
    if (!queueRef.current) return
    queueRef.current.stop()
    setHasStopped(true)
  }
  const handleRetryFailed = async () => {
    const queue = queueRef.current
    if (!queue) return
    const failed = queue.getFailedTaskIds()
    if (!failed.length) return message.info('没有失败任务')
    failed.forEach((id) => {
      const row = rowMapRef.current.get(id)
      if (!row) return
      queue.addWithId(id, async () => {
        const payload: AddSpecificationData = {
          specifications: row.specifications,
          priceAdjustment: row.priceAdjustment,
          stock: row.stock,
          status: 1,
        }
        await addProductSpecification(product.id!, payload)
      })
    })
    setIsPaused(false)
    await queue.start()
  }

  return (
    <Modal
      title={`规格管理 - ${product.name}`}
      open={open}
      onCancel={onCancel}
      onOk={handleBatchSave}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ loading: saving }}
      width={960}
      destroyOnClose
      maskClosable={false}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Space wrap>
            {options.map((o) => (
              <Tag key={o.specName}>{o.specName}: {o.specValues.join(',')}</Tag>
            ))}
          </Space>
        </div>

        <Divider>规格选项 {'>'} 组合</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          {specKVs.map((kv, idx) => (
            <Space key={idx} wrap>
              <Input
                placeholder="规格名，如 颜色"
                value={kv.key}
                onChange={(evt) => setSpecKVs((prev) => prev.map((i, j) => (j === idx ? { ...i, key: evt.target.value } : i)))}
                style={{ width: 160 }}
              />
              <Input
                placeholder="可选值，英文逗号分隔，如 红,蓝"
                value={kv.values}
                onChange={(evt) => setSpecKVs((prev) => prev.map((i, j) => (j === idx ? { ...i, values: evt.target.value } : i)))}
                style={{ width: 360 }}
              />
              <Button danger onClick={() => setSpecKVs((prev) => prev.filter((_, j) => j !== idx))}>删除</Button>
            </Space>
          ))}
          <Space>
            <Button onClick={() => setSpecKVs((prev) => [...prev, { key: '', values: '' }])}>新增规格</Button>
            <Button type="primary" onClick={handleGenerate}>生成组合</Button>
          </Space>
        </Space>

        <Table<GeneratedRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 800 }}
        />

        {saving && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span>{progressText}</span>
              <Space>
                {!isPaused ? (
                  <Button onClick={handlePause}>暂停</Button>
                ) : (
                  <Button type="primary" onClick={handleResume}>恢复</Button>
                )}
                <Button danger onClick={handleStop}>停止</Button>
                <Button onClick={handleRetryFailed}>重试失败</Button>
              </Space>
            </div>
            <Progress percent={percent} status={hasStopped ? 'exception' : undefined} />
          </div>
        )}

        <Divider>已有关联规格</Divider>
        <Table<ProductSpecification>
          rowKey="id"
          columns={existColumns}
          dataSource={list}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Space>
      {modalContextHolder}
    </Modal>
  )
}


