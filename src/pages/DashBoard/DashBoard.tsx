import Card from '@/components/shared/Card'
import { UserOutlined } from '@ant-design/icons'

export default function DashBoard() {
    return (
        <>
            <Card 
                type='statistics'
                content={{
                title: '订单量',
                value: 100,
                icon: <UserOutlined />,
                increment: 10,
            }}
            />
            <Card 
                type='venue'
                content={{
                    title: '订单量',
                    value: 100,
                    increment: 10,
                    icon: <UserOutlined />,
                }}
            />
        </>
    )
}
