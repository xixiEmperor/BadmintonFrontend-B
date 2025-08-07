export interface periodParams {
    period?: string
}

export interface revenueTrendParams extends periodParams {
    type?: string
}

export interface limitParams extends periodParams {
    limit?: number
}

export type chartParams = periodParams | revenueTrendParams | limitParams

// API返回的图表数据结构
export interface ChartApiResponse {
    title: string
    type: 'pie' | 'bar' | 'line'
    data: number[] | { name: string, value: number }[]
    labels?: string[] | number[]
}