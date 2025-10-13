/**
 * 特殊日期编辑弹窗
 * - 创建/编辑 特殊日期配置
 */
import { useEffect, useState } from 'react'
import { DatePicker, Form, Input, Modal, Radio, Select, TimePicker, message } from 'antd'
import dayjs from 'dayjs'
import { useSpecialDateStore } from '@/store'

interface Props {
  open: boolean
  editId?: number
  onClose: () => void
}

export default function SpecialDateFormModal({ open, editId, onClose }: Props) {
  const [form] = Form.useForm()
  const { createItem, updateItem, fetchDetail } = useSpecialDateStore()
  const mode: 'create' | 'edit' = editId ? 'edit' : 'create'
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      form.resetFields()
      if (editId) {
        ;(async () => {
          const detail = await fetchDetail(editId)
          if (detail) {
            form.setFieldsValue({
              configName: detail.configName,
              specialDate: dayjs(detail.specialDate),
              configType: detail.configType,
              affectedVenueIds: detail.affectedVenueIds,
              startTime: detail.startTime ? dayjs(detail.startTime, 'HH:mm') : undefined,
              endTime: detail.endTime ? dayjs(detail.endTime, 'HH:mm') : undefined,
              venueStatus: detail.venueStatus,
              bookable: detail.bookable,
              enabled: detail.enabled ?? 1,
              description: detail.description,
            })
          }
        })()
      } else {
        form.setFieldsValue({ configType: 1, venueStatus: 4, bookable: 0, enabled: 1 })
      }
    }
  }, [open, editId, form, fetchDetail])

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        configName: values.configName,
        specialDate: values.specialDate.format('YYYY-MM-DD'),
        configType: values.configType,
        affectedVenueIds: values.affectedVenueIds,
        startTime: values.startTime ? values.startTime.format('HH:mm') : undefined,
        endTime: values.endTime ? values.endTime.format('HH:mm') : undefined,
        venueStatus: values.venueStatus,
        bookable: values.bookable,
        description: values.description,
        enabled: values.enabled,
      }
      setLoading(true)
      if (mode === 'create') {
        await createItem(payload as any)
        message.success('创建成功')
      } else if (editId) {
        await updateItem(editId, payload as any)
        message.success('更新成功')
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} title={mode === 'create' ? '添加特殊日期' : '编辑特殊日期'} onOk={onOk} onCancel={onClose} confirmLoading={loading} destroyOnClose okText="确认" cancelText="取消">
      <Form form={form} layout="vertical">
        <Form.Item name="configName" label="配置名称" rules={[{ required: true, message: '请输入配置名称' }]}>
          <Input placeholder="请输入配置名称" />
        </Form.Item>
        <Form.Item name="specialDate" label="特殊日期" rules={[{ required: true, message: '请选择日期' }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="configType" label="配置类型" rules={[{ required: true }]} initialValue={1}>
          <Select
            options={[
              { label: '节假日', value: 1 },
              { label: '维护日', value: 2 },
              { label: '特殊开放日', value: 3 },
            ]}
          />
        </Form.Item>
        <Form.Item name="affectedVenueIds" label="影响场地">
          <Input placeholder="场地ID，多个用逗号分隔，留空表示全部场地" />
        </Form.Item>
        <Form.Item name="startTime" label="开始时间">
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="endTime" label="结束时间">
          <TimePicker format="HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="venueStatus" label="场地状态" rules={[{ required: true }]} initialValue={4}>
          <Select
            options={[
              { label: '空闲中', value: 1 },
              { label: '使用中', value: 2 },
              { label: '维护中', value: 4 },
            ]}
          />
        </Form.Item>
        <Form.Item name="bookable" label="是否可预约" rules={[{ required: true }]} initialValue={0}>
          <Radio.Group>
            <Radio value={1}>可预约</Radio>
            <Radio value={0}>不可预约</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="enabled" label="是否启用" rules={[{ required: true }]} initialValue={1}>
          <Radio.Group>
            <Radio value={1}>启用</Radio>
            <Radio value={0}>禁用</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="description" label="配置描述">
          <Input.TextArea placeholder="请输入配置描述" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}


