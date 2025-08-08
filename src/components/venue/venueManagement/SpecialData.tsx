import { Button } from "antd"

export default function SpecialData() {
    return (
        <div className="w-full border-2 border-gray-300 rounded-md p-4 bg-white mb-4">
            <div className="w-full flex justify-between items-center py-4">
                <h2 className="text-xl font-bold">场地状态管理</h2>
                <div className="flex items-center gap-6">
                    <Button variant="solid" color="blue">添加场地</Button>
                    <Button variant="solid" color="danger">删除场地</Button>
                </div>
            </div>
            <hr className="mb-4"/>
        </div>
    )
}