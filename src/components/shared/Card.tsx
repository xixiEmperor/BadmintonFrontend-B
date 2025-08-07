import { ReactNode } from 'react'

interface StatisticsCardProps {
  title: string
  value: number
  icon?: ReactNode
  increment?: number
  incrementDesc?: string
}

interface VenueCardProps {
  venueName: string
  venueOrder: string
  position: string
  state: 1 | 2 // 1: 可用 2: 占用
  price: string
}

interface OrdersCardProps {
  title: string
  value: number
}

type CardChildren = (StatisticsCardProps | VenueCardProps | OrdersCardProps)

interface CardProps {
  type: 'statistics' | 'venue' | 'orders'
  content: CardChildren
  className?: string
}

export default function Card({ type, content, className }: CardProps) {
    switch (type) {
      case 'statistics': {
        const { title, value, increment, icon, incrementDesc } = content as StatisticsCardProps
        return (
          <div className={`w-[20vw] h-[150px] rounded-lg bg-white p-6 flex justify-start items-center gap-8 shadow-lg border border-gray-400 hover:shadow-md transition-shadow ${className || ''}`}>
            {icon && (
              <div className='w-[50px] h-[50px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600'>
                {icon}
              </div>
            )}
            <div className='flex flex-col items-start justify-center flex-1'>
              <p className='text-gray-600 text-sm mb-1'>{title}</p>
              <h3 className='text-4xl font-semibold text-gray-900'>{value}</h3>
              <p className='text-sm text-green-600 mt-1'>{incrementDesc}:{increment}</p>
            </div>
          </div>
        )
      }

      case 'venue': {
        const { venueName, venueOrder, position, state, price } = content as VenueCardProps
        return (
          <div className={`relative w-[24vw] min-h-[150px] rounded-lg bg-white p-6 flex justify-start items-center gap-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className || ''}`}>
            {/* 状态开关按钮  */}
            <div className='absolute top-[20px] right-[60px]'>  
              <label className='cursor-pointer flex items-center gap-2'>
                <span className={`${state === 2 ? 'text-[#989ca2]' : 'text-[#00b6ff]'}`}>不可用</span>
                <input type="checkbox" defaultChecked className="toggle toggle-info" />
                <span className={`${state === 1 ? 'text-[#00b6ff]' : 'text-[#989ca2]'}`}>可用</span>
              </label>
            </div>

            <div className='flex flex-col items-start justify-center flex-1 text-black'>

              {/* 场馆信息 */}
              <h3 className='text-black text-lg font-700 mb-1'>{venueName}</h3>

              {/* 后期用map返回p标签 */}
              <p className='text-sm font-semibold text-gray-600 mt-2'>场地编号：{venueOrder}</p>
              <p className='text-sm font-semibold text-gray-600 mt-2'>场地位置：{position}</p>
              <p className='text-sm font-semibold text-gray-600 mt-2'>
                状态：{
                  state === 1 ? (
                    <div className='badge badge-info text-white'>可用</div>
                  ) : (
                    <div className='badge badge-error text-white'>不可用</div>
                  )
                }
              </p>
              <p className='text-sm font-semibold text-gray-600 mt-2'>价格:{price}</p>

              {/* 按钮组 */}
              <div className='w-3/4 flex items-center justify-between mt-4'>
                <button className='btn btn-sm btn-outline'>
                  查看详情
                </button>
                <button className='btn btn-info btn-sm text-white'>
                  编辑
                </button>
                <button className='btn btn-error btn-sm text-white'>
                  删除
                </button>
              </div>
            </div>
          </div>
        )
      }

      case 'orders': {
        const { title, value } = content as OrdersCardProps
        return (
          <div className={`w-[18vw] h-[150px] rounded-lg bg-white p-6 flex flex-col justify-center items-center gap-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className || ''}`}>
            <h3 
              className='text-black text-[24px] font-700 mb-1'
              style={{ letterSpacing: '2px' }}
            >
              {value}
            </h3>
            <p className='text-[16px] font-semibold text-gray-600 mt-2'>{title}</p>
          </div>
        )
      }

      default:
        return null
    }
}
