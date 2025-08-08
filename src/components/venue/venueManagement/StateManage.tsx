import { Button, Dropdown } from "antd"
import type { MenuProps } from "antd"
import Card from "../../shared/Card"
import { useEffect } from 'react'
import { useVenueStore } from "@/store"

export default function StateManage() {
    const venueList = useVenueStore((s) => s.venueList)
    const fetchVenueList = useVenueStore((s) => s.fetchVenueList)

    useEffect(() => {
        fetchVenueList()
    }, [fetchVenueList])

    console.log(venueList)
    const items: MenuProps['items'] = [
        {
            key: '1',
            label: '可用场地',
        },
        {
            key: '2',
            label: '不可用场地'
        },
        {
            key: '3',
            label: '全部场地'
        }
    ]
    return (
        <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
            <div className="w-full flex justify-between items-center py-4">
                <h2 className="text-xl font-bold">场地状态管理</h2>
                <div className="flex items-center gap-6">
                    <Dropdown menu={{ items }} trigger={['click']}>
                        <Button>场地状态</Button>
                    </Dropdown>
                    <Button variant="solid" color="blue">添加场地</Button>
                    <Button variant="solid" color="danger">批量操作</Button>
                </div>
            </div>
            <hr className="mb-4"/>
            <div className="flex flex-wrap gap-8">
                {venueList.map((venue) => (
                    <Card 
                        type="venue" 
                        key={venue.id}
                        content={venue} 
                    />
                ))}
            </div>
        </div>
    )
}