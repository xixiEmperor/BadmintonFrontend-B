import type { ReactNode } from 'react'
import type { BreadcrumbItemType } from 'antd/es/breadcrumb/Breadcrumb'

export interface BreadcrumbConfig extends BreadcrumbItemType {
    title: ReactNode,
    key: string
}
