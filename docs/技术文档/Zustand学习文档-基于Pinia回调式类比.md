### Zustand 学习文档（基于 Pinia 回调式 defineStore 类比）

本文从你熟悉的 Pinia“回调式/Setup 风格”defineStore 出发，系统讲解 Zustand 的用法与最佳实践，涵盖状态、动作、选择器、异步、持久化、订阅、TypeScript、性能与迁移清单。

---

## 1. 为什么选 Zustand
- 极简：无样板代码，无 Provider 限制（只需在 React 中使用 hook）
- 细粒度订阅：通过 selector 精准订阅，减少重渲染
- 强中间件：`persist`、`devtools`、`immer`、`subscribeWithSelector`
- 适配 TS 友好、可在组件外使用（vanilla）

---

## 2. 安装
```bash
pnpm add zustand
# 按需中间件
pnpm add zustand/middleware
```

---

## 3. 核心对比：Pinia（回调式）→ Zustand

### 3.1 Pinia 回调式（Setup 风格）
```ts
// Pinia（回调式）
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  function inc() {
    count.value++
  }

  async function fetchInit() {
    const n = await Promise.resolve(1)
    count.value = n
  }

  return { count, double, inc, fetchInit }
})
```

### 3.2 Zustand 等价实现
```ts
import { create } from 'zustand'

type CounterState = {
  count: number
  // 在 store 中派生：通过 get() 访问当前状态
  double: () => number
  inc: () => void
  fetchInit: () => Promise<void>
}

export const useCounter = create<CounterState>((set, get) => ({
  count: 0,
  double: () => get().count * 2, // 可选：也可以在组件里用 selector 计算
  inc: () => set((s) => ({ count: s.count + 1 })),
  fetchInit: async () => {
    const n = await Promise.resolve(1)
    set({ count: n })
  },
}))
```

要点：
- Pinia 回调式 `defineStore('id', () => { ... return exposed })` ↔ Zustand `create((set, get) => ({ state & actions }))`
- Pinia `computed` ↔ Zustand 使用 selector（`useStore(s => s.xxx)`）或在 store 里写一个函数 `double: () => get().count * 2`
- Pinia `actions` ↔ Zustand 直接把函数写进 store 对象（支持 async/await）

---

## 4. 基础用法

### 4.1 声明 store
```ts
import { create } from 'zustand'

type Todo = { id: number; title: string; done: boolean }
type TodoState = {
  todos: Todo[]
  add: (title: string) => void
  toggle: (id: number) => void
}

export const useTodo = create<TodoState>((set) => ({
  todos: [],
  add: (title) => set((s) => ({
    todos: [...s.todos, { id: Date.now(), title, done: false }],
  })),
  toggle: (id) => set((s) => ({
    todos: s.todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
  })),
}))
```

### 4.2 在组件中使用（selector 精准订阅）
```tsx
const todos = useTodo(s => s.todos)
const add = useTodo(s => s.add)
```

注意：避免 `const store = useTodo()` 再解构，这会订阅整个 store，导致无谓重渲染。

---

## 5. 选择器与性能
```ts
// 选择多个字段
const { a, b } = useStore(s => ({ a: s.a, b: s.b }))

// 浅比较，减少渲染
import { shallow } from 'zustand/shallow'
const sel = useStore(s => ({ a: s.a, b: s.b }), shallow)
```

最佳实践：
- 订阅最小必要子集
- 避免把大对象整体塞进 state；可以存 id 集合，按需派生

---

## 6. 异步 Action
```ts
type User = { id: number; name: string }
type UserState = {
  list: User[]
  loading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
}

export const useUser = create<UserState>((set) => ({
  list: [],
  loading: false,
  error: null,
  fetchUsers: async () => {
    try {
      set({ loading: true, error: null })
      const data: User[] = await fetch('/api/users').then(r => r.json())
      set({ list: data, loading: false })
    } catch (e: any) {
      set({ error: e?.message ?? '请求失败', loading: false })
    }
  },
}))
```

对比 Pinia 回调式：
- Pinia 里 `async function fetchUsers()` 改为 Zustand store 对象中的 `fetchUsers: async () => { ... }`

---

## 7. 中间件：persist / devtools / immer / subscribeWithSelector

```ts
import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'

type AuthState = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        setToken: (t) => set({ token: t }),
        logout: () => set({ token: null }),
      }),
      { name: 'auth', storage: createJSONStorage(() => localStorage) }
    ),
    { name: 'AuthStore' }
  )
)
```

可选：Immer 风格可变写法
```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type Cart = {
  items: { id: number; qty: number }[]
  add: (id: number) => void
}

export const useCart = create<Cart>()(immer((set) => ({
  items: [],
  add: (id) => set((s) => { s.items.push({ id, qty: 1 }) }),
})))
```

---

## 8. 订阅与监听（Pinia `$subscribe` 对应）
```ts
import { useCart } from './cart'

// 任何模块（组件外）
const unsubscribe = useCart.subscribe((state, prev) => {
  // state 变化时触发
})

// 指定字段订阅（更高效）
const unsub2 = useCart.subscribe(s => s.items, (items, prev) => {
  // items 变化时触发
})

// 结束订阅
unsubscribe()
```

`subscribeWithSelector` 中间件可提供更强的选择器订阅能力。

---

## 9. 模块化与跨 store 读取
- 推荐按领域拆分多个 store 文件（类似多个 Pinia store）
- 跨 store 读取：`const other = useOtherStore.getState()`

```ts
import { useAuth } from './auth'

export const useProfile = create<{ name: string; load: () => void }>((set) => ({
  name: '',
  load: () => {
    const token = useAuth.getState().token
    // 根据 token 拉取 profile
  },
}))
```

---

## 10. TypeScript 模式
- 定义 `State & Actions` 类型，给 `create<State>()`
- `set((s) => ({ ... }))` 自动推断返回类型
- 复杂 action 或返回值建议显式标注，便于重构

扩展示例：
```ts
import { StateCreator } from 'zustand'

// 切片（slice）
type FiltersSlice = { q: string; setQ: (q: string) => void }
const createFiltersSlice: StateCreator<FiltersSlice> = (set) => ({
  q: '',
  setQ: (q) => set({ q })
})

type PaginationSlice = { page: number; setPage: (p: number) => void }
const createPaginationSlice: StateCreator<PaginationSlice> = (set) => ({
  page: 1,
  setPage: (p) => set({ page: p })
})

type Store = FiltersSlice & PaginationSlice
export const useSearch = create<Store>((set, get) => ({
  ...createFiltersSlice(set, get, undefined as any),
  ...createPaginationSlice(set, get, undefined as any),
}))
```

---

## 11. SSR 与 vanilla 用法
```ts
// vanilla：无需 React hook，可用于 SSR 或非 React 环境
import { createStore } from 'zustand/vanilla'

type S = { count: number; inc: () => void }
export const counterStore = createStore<S>()((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}))

// React 层将 vanilla store 注入（略）
```

---

## 12. 性能建议
- 始终用 selector 订阅最小必要片段
- 对多字段选择使用 `shallow`
- 避免把大型引用类型整体置换；必要时使用 `immer` 或精细化更新

---

## 13. 迁移清单（Pinia 回调式 → Zustand）
- state：回调式返回的 `ref/computed` → Zustand `create((set,get)=>({ ... }))`
- getters：Pinia `computed` → Zustand selector 或 store 内函数（使用 `get()`）
- actions：Pinia 中的函数 → Zustand 中的函数（支持 async/await）
- 插件：Pinia 插件 → Zustand 中间件（`persist/devtools/immer`）
- 订阅：Pinia `$subscribe` → `store.subscribe`（可配合 selector）

映射示例：
```ts
// Pinia（回调式）
export const useVenue = defineStore('venue', () => {
  const list = ref([] as Venue[])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const available = computed(() => list.value.filter(v => v.available))

  async function fetchList() {
    try {
      loading.value = true
      error.value = null
      list.value = await api.getVenueList()
    } catch (e: any) {
      error.value = e?.message
    } finally {
      loading.value = false
    }
  }

  return { list, loading, error, available, fetchList }
})

// Zustand
type VenueState = {
  list: Venue[]
  loading: boolean
  error: string | null
  available: () => Venue[]
  fetchList: () => Promise<void>
}

export const useVenue = create<VenueState>((set, get) => ({
  list: [],
  loading: false,
  error: null,
  available: () => get().list.filter(v => (v as any).available),
  fetchList: async () => {
    try {
      set({ loading: true, error: null })
      const data = await api.getVenueList()
      set({ list: data, loading: false })
    } catch (e: any) {
      set({ error: e?.message ?? '请求失败', loading: false })
    }
  },
}))
```

---

## 14. FAQ
- Getter 一定要放 store 内吗？
  - 不必须。更推荐在组件里用 selector/`useMemo` 计算，渲染更可控。
- 我需要类似 Vue 的“响应式”吗？
  - Zustand 通过 selector 订阅变更即可，无需 `ref`。
- 能和 React Query 配合吗？
  - 很适合：数据获取交给 React Query，Zustand 管 UI 状态（筛选、选择、临时编辑）。

---

## 15. 一页模板（可复制）
```ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type S = {
  list: any[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  reset: () => void
}

export const useStore = create<S>()(
  devtools(
    persist(
      (set) => ({
        list: [],
        loading: false,
        error: null,
        fetch: async () => {
          try {
            set({ loading: true, error: null })
            const data = await fetch('/api/list').then(r => r.json())
            set({ list: data, loading: false })
          } catch (e: any) {
            set({ error: e?.message ?? 'failed', loading: false })
          }
        },
        reset: () => set({ list: [], loading: false, error: null }),
      }),
      { name: 'demo' }
    )
  )
)
```

使用：
```tsx
const { list, loading, fetch } = useStore(s => ({ list: s.list, loading: s.loading, fetch: s.fetch }))
useEffect(() => { fetch() }, [fetch])
```

---

如需把你现有的某个 Pinia 回调式 store 一对一改写为 Zustand，请把该 store 代码给我，我会给出完全等价的 Zustand 版本并解释迁移差异。

