export interface periodParams {
    period?: string
}

export interface revenueTrendParams extends periodParams {
    type?: string
}

export interface limitParams extends periodParams {
    limit?: number
}