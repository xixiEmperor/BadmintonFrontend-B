import { Button, Dropdown } from "antd"
import type { MenuProps } from "antd"
import Card from "../../shared/Card"

export default function StateManage() {
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
                    <Button variant="solid" color="danger">删除场地</Button>
                </div>
            </div>
            <hr className="mb-4"/>
            <Card 
                type="venue" 
                content={{
                    venueName: '场地1',
                    venueOrder: '1',
                    position: '1',
                    state: 1,
                    price: '100'
                }} 
            />
        </div>
    )
}