/**
 * 场地新增/编辑表单
 */
import { useEffect, useMemo, useState } from 'react'
import { Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { useVenueStore } from '@/store'
import type { addVenueData, updateVenueData } from '@/types/apiTypes/venueManagement'

type VenueFormValues = addVenueData

const VENUE_TYPES = [
  { label: '羽毛球场', value: 1 },
  { label: '篮球场', value: 2 },
  { label: '网球场', value: 3 },
]

interface VenueFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<VenueFormValues> & { id?: number }
  onCancel: () => void
  onSuccess?: () => void
}

export default function VenueFormModal({ open, mode, initialValues, onCancel, onSuccess }: VenueFormModalProps) {
  const [form] = Form.useForm<VenueFormValues>()
  const [confirmLoading, setConfirmLoading] = useState(false)

  const addVenue = useVenueStore((s) => s.addVenue)
  const updateVenue = useVenueStore((s) => s.updateVenue)

  const title = useMemo(() => (mode === 'create' ? '添加场地' : '编辑场地'), [mode])

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (initialValues) {
        form.setFieldsValue({
          name: initialValues.name ?? '',
          location: initialValues.location ?? '',
          description: initialValues.description ?? '',
          pricePerHour: initialValues.pricePerHour ?? 0,
          type: initialValues.type ?? 1,
          status: (initialValues.status as 0 | 1) ?? 1,
        })
      } else {
        form.setFieldsValue({ name: '', location: '', description: '', pricePerHour: 0, type: 1, status: 1 })
      }
    }
  }, [open, form, initialValues])

  // 提交表单
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      if (mode === 'create') {
        await addVenue(values as addVenueData)
        message.success('新增成功')
      } else if (mode === 'edit' && initialValues?.id != null) {
        const payload: updateVenueData = {
          name: values.name,
          location: values.location,
          description: values.description,
          pricePerHour: values.pricePerHour,
          type: values.type,
          status: values.status,
        }
        await updateVenue(initialValues.id, payload)
        message.success('更新成功')
      }
      onSuccess?.()
    } catch {
      // 校验失败或请求错误（忽略具体错误，统一交由 Form 校验与请求层处理）
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={title}
      onOk={handleOk}
      onCancel={onCancel}
      okText={mode === 'create' ? '确认' : '保存'}
      cancelText="取消"
      confirmLoading={confirmLoading}
      destroyOnClose
      maskClosable={false}
      okButtonProps={{ type: 'primary' }}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="场地名称" rules={[{ required: true, message: '请输入场地名称' }]}>
          <Input placeholder="请输入场地名称" />
        </Form.Item>
        <Form.Item name="location" label="场地位置" rules={[{ required: true, message: '请输入场地位置' }]}>
          <Input placeholder="请输入场地位置" />
        </Form.Item>
        <Form.Item name="description" label="场地描述">
          <Input.TextArea placeholder="请输入场地描述" rows={3} />
        </Form.Item>
        <Form.Item name="pricePerHour" label="场地价格(元/小时)" rules={[{ required: true, message: '请输入价格' }]}>
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="type" label="场地类型" rules={[{ required: true }]} initialValue={1}>
          <Select options={VENUE_TYPES} />
        </Form.Item>
        <Form.Item name="status" label="场地状态" rules={[{ required: true }]} initialValue={1}>
          <Select
            options={[
              { label: '可用', value: 1 },
              { label: '不可用', value: 0 },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}


