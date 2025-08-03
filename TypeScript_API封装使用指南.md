# TypeScript API封装使用指南

## 1. 基本理论

### 1.1 类型安全的重要性

TypeScript与API封装结合使用的核心优势在于**类型安全**：

- **编译时错误检查**：在开发阶段就能发现类型错误
- **智能提示**：IDE能提供准确的代码补全和参数提示
- **重构安全**：修改接口时能自动检测所有相关调用
- **文档化**：类型定义本身就是最好的文档

### 1.2 分层架构设计

```
类型定义层 (types/api.ts)
    ↓
API封装层 (api/dashBoardApi.tsx)
    ↓
业务逻辑层 (components/hooks)
    ↓
视图层 (React组件)
```

## 2. 类型定义最佳实践

### 2.1 命名空间组织

```typescript
// 使用命名空间避免类型名冲突
export namespace DashboardAPI {
  export interface OverviewData {
    totalUsers: number;
    totalReservations: number;
  }
  
  export interface UserRegistrationTrendParams {
    period?: PeriodType;
  }
}
```

**优势：**
- 避免全局类型污染
- 逻辑分组，便于维护
- 清晰的类型层次结构

### 2.2 泛型响应包装

```typescript
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
```

**优势：**
- 统一响应格式
- 保持数据类型的精确性
- 便于错误处理

### 2.3 联合类型约束

```typescript
export type PeriodType = '7d' | '30d' | '90d';
export type RevenueType = 'all' | 'reservation' | 'mall';
```

**优势：**
- 限制参数值范围
- 防止拼写错误
- 提供智能提示

## 3. API函数设计模式

### 3.1 函数签名设计

```typescript
// ❌ 不推荐：类型不明确
export function getUserRegistrationTrend(params = {}) {
  return request({ url: '/api/...', params })
}

// ✅ 推荐：完整类型定义
export function getUserRegistrationTrend(
  params: DashboardAPI.UserRegistrationTrendParams = {}
): Promise<ApiResponse<DashboardAPI.UserRegistrationTrendData>> {
  return request({ url: '/api/...', params })
}
```

### 3.2 参数处理策略

```typescript
// 可选参数使用默认值
export function getPopularProducts(
  params: DashboardAPI.PopularProductsParams = {}
) {
  // 内部可以安全访问 params.limit
  return request({ url: '/api/...', params })
}
```

## 4. 实际使用示例

### 4.1 在React组件中使用

```typescript
import { getDashboardOverview, getUserRegistrationTrend } from '@/api/DashBoard/dashBoardApi'
import type { DashboardAPI } from '@/types/api'

const DashboardComponent: React.FC = () => {
  const [overview, setOverview] = useState<DashboardAPI.OverviewData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 类型安全的API调用
      const response = await getDashboardOverview()
      setOverview(response.data) // response.data 自动推断为 OverviewData 类型
      
      // 带参数的API调用
      const trendResponse = await getUserRegistrationTrend({ 
        period: '30d' // 只能是 '7d' | '30d' | '90d'
      })
      
      // 自动类型推断和智能提示
      console.log(trendResponse.data.trend) // 类型为 TrendDataPoint[]
      
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {overview && (
        <div>
          <p>总用户数: {overview.totalUsers}</p>
          <p>总预约数: {overview.totalReservations}</p>
          {/* IDE 会提供完整的属性提示 */}
        </div>
      )}
    </div>
  )
}
```

### 4.2 在自定义Hook中使用

```typescript
import { useState, useEffect } from 'react'
import { getUserRegistrationTrend } from '@/api/DashBoard/dashBoardApi'
import type { DashboardAPI } from '@/types/api'

interface UseUserTrendOptions {
  period?: DashboardAPI.UserRegistrationTrendParams['period']
  autoFetch?: boolean
}

export const useUserRegistrationTrend = (options: UseUserTrendOptions = {}) => {
  const { period = '30d', autoFetch = true } = options
  
  const [data, setData] = useState<DashboardAPI.UserRegistrationTrendData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrend = async (params?: DashboardAPI.UserRegistrationTrendParams) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getUserRegistrationTrend(params || { period })
      setData(response.data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchTrend()
    }
  }, [period, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchTrend
  }
}
```

### 4.3 错误处理模式

```typescript
import { getDashboardOverview } from '@/api/DashBoard/dashBoardApi'
import type { ApiResponse, DashboardAPI } from '@/types/api'

// 类型安全的错误处理
const handleApiCall = async () => {
  try {
    const response: ApiResponse<DashboardAPI.OverviewData> = await getDashboardOverview()
    
    // 业务逻辑处理
    if (response.code === 200) {
      return response.data
    } else {
      throw new Error(response.message)
    }
    
  } catch (error) {
    // 统一错误处理
    if (error instanceof Error) {
      console.error('API调用失败:', error.message)
    }
    throw error
  }
}
```

## 5. 高级使用技巧

### 5.1 条件类型和工具类型

```typescript
// 提取参数类型
type GetUserTrendParams = Parameters<typeof getUserRegistrationTrend>[0]

// 提取返回值类型
type GetUserTrendReturn = ReturnType<typeof getUserRegistrationTrend>

// 提取Promise内部类型
type GetUserTrendData = Awaited<ReturnType<typeof getUserRegistrationTrend>>['data']
```

### 5.2 API响应缓存

```typescript
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly TTL = 5 * 60 * 1000 // 5分钟

  async get<T>(
    key: string, 
    fetcher: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    
    return data
  }
}

const apiCache = new ApiCache()

// 使用缓存
const getCachedOverview = () => 
  apiCache.get('dashboard-overview', getDashboardOverview)
```

## 6. 最佳实践总结

### 6.1 DO's (推荐做法)

✅ **明确的类型定义**
```typescript
// 为每个API定义清晰的参数和返回类型
export function getRevenueTrend(
  params: DashboardAPI.RevenueTrendParams = {}
): Promise<ApiResponse<DashboardAPI.RevenueTrendData>>
```

✅ **使用命名空间组织类型**
```typescript
export namespace DashboardAPI {
  export interface RevenueTrendParams { /* ... */ }
  export interface RevenueTrendData { /* ... */ }
}
```

✅ **统一的错误处理**
```typescript
// 在request拦截器中统一处理
request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(new Error(error.message))
)
```

### 6.2 DON'Ts (避免的做法)

❌ **避免使用any类型**
```typescript
// 不推荐
export function getData(): Promise<any>

// 推荐
export function getData(): Promise<ApiResponse<SpecificDataType>>
```

❌ **避免类型断言**
```typescript
// 不推荐
const data = response.data as SomeType

// 推荐：通过泛型确保类型安全
const response: ApiResponse<SomeType> = await apiCall()
const data = response.data // 自动推断为 SomeType
```

❌ **避免重复的类型定义**
```typescript
// 不推荐：在多个地方重复定义相同结构
interface UserData1 { id: number; name: string }
interface UserData2 { id: number; name: string }

// 推荐：统一定义，复用类型
interface UserData { id: number; name: string }
```

## 7. 总结

TypeScript与API封装的结合使用核心在于：

1. **类型先行**：先定义类型，再实现功能
2. **分层设计**：类型定义、API封装、业务逻辑分离
3. **渐进增强**：从基础类型开始，逐步完善
4. **工具支持**：充分利用IDE的类型检查和智能提示
5. **团队协作**：类型定义作为团队间的契约

通过这种方式，可以显著提高代码质量、开发效率和维护性。