/**
 * 批量状态修改弹窗
 * - 批量设置场地可用/不可用
 */
import { Modal, Checkbox, Radio, message } from 'antd'
import { useMemo, useState } from 'react'
import { useVenueStore } from '@/store'

interface BatchStatusModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: () => void
}

export default function BatchStatusModal({ open, onCancel, onSuccess }: BatchStatusModalProps) {
  const venueList = useVenueStore((s) => s.venueList)
  const updateVenueStatus = useVenueStore((s) => s.updateVenueStatus)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [nextStatus, setNextStatus] = useState<0 | 1>(1)

  const plainOptions = useMemo(() => venueList.map((v) => ({ label: v.name, value: v.id })), [venueList])

  const handleOk = async () => {
    if (selectedIds.length === 0) {
      message.warning('请至少选择一个场地')
      return
    }
    await Promise.all(selectedIds.map((id) => updateVenueStatus(id, nextStatus)))
    message.success('批量更新成功')
    onSuccess?.()
  }

  return (
    <Modal title="批量操作" open={open} onCancel={onCancel} onOk={handleOk} destroyOnClose okText="确认" cancelText="取消">
      <div className="mb-4">
        <Radio.Group value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
          <Radio value={1}>批量设为可用</Radio>
          <Radio value={0}>批量设为不可用</Radio>
        </Radio.Group>
      </div>
      <Checkbox.Group
        options={plainOptions}
        value={selectedIds}
        onChange={(values) => setSelectedIds(values as number[])}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
      />
    </Modal>
  )
}


