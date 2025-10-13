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
    // 1. 解析用户输入的规格数据，构建规格映射表
    const specMap: Record<string, string[]> = {}
    
    // 遍历每一行规格输入（每行包含规格名和可选值）
    specKVs.forEach(({ key, values }) => {
      // 清理规格名，移除首尾空白字符
      const cleanKey = key.trim()
      
      // 2. 解析可选值字符串，支持多种分隔符
      // 使用正则表达式分割：支持中文逗号、英文逗号、顿号、分号、空白字符
      const parts = values
        .split(/[，,、;；\s]+/)  // 正则匹配多种分隔符
        .map((v) => v.trim())    // 清理每个值的首尾空白
        .filter(Boolean)         // 过滤空字符串
      
      // 3. 去除重复值，确保每个规格值的唯一性
      const uniqueVals = Array.from(new Set(parts))
      
      // 4. 只有规格名和可选值都不为空时，才添加到映射表
      if (cleanKey && uniqueVals.length) {
        specMap[cleanKey] = uniqueVals
      }
    })
    
    // 5. 检查是否有有效的规格数据
    const keys = Object.keys(specMap)
    if (!keys.length) {
      return message.warning('请先填写至少一组规格与可选值')
    }
    
    // 6. 生成笛卡尔积组合（递归算法）
    // 这个函数会生成所有可能的规格组合
    const combine = (idx: number, acc: Record<string, string>): GeneratedRow[] => {
      // 递归终止条件：已经处理完所有规格维度
      if (idx === keys.length) {
        // 创建一个规格组合记录，使用JSON.stringify作为唯一ID
        return [{ 
          id: JSON.stringify(acc), 
          specifications: acc, 
          priceAdjustment: 0,  // 默认价格调整为0
          stock: 0             // 默认库存为0
        }]
      }
      
      // 7. 递归处理当前规格维度
      const key = keys[idx]  // 获取当前处理的规格名
      const result: GeneratedRow[] = []
      
      // 遍历当前规格的所有可选值
      for (const val of specMap[key]) {
        // 递归调用，处理下一个规格维度
        // 将当前规格值添加到累积对象中
        result.push(...combine(idx + 1, { ...acc, [key]: val }))
      }
      return result
    }
    
    // 8. 从第0个规格开始生成组合
    let newRows = combine(0, {})
    
    // 9. 过滤已存在的规格组合，避免重复创建
    if (list.length) {
      // 将现有规格组合转换为字符串集合，用于快速查重
      const exist = new Set(list.map((s) => JSON.stringify(s.specifications)))
      // 过滤掉已存在的组合
      newRows = newRows.filter((r) => !exist.has(JSON.stringify(r.specifications)))
    }
    
    // 10. 检查是否有新的组合可以生成
    if (!newRows.length) {
      return message.info('没有新的规格组合可生成')
    }
    
    // 11. 更新状态，显示生成的规格组合
    setRows(newRows)
  }

  const handleBatchSave = async () => {
    // 1. 检查是否有待保存的规格组合
    if (!rows.length) return message.warning('请先生成规格组合')
    
    // 2. 设置保存状态，防止重复提交
    setSaving(true)
    setHasStopped(false)
    
    try {
      // 3. 创建专用的任务队列，用于并发处理规格创建
      // 配置：最大并发2个任务，最多重试3次
      const queue = createSpecificationTaskQueue({ maxConcurrent: 2, maxRetries: 3 })
      queueRef.current = queue  // 保存队列引用，供暂停/恢复/停止操作使用
      
      // 4. 建立行数据的映射关系，用于失败重试时查找原始数据
      rowMapRef.current = new Map(rows.map((r) => [r.id, r]))
      
      // 5. 为每个规格组合创建异步任务并添加到队列
      rows.forEach((row) => {
        // 定义单个规格创建的异步任务
        const task = async () => {
          // 构建API请求的数据结构
          const payload: AddSpecificationData = {
            specifications: row.specifications,  // 规格组合，如 {"颜色": "红色", "尺寸": "L"}
            priceAdjustment: row.priceAdjustment, // 价格调整
            stock: row.stock,                     // 库存数量
            status: 1,                           // 状态：1=启用
          }
          // 调用API创建规格
          await addProductSpecification(product.id!, payload)
        }
        // 将任务添加到队列，使用行ID作为任务标识
        queue.addWithId(row.id, task)
      })

      // 6. 订阅队列进度更新，实时显示保存进度
      const unsubscribe = queue.subscribe((p) => {
        const total = p.total || 1  // 总任务数，防止除零
        // 计算完成百分比（包括成功和失败的任务）
        setPercent(Math.floor(((p.completed + p.failed) / total) * 100))
        // 更新进度文本显示
        setProgressText(`已完成 ${p.completed}/${total}，失败 ${p.failed}，进行中 ${p.running}`)
      })

      // 7. 启动队列执行，等待所有任务完成
      await queue.start()
      
      // 8. 取消进度订阅，避免内存泄漏
      unsubscribe()

      // 9. 所有任务完成后的后续处理
      message.success('批量保存完成')
      
      // 10. 重新获取最新的规格列表，确保UI数据同步
      const listRes = await getProductSpecifications(product.id!)
      const l = ((listRes as any)?.data ?? listRes) as ProductSpecification[]
      setList(l)
      
      // 11. 通知父组件保存完成
      onOk()
    } catch (e: any) {
      // 12. 错误处理：区分用户主动停止和其他错误
      if (hasStopped) {
        message.info('已停止')  // 用户主动停止的提示
      } else {
        message.error(e?.message || '批量保存失败')  // 其他错误的提示
      }
    } finally {
      // 13. 无论成功还是失败，都要重置保存状态
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
      const row = rowMapRef.current.get(String(id))
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


