/**
 * 场地详情弹窗
 * - 从缓存读取当前场地详情
 */
import { Descriptions, Modal, Tag } from 'antd'
import { useVenueStore } from '@/store'

interface VenueDetailModalProps {
  open: boolean
  venueId?: number
  onCancel: () => void
  onEdit?: (id: number) => void
}

export default function VenueDetailModal({ open, venueId, onCancel, onEdit }: VenueDetailModalProps) {
  const getVenueByIdFromCache = useVenueStore((s) => s.getVenueByIdFromCache)
  const venue = venueId != null ? getVenueByIdFromCache(venueId) : undefined

  return (
    <Modal title="场地详情" open={open} onCancel={onCancel} footer={null} destroyOnClose>
      {venue && (
        <>
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="场地名称">{venue.name}</Descriptions.Item>
            <Descriptions.Item label="场地编号">{`V${venue.id}`}</Descriptions.Item>
            <Descriptions.Item label="场地状态">
              {venue.status === 1 ? <Tag color="green">可用</Tag> : <Tag color="red">不可用</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="场地价格">¥{venue.pricePerHour}/小时</Descriptions.Item>
            <Descriptions.Item label="场地类型" span={2}>羽毛球场</Descriptions.Item>
            <Descriptions.Item label="场地位置" span={2}>{venue.location}</Descriptions.Item>
          </Descriptions>
          <div className="mt-4 flex justify-end">
            <button className='btn btn-info btn-sm text-white' onClick={() => venueId && onEdit?.(venueId)}>
              编辑
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}


