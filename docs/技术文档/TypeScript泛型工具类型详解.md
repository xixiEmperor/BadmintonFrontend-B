# TypeScript 泛型工具类型详解

TypeScript 提供了一系列强大的泛型工具类型，用于在类型级别进行各种转换和操作。这些工具类型极大地提升了类型操作的灵活性和代码的复用性。

## 目录

1. [Partial\<T\> - 可选化](#partialt---可选化)
2. [Required\<T\> - 必需化](#requiredt---必需化)
3. [Readonly\<T\> - 只读化](#readonlyt---只读化)
4. [Record\<K, T\> - 记录类型](#recordk-t---记录类型)
5. [Pick\<T, K\> - 挑选属性](#pickt-k---挑选属性)
6. [Omit\<T, K\> - 排除属性](#omitt-k---排除属性)
7. [Exclude\<T, U\> - 排除联合类型](#excludet-u---排除联合类型)
8. [Extract\<T, U\> - 提取联合类型](#extractt-u---提取联合类型)
9. [NonNullable\<T\> - 非空类型](#nonnullablet---非空类型)
10. [Parameters\<T\> - 函数参数类型](#parameterst---函数参数类型)
11. [ReturnType\<T\> - 函数返回类型](#returntypet---函数返回类型)
12. [ConstructorParameters\<T\> - 构造函数参数](#constructorparameterst---构造函数参数)
13. [InstanceType\<T\> - 实例类型](#instancetypet---实例类型)
14. [ThisParameterType\<T\> & OmitThisParameter\<T\>](#thisparametertypet--omitthisparametert)
15. [Awaited\<T\> - 异步类型解包](#awaitedt---异步类型解包)
16. [实际项目应用示例](#实际项目应用示例)

---

## Partial\<T\> - 可选化

将类型 T 的所有属性变为可选的。

### 语法
```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
}
```

### 使用示例

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// 所有属性都变成可选的
type PartialUser = Partial<User>;
// 等价于：
// {
//   id?: number;
//   name?: string;
//   email?: string;
//   age?: number;
// }

// 使用场景：更新用户信息
function updateUser(id: number, updates: Partial<User>) {
  // 只需要传递要更新的字段
}

updateUser(1, { name: "新名字" }); // ✅ 只传递部分字段
updateUser(1, { name: "新名字", age: 25 }); // ✅ 传递多个字段
```

### 应用场景
- 更新操作（PATCH 请求）
- 表单数据（部分字段可能未填写）
- 配置对象（允许部分配置）

---

## Required\<T\> - 必需化

将类型 T 的所有属性变为必需的。

### 语法
```typescript
type Required<T> = {
  [P in keyof T]-?: T[P];
}
```

### 使用示例

```typescript
interface Config {
  host?: string;
  port?: number;
  ssl?: boolean;
}

// 所有属性都变成必需的
type RequiredConfig = Required<Config>;
// 等价于：
// {
//   host: string;
//   port: number;
//   ssl: boolean;
// }

// 使用场景：确保配置完整
function validateConfig(config: Required<Config>) {
  // 所有字段都必须存在
  console.log(config.host.toUpperCase()); // 不需要检查 undefined
}
```

### 应用场景
- 配置验证
- 确保对象完整性
- 类型安全的必填校验

---

## Readonly\<T\> - 只读化

将类型 T 的所有属性变为只读的。

### 语法
```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
}
```

### 使用示例

```typescript
interface Point {
  x: number;
  y: number;
}

type ReadonlyPoint = Readonly<Point>;
// 等价于：
// {
//   readonly x: number;
//   readonly y: number;
// }

const point: ReadonlyPoint = { x: 10, y: 20 };
// point.x = 30; // ❌ 错误：无法分配到 "x" ，因为它是只读属性

// 使用场景：不可变数据
function processPoint(point: Readonly<Point>) {
  // 确保函数不会修改传入的点
  return { x: point.x * 2, y: point.y * 2 };
}
```

### 应用场景
- 不可变数据结构
- 防止意外修改
- 函数参数保护

---

## Record\<K, T\> - 记录类型

创建一个键为 K、值为 T 的对象类型。

### 语法
```typescript
type Record<K extends keyof any, T> = {
  [P in K]: T;
}
```

### 使用示例

```typescript
// 基本用法
type Status = "pending" | "completed" | "failed";
type StatusRecord = Record<Status, string>;
// 等价于：
// {
//   pending: string;
//   completed: string;
//   failed: string;
// }

const statusMessages: StatusRecord = {
  pending: "处理中",
  completed: "已完成", 
  failed: "失败"
};

// 实际应用：API 响应映射
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiEndpoints = Record<HttpMethod, string>;

const endpoints: ApiEndpoints = {
  GET: "/api/users",
  POST: "/api/users",
  PUT: "/api/users/:id",
  DELETE: "/api/users/:id"
};

// 复杂类型值
type UserRole = "admin" | "user" | "guest";
type RolePermissions = Record<UserRole, {
  read: boolean;
  write: boolean;
  delete: boolean;
}>;

const permissions: RolePermissions = {
  admin: { read: true, write: true, delete: true },
  user: { read: true, write: true, delete: false },
  guest: { read: true, write: false, delete: false }
};
```

### 应用场景
- 枚举到值的映射
- 配置字典
- 状态管理
- API 路由定义

---

## Pick\<T, K\> - 挑选属性

从类型 T 中挑选部分属性 K。

### 语法
```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
}
```

### 使用示例

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  age: number;
  createdAt: Date;
}

// 只要 id 和 name
type UserSummary = Pick<User, "id" | "name">;
// 等价于：
// {
//   id: number;
//   name: string;
// }

// 使用场景：API 返回简化的用户信息
function getUserSummary(): UserSummary {
  return { id: 1, name: "张三" };
}

// 登录表单只需要 email 和 password
type LoginForm = Pick<User, "email" | "password">;

// 用户列表展示
type UserListItem = Pick<User, "id" | "name" | "email">;
```

### 应用场景
- API 响应简化
- 表单字段选择
- 数据展示优化
- 组件 props 类型定义

---

## Omit\<T, K\> - 排除属性

从类型 T 中排除指定属性 K。

### 语法
```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

### 使用示例

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  age: number;
}

// 排除敏感信息
type PublicUser = Omit<User, "password">;
// 等价于：
// {
//   id: number;
//   name: string;
//   email: string;
//   age: number;
// }

// 创建用户时不需要 id（自动生成）
type CreateUserInput = Omit<User, "id">;

function createUser(userData: CreateUserInput): User {
  return {
    id: Math.random(),
    ...userData
  };
}

// 排除多个属性
type UserUpdateForm = Omit<User, "id" | "createdAt" | "updatedAt">;
```

### 应用场景
- 排除敏感数据
- 创建/更新表单
- API 请求体定义
- 组件 props 简化

---

## Exclude\<T, U\> - 排除联合类型

从联合类型 T 中排除可以赋值给 U 的类型。

### 语法
```typescript
type Exclude<T, U> = T extends U ? never : T;
```

### 使用示例

```typescript
type AllColors = "red" | "green" | "blue" | "yellow";
type PrimaryColors = "red" | "green" | "blue";

// 排除主要颜色，只留下次要颜色
type SecondaryColors = Exclude<AllColors, PrimaryColors>;
// 结果：type SecondaryColors = "yellow"

// 实际应用：排除某些事件类型
type MouseEvent = "click" | "mousedown" | "mouseup" | "mousemove";
type KeyboardEvent = "keydown" | "keyup";
type AllEvents = MouseEvent | KeyboardEvent;

type NonMouseEvents = Exclude<AllEvents, MouseEvent>;
// 结果：type NonMouseEvents = "keydown" | "keyup"

// 排除基础类型
type WithoutString = Exclude<string | number | boolean, string>;
// 结果：type WithoutString = number | boolean

// 复杂示例：排除函数类型
type MixedTypes = string | number | (() => void) | boolean;
type NonFunction = Exclude<MixedTypes, Function>;
// 结果：type NonFunction = string | number | boolean
```

### 应用场景
- 联合类型过滤
- 事件类型筛选
- 条件类型构建
- 类型安全的枚举操作

---

## Extract\<T, U\> - 提取联合类型

从联合类型 T 中提取可以赋值给 U 的类型。

### 语法
```typescript
type Extract<T, U> = T extends U ? T : never;
```

### 使用示例

```typescript
type AllEvents = "click" | "scroll" | "keydown" | "focus" | "blur";
type MouseEvents = "click" | "scroll" | "mousedown";

// 提取鼠标相关事件
type ExtractedMouseEvents = Extract<AllEvents, MouseEvents>;
// 结果：type ExtractedMouseEvents = "click" | "scroll"

// 实际应用：提取字符串类型
type Mixed = string | number | boolean | null;
type StringsOnly = Extract<Mixed, string>;
// 结果：type StringsOnly = string

// 提取函数类型
type MixedTypes = string | number | (() => void) | boolean;
type FunctionOnly = Extract<MixedTypes, Function>;
// 结果：type FunctionOnly = () => void

// 复杂示例：基于条件提取
type ApiResponse = 
  | { type: "success"; data: any }
  | { type: "error"; message: string }
  | { type: "loading" };

type SuccessResponse = Extract<ApiResponse, { type: "success" }>;
// 结果：type SuccessResponse = { type: "success"; data: any }
```

### 应用场景
- 联合类型筛选
- 条件类型构建
- API 响应类型提取
- 事件处理器类型定义

---

## NonNullable\<T\> - 非空类型

从类型 T 中排除 null 和 undefined。

### 语法
```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

### 使用示例

```typescript
type NullableString = string | null | undefined;
type NonNullString = NonNullable<NullableString>;
// 结果：type NonNullString = string

// 实际应用：处理可能为空的数组
function processItems<T>(items: (T | null | undefined)[]): NonNullable<T>[] {
  return items.filter((item): item is NonNullable<T> => item != null);
}

const mixedArray = ["hello", null, "world", undefined, "!"];
const cleanArray = processItems(mixedArray); // string[]

// API 响应处理
interface ApiUser {
  id: number;
  name: string | null;
  email: string | undefined;
  avatar?: string | null;
}

type CleanUser = {
  [K in keyof ApiUser]: NonNullable<ApiUser[K]>;
};
// 结果：
// {
//   id: number;
//   name: string;
//   email: string;
//   avatar?: string;
// }
```

### 应用场景
- 空值过滤
- API 数据清理
- 类型安全的数组操作
- 表单验证

---

## Parameters\<T\> - 函数参数类型

提取函数类型 T 的参数类型组成的元组。

### 语法
```typescript
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```

### 使用示例

```typescript
function createUser(name: string, age: number, email: string) {
  return { name, age, email };
}

type CreateUserParams = Parameters<typeof createUser>;
// 结果：type CreateUserParams = [string, number, string]

// 实际应用：函数参数装饰器
function logParams<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> {
  console.log("调用参数:", args);
  return fn(...args);
}

const result = logParams(createUser, "张三", 25, "zhangsan@example.com");

// 复杂示例：异步函数
async function fetchUserData(id: number, includeProfile: boolean = false) {
  // 模拟 API 调用
  return { id, name: "用户", profile: includeProfile ? {} : null };
}

type FetchParams = Parameters<typeof fetchUserData>;
// 结果：type FetchParams = [number, boolean?]

// 使用参数类型创建调用器
function createCaller<T extends (...args: any[]) => any>(fn: T) {
  return (...args: Parameters<T>) => fn(...args);
}
```

### 应用场景
- 函数装饰器
- 高阶函数
- 参数验证
- 函数工厂

---

## ReturnType\<T\> - 函数返回类型

提取函数类型 T 的返回类型。

### 语法
```typescript
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
```

### 使用示例

```typescript
function getUser() {
  return {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com"
  };
}

type User = ReturnType<typeof getUser>;
// 结果：
// type User = {
//   id: number;
//   name: string;
//   email: string;
// }

// 实际应用：API 响应类型推断
async function fetchUserData() {
  const response = await fetch("/api/user");
  return response.json();
}

type UserData = ReturnType<typeof fetchUserData>;
// type UserData = Promise<any>

// 更实用的方式
type UnwrappedUserData = Awaited<ReturnType<typeof fetchUserData>>;

// 复杂示例：条件返回类型
function processData<T extends string | number>(data: T): T extends string ? string[] : number[] {
  return (Array.isArray(data) ? data : [data]) as any;
}

type StringResult = ReturnType<typeof processData<string>>;
// 结果：type StringResult = string[]

type NumberResult = ReturnType<typeof processData<number>>;
// 结果：type NumberResult = number[]
```

### 应用场景
- API 响应类型推断
- 函数工厂返回类型
- 类型安全的函数组合
- 数据处理管道

---

## ConstructorParameters\<T\> - 构造函数参数

提取构造函数类型 T 的参数类型。

### 语法
```typescript
type ConstructorParameters<T extends abstract new (...args: any) => any> = 
  T extends abstract new (...args: infer P) => any ? P : never;
```

### 使用示例

```typescript
class User {
  constructor(public name: string, public age: number) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>;
// 结果：type UserConstructorParams = [string, number]

// 实际应用：工厂函数
function createInstance<T extends new (...args: any[]) => any>(
  constructor: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new constructor(...args);
}

const user = createInstance(User, "张三", 25);

// 复杂示例：依赖注入
class ApiService {
  constructor(private baseUrl: string, private timeout: number = 5000) {}
}

class DataService {
  constructor(private apiService: ApiService, private cacheSize: number = 100) {}
}

type ApiServiceParams = ConstructorParameters<typeof ApiService>;
type DataServiceParams = ConstructorParameters<typeof DataService>;

// 自动化依赖注入容器
class DIContainer {
  register<T extends new (...args: any[]) => any>(
    constructor: T,
    ...args: ConstructorParameters<T>
  ): InstanceType<T> {
    return new constructor(...args);
  }
}
```

### 应用场景
- 依赖注入
- 工厂模式
- 类装饰器
- 对象池管理

---

## InstanceType\<T\> - 实例类型

提取构造函数类型 T 的实例类型。

### 语法
```typescript
type InstanceType<T extends abstract new (...args: any) => any> = 
  T extends abstract new (...args: any) => infer R ? R : any;
```

### 使用示例

```typescript
class ApiClient {
  baseUrl: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async get(path: string) {
    return fetch(`${this.baseUrl}${path}`);
  }
}

type ClientInstance = InstanceType<typeof ApiClient>;
// 等价于 ApiClient 类型

// 实际应用：依赖注入
type ServiceConstructor = new (...args: any[]) => any;
type ServiceInstance<T extends ServiceConstructor> = InstanceType<T>;

function registerService<T extends ServiceConstructor>(
  constructor: T
): ServiceInstance<T> {
  return new constructor();
}

// 复杂示例：插件系统
abstract class Plugin {
  abstract name: string;
  abstract execute(): void;
}

class LoggerPlugin extends Plugin {
  name = "logger";
  execute() {
    console.log("Logging...");
  }
}

type PluginInstance = InstanceType<typeof Plugin>;
type LoggerInstance = InstanceType<typeof LoggerPlugin>;

// 插件管理器
class PluginManager {
  private plugins: Map<string, InstanceType<typeof Plugin>> = new Map();
  
  register<T extends typeof Plugin>(PluginClass: T): InstanceType<T> {
    const instance = new PluginClass();
    this.plugins.set(instance.name, instance);
    return instance;
  }
}
```

### 应用场景
- 插件系统
- 工厂模式返回类型
- 依赖注入容器
- 类型安全的实例管理

---

## ThisParameterType\<T\> & OmitThisParameter\<T\>

处理函数中的 this 参数。

### 语法
```typescript
type ThisParameterType<T> = T extends (this: infer U, ...args: any[]) => any ? U : unknown;
type OmitThisParameter<T> = unknown extends ThisParameterType<T> ? T : T extends (...args: infer A) => infer R ? (...args: A) => R : T;
```

### 使用示例

```typescript
interface User {
  name: string;
  greet(this: User): void;
}

function greet(this: User) {
  console.log(`Hello, ${this.name}`);
}

type ThisType = ThisParameterType<typeof greet>;
// 结果：type ThisType = User

type WithoutThis = OmitThisParameter<typeof greet>;
// 结果：type WithoutThis = () => void

// 实际应用：方法绑定
class Calculator {
  private value: number = 0;
  
  add(this: Calculator, num: number): Calculator {
    this.value += num;
    return this;
  }
  
  getValue(this: Calculator): number {
    return this.value;
  }
}

type AddMethod = Calculator['add'];
type AddThisType = ThisParameterType<AddMethod>;
// 结果：type AddThisType = Calculator

// 创建无需 this 的版本
type StandaloneAdd = OmitThisParameter<AddMethod>;
// 结果：type StandaloneAdd = (num: number) => Calculator

// 方法提取和绑定
function extractMethod<T, K extends keyof T>(
  obj: T,
  method: K
): T[K] extends (this: T, ...args: infer A) => infer R 
  ? (...args: A) => R 
  : never {
  const fn = obj[method] as any;
  return fn.bind(obj);
}
```

### 应用场景
- 方法绑定
- this 上下文处理
- 函数式编程转换
- 装饰器模式

---

## Awaited\<T\> - 异步类型解包

提取 Promise 的值类型。

### 语法
```typescript
type Awaited<T> = T extends null | undefined ? T : 
  T extends object & { then(onfulfilled: infer F, ...args: infer _): any } ? 
    F extends ((value: infer V, ...args: infer _) => any) ? 
      Awaited<V> : never : T;
```

### 使用示例

```typescript
type PromiseString = Promise<string>;
type StringType = Awaited<PromiseString>;
// 结果：type StringType = string

// 嵌套 Promise
type NestedPromise = Promise<Promise<number>>;
type NumberType = Awaited<NestedPromise>;
// 结果：type NumberType = number

// 实际应用：异步函数返回类型
async function fetchData(): Promise<{ id: number; name: string }> {
  return { id: 1, name: "数据" };
}

type FetchDataResult = Awaited<ReturnType<typeof fetchData>>;
// 结果：type FetchDataResult = { id: number; name: string }

// 复杂示例：多层异步
async function getNestedData(): Promise<Promise<{ users: User[] }>> {
  return Promise.resolve(Promise.resolve({ users: [] }));
}

type NestedResult = Awaited<ReturnType<typeof getNestedData>>;
// 结果：type NestedResult = { users: User[] }

// API 调用链
async function fetchUser(id: number) {
  return { id, name: "用户", posts: [] };
}

async function fetchUserPosts(user: Awaited<ReturnType<typeof fetchUser>>) {
  return user.posts;
}

type UserPostsType = Awaited<ReturnType<typeof fetchUserPosts>>;
```

### 应用场景
- 异步数据处理
- API 响应类型推断
- Promise 链式调用
- async/await 类型安全

---

## 实际项目应用示例

以下是一个综合使用多个工具类型的实际项目示例：

```typescript
// ===== 基础类型定义 =====
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user" | "guest";
  avatar?: string;
  preferences: {
    theme: "light" | "dark";
    language: string;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ===== 工具类型应用 =====

// 1. 用户注册表单（排除自动生成的字段）
type RegisterForm = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  confirmPassword: string;
};

// 2. 用户更新表单（部分字段可选，排除敏感字段）
type UpdateUserForm = Partial<Omit<User, "id" | "password" | "createdAt" | "updatedAt">>;

// 3. 公开用户信息（排除敏感字段）
type PublicUser = Omit<User, "password">;

// 4. 用户列表项（只包含必要信息）
type UserListItem = Pick<User, "id" | "name" | "email" | "role" | "avatar">;

// 5. API 响应类型
type UserListResponse = ApiResponse<UserListItem[]>;
type UserDetailResponse = ApiResponse<PublicUser>;
type CreateUserResponse = ApiResponse<PublicUser>;

// ===== 状态管理 =====

// 6. 加载状态映射
type LoadingState = "idle" | "loading" | "success" | "error";
type LoadingMessages = Record<LoadingState, string>;

const loadingMessages: LoadingMessages = {
  idle: "待机中",
  loading: "加载中...",
  success: "加载成功",
  error: "加载失败"
};

// 7. 用户角色权限映射
type UserRole = User["role"];
type RolePermissions = Record<UserRole, {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
}>;

const rolePermissions: RolePermissions = {
  admin: { canRead: true, canWrite: true, canDelete: true, canManageUsers: true },
  user: { canRead: true, canWrite: true, canDelete: false, canManageUsers: false },
  guest: { canRead: true, canWrite: false, canDelete: false, canManageUsers: false }
};

// ===== API 函数类型 =====

// 8. API 函数定义
async function createUser(userData: RegisterForm): Promise<PublicUser> {
  // 创建用户逻辑
  const response = await fetch("/api/users", {
    method: "POST",
    body: JSON.stringify(userData)
  });
  return response.json();
}

async function updateUser(id: string, updates: UpdateUserForm): Promise<PublicUser> {
  // 更新用户逻辑
  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  });
  return response.json();
}

async function getUsers(): Promise<UserListItem[]> {
  const response = await fetch("/api/users");
  return response.json();
}

// 9. 函数类型提取
type CreateUserParams = Parameters<typeof createUser>;
type CreateUserReturn = Awaited<ReturnType<typeof createUser>>;
type UpdateUserParams = Parameters<typeof updateUser>;
type GetUsersReturn = Awaited<ReturnType<typeof getUsers>>;

// ===== 高级应用 =====

// 10. 表单验证器
type FormValidator<T> = {
  [K in keyof T]: (value: T[K]) => string | null;
};

const userFormValidator: FormValidator<Required<UpdateUserForm>> = {
  name: (value) => value.length < 2 ? "名称至少2个字符" : null,
  email: (value) => !/\S+@\S+\.\S+/.test(value) ? "邮箱格式不正确" : null,
  role: (value) => !["admin", "user", "guest"].includes(value) ? "角色无效" : null,
  avatar: (value) => value && !value.startsWith("http") ? "头像必须是有效URL" : null,
  preferences: (value) => !value ? "偏好设置不能为空" : null
};

// 11. 事件处理器类型
type UserEvents = "create" | "update" | "delete" | "login" | "logout";
type UserEventHandlers = Record<UserEvents, (user: PublicUser) => void>;

const userEventHandlers: UserEventHandlers = {
  create: (user) => console.log(`用户 ${user.name} 已创建`),
  update: (user) => console.log(`用户 ${user.name} 已更新`),
  delete: (user) => console.log(`用户 ${user.name} 已删除`),
  login: (user) => console.log(`用户 ${user.name} 已登录`),
  logout: (user) => console.log(`用户 ${user.name} 已登出`)
};

// 12. 条件类型应用
type ApiEndpoint<T extends string> = T extends `${infer Method} ${infer Path}` 
  ? { method: Method; path: Path }
  : never;

type UserEndpoints = 
  | ApiEndpoint<"GET /users">
  | ApiEndpoint<"POST /users">
  | ApiEndpoint<"PUT /users/:id">
  | ApiEndpoint<"DELETE /users/:id">;

// 13. 工具类型组合
type SafeUser = NonNullable<Partial<Omit<User, "password">>>;
type RequiredUserFields = Required<Pick<User, "id" | "name" | "email">>;
type OptionalUserFields = Partial<Omit<User, keyof RequiredUserFields>>;
type CompleteUser = RequiredUserFields & OptionalUserFields;

// ===== 使用示例 =====

// 类型安全的用户创建
async function createUserSafely(formData: RegisterForm): Promise<CreateUserReturn> {
  // 验证表单数据
  const validationErrors = Object.entries(userFormValidator)
    .map(([key, validator]) => {
      const value = formData[key as keyof typeof formData];
      return { key, error: validator(value as any) };
    })
    .filter(({ error }) => error !== null);

  if (validationErrors.length > 0) {
    throw new Error("表单验证失败");
  }

  // 创建用户
  const user = await createUser(formData);
  
  // 触发事件
  userEventHandlers.create(user);
  
  return user;
}

// 类型安全的权限检查
function hasPermission(user: PublicUser, action: keyof RolePermissions[UserRole]): boolean {
  const permissions = rolePermissions[user.role];
  return permissions[action];
}

// 使用示例
const user: PublicUser = {
  id: "1",
  name: "张三",
  email: "zhangsan@example.com",
  role: "user",
  preferences: {
    theme: "light",
    language: "zh-CN",
    notifications: true
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log(hasPermission(user, "canWrite")); // true
console.log(hasPermission(user, "canDelete")); // false
```

## 总结

TypeScript 的泛型工具类型提供了强大的类型操作能力，使我们能够：

### 🎯 **核心优势**

1. **提升代码复用性** - 避免重复定义相似类型
2. **增强类型安全** - 确保类型转换的正确性  
3. **简化类型操作** - 用简洁的语法完成复杂的类型操作
4. **提升开发体验** - 更好的智能提示和错误检查

### 🛠️ **最佳实践**

1. **组合使用** - 多个工具类型可以组合使用以实现复杂的类型转换
2. **渐进增强** - 从基础类型开始，逐步添加约束和转换
3. **语义化命名** - 为生成的类型使用有意义的名称
4. **文档化** - 为复杂的类型组合添加注释说明

### 📚 **学习建议**

1. **从简单开始** - 先掌握 `Pick`、`Omit`、`Partial` 等常用类型
2. **实践应用** - 在实际项目中尝试使用这些工具类型
3. **深入理解** - 学习工具类型的实现原理，理解映射类型和条件类型
4. **持续进阶** - 探索更高级的类型操作技巧

掌握这些工具类型是编写高质量 TypeScript 代码的关键技能！它们不仅能提升代码的类型安全性，还能显著改善开发体验和代码维护性。 