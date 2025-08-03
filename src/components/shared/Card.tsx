import { ReactNode } from 'react'

interface StatisticsCardProps {
  title: string
  value: number
  icon?: ReactNode
  increment?: number
}

interface VenueCardProps {
  title: string
  value: number
  increment?: number
}

interface EchartsCardProps {
  title: string
  value: number
  increment?: number
}

type CardChildren = (StatisticsCardProps | VenueCardProps | EchartsCardProps)

interface CardProps {
  type: 'statistics' | 'venue' | 'echarts'
  content: CardChildren
  className?: string
}

export default function Card({ type, content, className }: CardProps) {
    switch (type) {
      case 'statistics': {
        const { title, value, increment, icon } = content as StatisticsCardProps
        return (
          <div className={`w-[300px] h-[150px] rounded-md bg-gradient-to-br from-gray-200 to-gray-300 p-5 flex justify-start items-center gap-12 shadow-md ${className || ''}`}>
            {icon && (
              <div className='w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center'>
                {icon}
              </div>
            )}
            <div className='flex flex-col items-center justify-between'>
              <p className='text-sm text-gray-500'>{title}</p>
              <h3 className='text-2xl font-bold'>{value}</h3>
              {increment && (
                <p className='text-sm text-green-500'>{increment}</p>
              )}
            </div>
          </div>
        )
      }
      // case 'venue': {
      //   const { title, value, increment } = content as VenueCardProps
      // }
    }
}
