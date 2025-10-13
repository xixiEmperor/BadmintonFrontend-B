# 技术中台实现方案

基于 Vue3 + Express + MongoDB + Redis 技术栈的中台化架构设计

## 目录
- [技术栈确认](#技术栈确认)
- [整体架构](#整体架构)
- [后端架构设计](#后端架构设计)
- [前端架构设计](#前端架构设计)
- [数据库设计](#数据库设计)
- [API 设计规范](#api-设计规范)
- [部署架构](#部署架构)
- [开发规范](#开发规范)
- [实施路线](#实施路线)

## 技术栈确认

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **数据可视化**: ECharts
- **构建工具**: Vite
- **包管理**: pnpm

### 后端技术栈
- **框架**: Express.js (JavaScript)
- **数据库**: MongoDB + Mongoose
- **缓存**: Redis + ioredis
- **认证**: JWT + Passport
- **API 文档**: Swagger
- **日志**: Winston
- **进程管理**: PM2

### 基础设施
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **监控**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

## 整体架构

```mermaid
graph TB
    subgraph "前端层"
        A[Vue3 管理控制台] 
        B[开发者文档门户]
        C[中台配置界面]
    end
    
    subgraph "网关层"
        D[Nginx 反向代理]
        E[API Gateway]
    end
    
    subgraph "应用层"
        F[BFF 聚合层]
        G[用户服务]
        H[权限服务] 
        I[商品服务]
        J[订单服务]
        K[场馆服务]
        L[内容服务]
        M[监控服务]
    end
    
    subgraph "数据层"
        N[MongoDB 集群]
        O[Redis 集群]
        P[对象存储 MinIO]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K
    F --> L
    F --> M
    G --> N
    G --> O
    H --> N
    H --> O
    I --> N
    I --> O
    J --> N
    J --> O
    K --> N
    K --> O
    L --> N
    L --> O
    M --> N
    M --> O
    N --> P
```

## 后端架构设计

### 目录结构
```
middleware-platform/
├── apps/
│   ├── api-gateway/           # API 网关
│   ├── bff/                   # BFF 聚合层  
│   └── admin-console/         # Vue3 管理控制台
├── services/
│   ├── user-service/          # 用户服务
│   ├── auth-service/          # 认证服务
│   ├── product-service/       # 商品服务
│   ├── order-service/         # 订单服务
│   ├── venue-service/         # 场馆服务
│   ├── content-service/       # 内容服务
│   └── monitoring-service/    # 监控服务
├── packages/
│   ├── shared-models/         # 共享数据模型
│   ├── shared-utils/          # 共享工具函数
│   ├── sdk-browser/           # 浏览器 SDK
│   └── sdk-node/             # Node.js SDK
├── infrastructure/
│   ├── docker/               # Docker 配置
│   ├── nginx/                # Nginx 配置
│   └── k8s/                  # Kubernetes 配置
└── docs/                     # 文档
```

### 单个服务结构（以 user-service 为例）
```
user-service/
├── src/
│   ├── controllers/          # 控制器层
│   │   ├── userController.js
│   │   └── profileController.js
│   ├── services/             # 业务逻辑层
│   │   ├── userService.js
│   │   └── authService.js
│   ├── models/               # 数据模型层
│   │   ├── User.js
│   │   └── UserProfile.js
│   ├── routes/               # 路由层
│   │   ├── index.js
│   │   ├── users.js
│   │   └── auth.js
│   ├── middleware/           # 中间件
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── utils/                # 工具函数
│   │   ├── logger.js
│   │   ├── cache.js
│   │   └── crypto.js
│   ├── config/               # 配置文件
│   │   ├── database.js
│   │   ├── redis.js
│   │   └── index.js
│   └── app.js                # 应用入口
├── tests/                    # 测试文件
├── docs/                     # API 文档
├── package.json
├── Dockerfile
└── .env.example
```

### 核心依赖配置

#### package.json (后端服务通用)
```json
{
  "name": "middleware-service",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "lint": "eslint src/",
    "docs": "swagger-jsdoc -d docs/swagger.json src/routes/*.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "bcryptjs": "^2.4.3",
    "joi": "^17.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.0",
    "rate-limiter-flexible": "^4.0.1",
    "winston": "^3.11.0",
    "bull": "^4.12.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "multer": "^1.4.5",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "eslint": "^8.54.0"
  }
}
```

### 核心服务实现

#### 1. 用户服务 (user-service)

**用户模型 (src/models/User.js)**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 基础信息
  username: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  phone: { 
    type: String, 
    sparse: true,
    index: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  
  // 多租户支持
  tenantId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // 用户状态
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active',
    index: true 
  },
  
  // 角色权限
  roles: [{ 
    type: String,
    enum: ['admin', 'operator', 'user', 'viewer']
  }],
  
  // 扩展信息
  profile: {
    nickname: String,
    avatar: String,
    realName: String,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    birthday: Date,
    address: String
  },
  
  // 系统字段
  lastLoginAt: Date,
  loginCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { transform: (doc, ret) => { delete ret.password; return ret; } }
});

// 复合索引
userSchema.index({ tenantId: 1, status: 1 });
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 实例方法
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

**用户控制器 (src/controllers/userController.js)**
```javascript
const userService = require('../services/userService');
const { successResponse, errorResponse } = require('../utils/response');
const { validateUser, validateUserUpdate } = require('../utils/validation');

class UserController {
  // 获取用户列表
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, status, role, search } = req.query;
      const { tenantId } = req.user;
      
      const result = await userService.getUsers({
        tenantId,
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        role,
        search
      });
      
      res.json(successResponse(result));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 创建用户
  async createUser(req, res) {
    try {
      const { error } = validateUser(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }
      
      const userData = { ...req.body, tenantId: req.user.tenantId };
      const user = await userService.createUser(userData);
      
      res.status(201).json(successResponse(user));
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json(errorResponse('用户已存在'));
      } else {
        res.status(500).json(errorResponse(error.message));
      }
    }
  }
  
  // 更新用户
  async updateUser(req, res) {
    try {
      const { error } = validateUserUpdate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }
      
      const { userId } = req.params;
      const { tenantId } = req.user;
      
      const user = await userService.updateUser(userId, req.body, tenantId);
      if (!user) {
        return res.status(404).json(errorResponse('用户不存在'));
      }
      
      res.json(successResponse(user));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 删除用户
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const { tenantId } = req.user;
      
      const result = await userService.deleteUser(userId, tenantId);
      if (!result) {
        return res.status(404).json(errorResponse('用户不存在'));
      }
      
      res.json(successResponse({ message: '用户删除成功' }));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 批量操作
  async batchOperation(req, res) {
    try {
      const { operation, userIds } = req.body;
      const { tenantId } = req.user;
      
      const result = await userService.batchOperation(operation, userIds, tenantId);
      res.json(successResponse(result));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}

module.exports = new UserController();
```

**用户服务 (src/services/userService.js)**
```javascript
const User = require('../models/User');
const cacheService = require('./cacheService');
const logger = require('../utils/logger');

class UserService {
  // 获取用户列表
  async getUsers({ tenantId, page, limit, status, role, search }) {
    const query = { tenantId };
    
    if (status) query.status = status;
    if (role) query.roles = { $in: [role] };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.nickname': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query)
    ]);
    
    return {
      users,
      pagination: {
        current: page,
        pageSize: limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  // 创建用户
  async createUser(userData) {
    const user = new User(userData);
    await user.save();
    
    // 清除相关缓存
    await cacheService.clearPattern(`users:${userData.tenantId}:*`);
    
    logger.info('User created', { userId: user._id, tenantId: userData.tenantId });
    return user.toJSON();
  }
  
  // 更新用户
  async updateUser(userId, updateData, tenantId) {
    const user = await User.findOneAndUpdate(
      { _id: userId, tenantId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (user) {
      // 清除缓存
      await cacheService.del(`user:${userId}`);
      await cacheService.clearPattern(`users:${tenantId}:*`);
      
      logger.info('User updated', { userId, tenantId });
    }
    
    return user;
  }
  
  // 删除用户
  async deleteUser(userId, tenantId) {
    const result = await User.findOneAndDelete({ _id: userId, tenantId });
    
    if (result) {
      // 清除缓存
      await cacheService.del(`user:${userId}`);
      await cacheService.clearPattern(`users:${tenantId}:*`);
      
      logger.info('User deleted', { userId, tenantId });
    }
    
    return result;
  }
  
  // 批量操作
  async batchOperation(operation, userIds, tenantId) {
    let result;
    
    switch (operation) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds }, tenantId },
          { status: 'active', updatedAt: new Date() }
        );
        break;
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds }, tenantId },
          { status: 'inactive', updatedAt: new Date() }
        );
        break;
      case 'delete':
        result = await User.deleteMany({ _id: { $in: userIds }, tenantId });
        break;
      default:
        throw new Error('不支持的操作类型');
    }
    
    // 清除缓存
    await cacheService.clearPattern(`users:${tenantId}:*`);
    userIds.forEach(id => cacheService.del(`user:${id}`));
    
    logger.info('Batch operation completed', { operation, userIds, tenantId });
    return result;
  }
  
  // 根据ID获取用户（带缓存）
  async getUserById(userId, tenantId) {
    const cacheKey = `user:${userId}`;
    
    // 先从缓存获取
    let user = await cacheService.get(cacheKey);
    if (user) return JSON.parse(user);
    
    // 缓存未命中，从数据库获取
    user = await User.findOne({ _id: userId, tenantId }).select('-password').lean();
    if (user) {
      // 设置缓存，5分钟过期
      await cacheService.setex(cacheKey, 300, JSON.stringify(user));
    }
    
    return user;
  }
}

module.exports = new UserService();
```

#### 2. 认证服务 (auth-service)

**认证控制器 (src/controllers/authController.js)**
```javascript
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');
const { validateLogin, validateRegister } = require('../utils/validation');

class AuthController {
  // 用户登录
  async login(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }
      
      const { email, password, tenantId } = req.body;
      const result = await authService.login(email, password, tenantId);
      
      if (!result.success) {
        return res.status(401).json(errorResponse(result.message));
      }
      
      // 设置 HTTP-only Cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
      });
      
      res.json(successResponse({
        user: result.user,
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      }));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 用户注册
  async register(req, res) {
    try {
      const { error } = validateRegister(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }
      
      const result = await authService.register(req.body);
      
      if (!result.success) {
        return res.status(409).json(errorResponse(result.message));
      }
      
      res.status(201).json(successResponse({
        user: result.user,
        message: '注册成功'
      }));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 刷新令牌
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json(errorResponse('刷新令牌不存在'));
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      if (!result.success) {
        return res.status(401).json(errorResponse(result.message));
      }
      
      res.json(successResponse({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn
      }));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 用户登出
  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      res.clearCookie('refreshToken');
      res.json(successResponse({ message: '登出成功' }));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
  
  // 获取当前用户信息
  async getCurrentUser(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.userId, req.user.tenantId);
      res.json(successResponse(user));
    } catch (error) {
      res.status(500).json(errorResponse(error.message));
    }
  }
}

module.exports = new AuthController();
```

#### 3. 缓存服务 (shared)

**缓存服务 (packages/shared-utils/cacheService.js)**
```javascript
const Redis = require('ioredis');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
    
    this.redis.on('connect', () => {
      logger.info('Redis connected');
    });
    
    this.redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }
  
  // 设置缓存
  async set(key, value, ttl = 3600) {
    try {
      if (ttl) {
        return await this.redis.setex(key, ttl, JSON.stringify(value));
      } else {
        return await this.redis.set(key, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Cache set error:', error);
      throw error;
    }
  }
  
  // 获取缓存
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }
  
  // 删除缓存
  async del(key) {
    try {
      return await this.redis.del(key);
    } catch (error) {
      logger.error('Cache del error:', error);
      throw error;
    }
  }
  
  // 批量删除
  async clearPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      throw error;
    }
  }
  
  // 增量操作
  async incr(key, ttl = 3600) {
    try {
      const value = await this.redis.incr(key);
      if (ttl && value === 1) {
        await this.redis.expire(key, ttl);
      }
      return value;
    } catch (error) {
      logger.error('Cache incr error:', error);
      throw error;
    }
  }
  
  // 哈希操作
  async hset(key, field, value) {
    try {
      return await this.redis.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache hset error:', error);
      throw error;
    }
  }
  
  async hget(key, field) {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }
  
  // 列表操作（队列）
  async lpush(key, value) {
    try {
      return await this.redis.lpush(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache lpush error:', error);
      throw error;
    }
  }
  
  async rpop(key) {
    try {
      const value = await this.redis.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache rpop error:', error);
      return null;
    }
  }
  
  // 分布式锁
  async lock(key, ttl = 10, value = 'locked') {
    try {
      const result = await this.redis.set(key, value, 'PX', ttl * 1000, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Cache lock error:', error);
      return false;
    }
  }
  
  async unlock(key, value = 'locked') {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      return await this.redis.eval(script, 1, key, value);
    } catch (error) {
      logger.error('Cache unlock error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
```

#### 4. 限流中间件

**限流中间件 (src/middleware/rateLimit.js)**
```javascript
const RateLimiter = require('rate-limiter-flexible');
const redis = require('../config/redis');

// API 调用限流
const apiRateLimiter = new RateLimiter.RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'api_rate_limit',
  points: 100, // 请求数
  duration: 60, // 时间窗口（秒）
  blockDuration: 60, // 阻塞时长（秒）
});

// 登录限流
const loginRateLimiter = new RateLimiter.RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'login_rate_limit',
  points: 5, // 5次尝试
  duration: 900, // 15分钟
  blockDuration: 900, // 阻塞15分钟
});

// 通用限流中间件
const createRateLimitMiddleware = (limiter, keyGenerator) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip;
      await limiter.consume(key);
      next();
    } catch (rateLimiterRes) {
      const remainingPoints = rateLimiterRes.remainingPoints;
      const msBeforeNext = rateLimiterRes.msBeforeNext;
      
      res.set({
        'Retry-After': Math.round(msBeforeNext / 1000) || 1,
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext)
      });
      
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.round(msBeforeNext / 1000)
      });
    }
  };
};

// API 限流中间件
const apiRateLimit = createRateLimitMiddleware(
  apiRateLimiter,
  (req) => `${req.ip}:${req.user?.tenantId || 'anonymous'}`
);

// 登录限流中间件
const loginRateLimit = createRateLimitMiddleware(
  loginRateLimiter,
  (req) => `${req.ip}:${req.body.email}`
);

// 基于用户的限流
const userRateLimiter = new RateLimiter.RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'user_rate_limit',
  points: 1000, // 用户每小时1000次请求
  duration: 3600,
  blockDuration: 3600,
});

const userRateLimit = createRateLimitMiddleware(
  userRateLimiter,
  (req) => `${req.user?.userId}:${req.user?.tenantId}`
);

module.exports = {
  apiRateLimit,
  loginRateLimit,
  userRateLimit,
  createRateLimitMiddleware
};
```

## 前端架构设计

### Vue3 管理控制台结构
```
admin-console/
├── src/
│   ├── components/           # 通用组件
│   │   ├── common/          # 基础组件
│   │   │   ├── AppTable.vue     # 表格组件
│   │   │   ├── AppForm.vue      # 表单组件
│   │   │   ├── AppDialog.vue    # 对话框组件
│   │   │   ├── AppChart.vue     # 图表组件
│   │   │   └── AppUpload.vue    # 上传组件
│   │   ├── layout/          # 布局组件
│   │   │   ├── AppHeader.vue    # 顶部导航
│   │   │   ├── AppSidebar.vue   # 侧边栏
│   │   │   └── AppBreadcrumb.vue # 面包屑
│   │   └── business/        # 业务组件
│   │       ├── UserManager.vue   # 用户管理
│   │       ├── RoleManager.vue   # 角色管理
│   │       └── ProductManager.vue # 商品管理
│   ├── views/               # 页面视图
│   │   ├── dashboard/       # 仪表盘
│   │   │   └── Index.vue
│   │   ├── system/          # 系统管理
│   │   │   ├── User/
│   │   │   │   ├── Index.vue
│   │   │   │   ├── Create.vue
│   │   │   │   └── Edit.vue
│   │   │   ├── Role/
│   │   │   └── Config/
│   │   ├── business/        # 业务管理
│   │   │   ├── Product/
│   │   │   ├── Order/
│   │   │   └── Venue/
│   │   └── monitor/         # 监控中心
│   │       ├── Overview.vue
│   │       ├── Logs.vue
│   │       └── Performance.vue
│   ├── stores/              # Pinia 状态管理
│   │   ├── auth.js          # 认证状态
│   │   ├── user.js          # 用户状态
│   │   ├── app.js           # 应用状态
│   │   └── index.js         # Store 入口
│   ├── router/              # Vue Router
│   │   ├── index.js         # 路由配置
│   │   ├── guards.js        # 路由守卫
│   │   └── modules/         # 模块化路由
│   ├── api/                 # API 接口
│   │   ├── request.js       # Axios 配置
│   │   ├── auth.js          # 认证接口
│   │   ├── user.js          # 用户接口
│   │   └── business.js      # 业务接口
│   ├── utils/               # 工具函数
│   │   ├── auth.js          # 认证工具
│   │   ├── permission.js    # 权限工具
│   │   ├── format.js        # 格式化工具
│   │   └── validate.js      # 验证工具
│   ├── composables/         # 组合式函数
│   │   ├── useTable.js      # 表格逻辑
│   │   ├── useForm.js       # 表单逻辑
│   │   └── usePermission.js # 权限逻辑
│   ├── styles/              # 样式文件
│   │   ├── index.scss       # 全局样式
│   │   ├── variables.scss   # 变量定义
│   │   └── components.scss  # 组件样式
│   ├── App.vue              # 根组件
│   └── main.js              # 应用入口
├── public/                  # 静态资源
├── package.json
├── vite.config.js
└── .env.example
```

### 核心前端代码实现

#### 1. Vite 配置 (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          '@/utils/request': ['request']
        }
      ]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'echarts': ['echarts'],
          'vendor': ['vue', 'vue-router', 'pinia', 'axios']
        }
      }
    }
  }
})
```

#### 2. 包依赖配置 (package.json)
```json
{
  "name": "middleware-admin-console",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .vue,.js,.ts --fix"
  },
  "dependencies": {
    "vue": "^3.3.8",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "element-plus": "^2.4.4",
    "@element-plus/icons-vue": "^2.1.0",
    "echarts": "^5.4.3",
    "vue-echarts": "^6.6.1",
    "axios": "^1.6.2",
    "@vueuse/core": "^10.5.0",
    "dayjs": "^1.11.10",
    "js-cookie": "^3.0.5",
    "lodash-es": "^4.17.21",
    "nprogress": "^0.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.0",
    "vite": "^5.0.0",
    "unplugin-auto-import": "^0.17.2",
    "unplugin-vue-components": "^0.25.2",
    "sass": "^1.69.5",
    "eslint": "^8.54.0",
    "eslint-plugin-vue": "^9.18.1",
    "@typescript-eslint/parser": "^6.12.0",
    "@typescript-eslint/eslint-plugin": "^6.12.0"
  }
}
```

#### 3. Pinia 状态管理

**认证状态 (src/stores/auth.js)**
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getCurrentUser, refreshToken } from '@/api/auth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(getToken())
  const user = ref(null)
  const permissions = ref([])
  const roles = ref([])
  
  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => roles.value.includes('admin'))
  
  // 登录
  const loginAction = async (loginForm) => {
    try {
      const response = await login(loginForm)
      const { accessToken, user: userInfo } = response.data
      
      // 保存 token
      token.value = accessToken
      setToken(accessToken)
      
      // 保存用户信息
      user.value = userInfo
      roles.value = userInfo.roles || []
      permissions.value = userInfo.permissions || []
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败' 
      }
    }
  }
  
  // 获取用户信息
  const getUserInfo = async () => {
    try {
      const response = await getCurrentUser()
      const userInfo = response.data
      
      user.value = userInfo
      roles.value = userInfo.roles || []
      permissions.value = userInfo.permissions || []
      
      return userInfo
    } catch (error) {
      // Token 可能已过期，清除登录状态
      await logoutAction()
      throw error
    }
  }
  
  // 刷新 Token
  const refreshTokenAction = async () => {
    try {
      const response = await refreshToken()
      const { accessToken } = response.data
      
      token.value = accessToken
      setToken(accessToken)
      
      return true
    } catch (error) {
      await logoutAction()
      return false
    }
  }
  
  // 登出
  const logoutAction = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('登出接口调用失败:', error)
    } finally {
      // 清除本地状态
      token.value = null
      user.value = null
      roles.value = []
      permissions.value = []
      removeToken()
      
      // 重定向到登录页
      router.push('/login')
    }
  }
  
  // 检查权限
  const hasPermission = (permission) => {
    if (isAdmin.value) return true
    return permissions.value.includes(permission)
  }
  
  // 检查角色
  const hasRole = (role) => {
    return roles.value.includes(role)
  }
  
  return {
    // 状态
    token,
    user,
    permissions,
    roles,
    // 计算属性
    isAuthenticated,
    isAdmin,
    // 方法
    loginAction,
    getUserInfo,
    refreshTokenAction,
    logoutAction,
    hasPermission,
    hasRole
  }
})
```

**用户管理状态 (src/stores/user.js)**
```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as userApi from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // 状态
  const users = ref([])
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const loading = ref(false)
  const filters = ref({
    status: '',
    role: '',
    search: ''
  })
  
  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    loading.value = true
    try {
      const response = await userApi.getUsers({
        page: pagination.value.current,
        limit: pagination.value.pageSize,
        ...filters.value,
        ...params
      })
      
      users.value = response.data.users
      pagination.value = response.data.pagination
      
      return response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 创建用户
  const createUser = async (userData) => {
    try {
      const response = await userApi.createUser(userData)
      await fetchUsers() // 刷新列表
      return response.data
    } catch (error) {
      throw error
    }
  }
  
  // 更新用户
  const updateUser = async (userId, userData) => {
    try {
      const response = await userApi.updateUser(userId, userData)
      await fetchUsers() // 刷新列表
      return response.data
    } catch (error) {
      throw error
    }
  }
  
  // 删除用户
  const deleteUser = async (userId) => {
    try {
      await userApi.deleteUser(userId)
      await fetchUsers() // 刷新列表
    } catch (error) {
      throw error
    }
  }
  
  // 批量操作
  const batchOperation = async (operation, userIds) => {
    try {
      await userApi.batchOperation(operation, userIds)
      await fetchUsers() // 刷新列表
    } catch (error) {
      throw error
    }
  }
  
  // 设置过滤条件
  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
  }
  
  // 重置过滤条件
  const resetFilters = () => {
    filters.value = {
      status: '',
      role: '',
      search: ''
    }
  }
  
  // 设置分页
  const setPagination = (newPagination) => {
    pagination.value = { ...pagination.value, ...newPagination }
  }
  
  return {
    // 状态
    users,
    pagination,
    loading,
    filters,
    // 方法
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    batchOperation,
    setFilters,
    resetFilters,
    setPagination
  }
})
```

#### 4. 通用组件

**表格组件 (src/components/common/AppTable.vue)**
```vue
<template>
  <div class="app-table">
    <!-- 操作栏 -->
    <div class="table-header" v-if="$slots.header">
      <slot name="header"></slot>
    </div>
    
    <!-- 表格 -->
    <el-table
      :data="data"
      :loading="loading"
      v-bind="$attrs"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      style="width: 100%"
    >
      <slot></slot>
    </el-table>
    
    <!-- 分页 -->
    <div class="table-footer" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: () => ({})
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  }
})

const emit = defineEmits([
  'selection-change',
  'sort-change',
  'page-change',
  'size-change'
])

// 分页相关计算属性
const currentPage = computed({
  get: () => props.pagination.current || 1,
  set: (val) => emit('page-change', val)
})

const pageSize = computed({
  get: () => props.pagination.pageSize || 10,
  set: (val) => emit('size-change', val)
})

const total = computed(() => props.pagination.total || 0)

// 事件处理
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

const handleSortChange = (sort) => {
  emit('sort-change', sort)
}

const handleSizeChange = (size) => {
  emit('size-change', size)
}

const handleCurrentChange = (page) => {
  emit('page-change', page)
}
</script>

<style scoped>
.app-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.table-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
```

**表单组件 (src/components/common/AppForm.vue)**
```vue
<template>
  <el-form
    ref="formRef"
    :model="modelValue"
    :rules="rules"
    v-bind="$attrs"
    @submit.prevent
  >
    <template v-for="field in fields" :key="field.prop">
      <el-form-item
        :label="field.label"
        :prop="field.prop"
        :required="field.required"
        :label-width="field.labelWidth || labelWidth"
      >
        <!-- 输入框 -->
        <el-input
          v-if="field.type === 'input'"
          v-model="modelValue[field.prop]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :type="field.inputType || 'text'"
          v-bind="field.attrs"
        />
        
        <!-- 选择器 -->
        <el-select
          v-else-if="field.type === 'select'"
          v-model="modelValue[field.prop]"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :clearable="field.clearable !== false"
          v-bind="field.attrs"
        >
          <el-option
            v-for="option in field.options"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        
        <!-- 日期选择器 -->
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="modelValue[field.prop]"
          :type="field.dateType || 'date'"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          v-bind="field.attrs"
        />
        
        <!-- 开关 -->
        <el-switch
          v-else-if="field.type === 'switch'"
          v-model="modelValue[field.prop]"
          :disabled="field.disabled"
          v-bind="field.attrs"
        />
        
        <!-- 文本域 -->
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="modelValue[field.prop]"
          type="textarea"
          :placeholder="field.placeholder"
          :disabled="field.disabled"
          :rows="field.rows || 3"
          v-bind="field.attrs"
        />
        
        <!-- 自定义插槽 -->
        <slot
          v-else-if="field.type === 'slot'"
          :name="field.prop"
          :field="field"
        ></slot>
      </el-form-item>
    </template>
    
    <!-- 操作按钮 -->
    <el-form-item v-if="showButtons">
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ submitText }}
      </el-button>
      <el-button @click="handleReset" v-if="showReset">
        {{ resetText }}
      </el-button>
      <slot name="buttons"></slot>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  rules: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  showButtons: {
    type: Boolean,
    default: true
  },
  showReset: {
    type: Boolean,
    default: true
  },
  submitText: {
    type: String,
    default: '提交'
  },
  resetText: {
    type: String,
    default: '重置'
  },
  labelWidth: {
    type: String,
    default: '100px'
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset'])

const formRef = ref()

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    emit('submit', props.modelValue)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 重置表单
const handleReset = () => {
  formRef.value.resetFields()
  emit('reset')
}

// 验证表单
const validate = () => {
  return formRef.value.validate()
}

// 清除验证
const clearValidate = () => {
  formRef.value.clearValidate()
}

// 暴露方法给父组件
defineExpose({
  validate,
  clearValidate
})
</script>
```

#### 5. 用户管理页面

**用户列表页面 (src/views/system/User/Index.vue)**
```vue
<template>
  <div class="user-management">
    <!-- 搜索条件 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="searchForm.search"
            placeholder="请输入用户名或邮箱"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="暂停" value="suspended" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 用户列表 -->
    <AppTable
      :data="users"
      :loading="loading"
      :pagination="pagination"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #header>
        <div class="table-header">
          <div>
            <el-button
              type="primary"
              @click="handleCreate"
              v-if="hasPermission('user:create')"
            >
              新增用户
            </el-button>
            <el-button
              type="danger"
              @click="handleBatchDelete"
              :disabled="!selectedUsers.length"
              v-if="hasPermission('user:delete')"
            >
              批量删除
            </el-button>
          </div>
          <div>
            <el-button @click="handleExport">导出</el-button>
            <el-button @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>
      
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="profile.nickname" label="昵称" width="120" />
      <el-table-column prop="roles" label="角色" width="120">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role"
            size="small"
            :type="getRoleType(role)"
          >
            {{ getRoleLabel(role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginAt" label="最后登录" width="160">
        <template #default="{ row }">
          {{ formatDate(row.lastLoginAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="primary"
            @click="handleEdit(row)"
            v-if="hasPermission('user:update')"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(row)"
            v-if="hasPermission('user:delete')"
          >
            删除
          </el-button>
          <el-dropdown>
            <el-button link type="primary">
              更多<el-icon><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleResetPassword(row)">
                  重置密码
                </el-dropdown-item>
                <el-dropdown-item @click="handleToggleStatus(row)">
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </AppTable>
    
    <!-- 用户表单对话框 -->
    <UserFormDialog
      v-model:visible="dialogVisible"
      :user="currentUser"
      :mode="dialogMode"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import AppTable from '@/components/common/AppTable.vue'
import UserFormDialog from './components/UserFormDialog.vue'
import { formatDate } from '@/utils/format'

// Store
const userStore = useUserStore()
const authStore = useAuthStore()

// 响应式数据
const searchForm = reactive({
  search: '',
  status: '',
  role: ''
})

const selectedUsers = ref([])
const dialogVisible = ref(false)
const currentUser = ref(null)
const dialogMode = ref('create') // create | edit

// 计算属性
const users = computed(() => userStore.users)
const loading = computed(() => userStore.loading)
const pagination = computed(() => userStore.pagination)
const hasPermission = computed(() => authStore.hasPermission)

// 生命周期
onMounted(() => {
  fetchUsers()
})

// 方法
const fetchUsers = () => {
  userStore.fetchUsers()
}

const handleSearch = () => {
  userStore.setFilters(searchForm)
  userStore.setPagination({ current: 1 })
  fetchUsers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    status: '',
    role: ''
  })
  userStore.resetFilters()
  userStore.setPagination({ current: 1 })
  fetchUsers()
}

const handleCreate = () => {
  currentUser.value = null
  dialogMode.value = 'create'
  dialogVisible.value = true
}

const handleEdit = (user) => {
  currentUser.value = { ...user }
  dialogMode.value = 'edit'
  dialogVisible.value = true
}

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    await userStore.deleteUser(user._id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？`,
      '确认批量删除',
      { type: 'warning' }
    )
    
    const userIds = selectedUsers.value.map(user => user._id)
    await userStore.batchOperation('delete', userIds)
    ElMessage.success('批量删除成功')
    selectedUsers.value = []
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handlePageChange = (page) => {
  userStore.setPagination({ current: page })
  fetchUsers()
}

const handleSizeChange = (size) => {
  userStore.setPagination({ current: 1, pageSize: size })
  fetchUsers()
}

const handleDialogSuccess = () => {
  dialogVisible.value = false
  fetchUsers()
}

const handleRefresh = () => {
  fetchUsers()
}

const handleExport = () => {
  // TODO: 实现导出功能
  ElMessage.info('导出功能开发中...')
}

const handleResetPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${user.username}" 的密码吗？`,
      '确认重置密码',
      { type: 'warning' }
    )
    
    // TODO: 调用重置密码接口
    ElMessage.success('密码重置成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('密码重置失败')
    }
  }
}

const handleToggleStatus = async (user) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await userStore.updateUser(user._id, { status: newStatus })
    ElMessage.success('状态修改成功')
  } catch (error) {
    ElMessage.error(error.message || '状态修改失败')
  }
}

// 辅助函数
const getRoleType = (role) => {
  const typeMap = {
    admin: 'danger',
    operator: 'warning',
    user: 'info'
  }
  return typeMap[role] || 'info'
}

const getRoleLabel = (role) => {
  const labelMap = {
    admin: '管理员',
    operator: '操作员',
    user: '用户'
  }
  return labelMap[role] || role
}

const getStatusType = (status) => {
  const typeMap = {
    active: 'success',
    inactive: 'info',
    suspended: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    active: '活跃',
    inactive: '禁用',
    suspended: '暂停'
  }
  return labelMap[status] || status
}
</script>

<style scoped>
.user-management {
  padding: 16px;
}

.search-card {
  margin-bottom: 16px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
```

## 数据库设计

### MongoDB 集合设计

#### 1. 用户集合 (users)
```javascript
{
  _id: ObjectId,
  username: String,        // 用户名
  email: String,          // 邮箱
  phone: String,          // 手机号
  password: String,       // 密码哈希
  tenantId: String,       // 租户ID
  status: String,         // 状态: active, inactive, suspended
  roles: [String],        // 角色数组
  permissions: [String],  // 权限数组
  profile: {
    nickname: String,     // 昵称
    avatar: String,       // 头像URL
    realName: String,     // 真实姓名
    gender: String,       // 性别
    birthday: Date,       // 生日
    address: String       // 地址
  },
  settings: {
    language: String,     // 语言偏好
    timezone: String,     // 时区
    theme: String         // 主题
  },
  lastLoginAt: Date,      // 最后登录时间
  loginCount: Number,     // 登录次数
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.users.createIndex({ "tenantId": 1, "email": 1 }, { unique: true })
db.users.createIndex({ "tenantId": 1, "username": 1 }, { unique: true })
db.users.createIndex({ "tenantId": 1, "status": 1 })
db.users.createIndex({ "roles": 1 })
```

#### 2. 角色集合 (roles)
```javascript
{
  _id: ObjectId,
  name: String,           // 角色名称
  displayName: String,    // 显示名称
  description: String,    // 描述
  tenantId: String,       // 租户ID
  permissions: [String],  // 权限列表
  isSystem: Boolean,      // 是否系统角色
  status: String,         // 状态: active, inactive
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.roles.createIndex({ "tenantId": 1, "name": 1 }, { unique: true })
```

#### 3. 权限集合 (permissions)
```javascript
{
  _id: ObjectId,
  name: String,           // 权限名称 (如: user:create)
  displayName: String,    // 显示名称
  description: String,    // 描述
  resource: String,       // 资源名称 (如: user)
  action: String,         // 动作 (如: create, read, update, delete)
  category: String,       // 分类 (如: system, business)
  isSystem: Boolean,      // 是否系统权限
  createdAt: Date
}

// 索引
db.permissions.createIndex({ "name": 1 }, { unique: true })
db.permissions.createIndex({ "category": 1 })
```

#### 4. 商品集合 (products)
```javascript
{
  _id: ObjectId,
  name: String,           // 商品名称
  description: String,    // 商品描述
  category: String,       // 商品分类
  tenantId: String,       // 租户ID
  sku: String,           // SKU编码
  price: {
    original: Number,     // 原价
    current: Number,      // 现价
    currency: String      // 货币单位
  },
  inventory: {
    total: Number,        // 总库存
    available: Number,    // 可用库存
    reserved: Number      // 预留库存
  },
  specifications: [{
    name: String,         // 规格名称
    values: [String]      // 规格值
  }],
  images: [String],       // 图片URL数组
  status: String,         // 状态: active, inactive, draft
  tags: [String],         // 标签
  attributes: Mixed,      // 扩展属性
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.products.createIndex({ "tenantId": 1, "sku": 1 }, { unique: true })
db.products.createIndex({ "tenantId": 1, "status": 1 })
db.products.createIndex({ "category": 1 })
db.products.createIndex({ "tags": 1 })
```

#### 5. 订单集合 (orders)
```javascript
{
  _id: ObjectId,
  orderNo: String,        // 订单号
  tenantId: String,       // 租户ID
  userId: ObjectId,       // 用户ID
  status: String,         // 订单状态
  type: String,          // 订单类型: product, venue, service
  items: [{
    productId: ObjectId,
    name: String,
    sku: String,
    price: Number,
    quantity: Number,
    specifications: Object
  }],
  amount: {
    subtotal: Number,     // 小计
    discount: Number,     // 折扣
    shipping: Number,     // 运费
    tax: Number,         // 税费
    total: Number        // 总计
  },
  payment: {
    method: String,       // 支付方式
    status: String,       // 支付状态
    transactionId: String,// 交易ID
    paidAt: Date         // 支付时间
  },
  shipping: {
    address: Object,      // 收货地址
    method: String,       // 配送方式
    trackingNo: String,   // 物流单号
    shippedAt: Date      // 发货时间
  },
  timeline: [{
    action: String,       // 动作
    status: String,       // 状态
    note: String,         // 备注
    createdAt: Date      // 时间
  }],
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.orders.createIndex({ "tenantId": 1, "orderNo": 1 }, { unique: true })
db.orders.createIndex({ "tenantId": 1, "userId": 1 })
db.orders.createIndex({ "tenantId": 1, "status": 1 })
db.orders.createIndex({ "createdAt": -1 })
```

#### 6. 场馆集合 (venues)
```javascript
{
  _id: ObjectId,
  name: String,           // 场馆名称
  description: String,    // 场馆描述
  tenantId: String,       // 租户ID
  type: String,          // 场馆类型: badminton, tennis, basketball
  location: {
    address: String,      // 地址
    coordinates: [Number], // 经纬度 [lng, lat]
    city: String,         // 城市
    district: String      // 区域
  },
  facilities: [String],   // 设施列表
  courts: [{
    courtNo: String,      // 场地编号
    name: String,         // 场地名称
    type: String,         // 场地类型
    status: String,       // 状态: active, maintenance, inactive
    pricing: [{
      timeSlot: String,   // 时段
      price: Number       // 价格
    }]
  }],
  operatingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    // ... 其他工作日
  },
  images: [String],       // 图片URL数组
  contact: {
    phone: String,        // 联系电话
    email: String,        // 邮箱
    manager: String       // 负责人
  },
  status: String,         // 状态: active, inactive
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.venues.createIndex({ "tenantId": 1, "status": 1 })
db.venues.createIndex({ "location.coordinates": "2dsphere" })
db.venues.createIndex({ "type": 1 })
```

#### 7. 预订集合 (reservations)
```javascript
{
  _id: ObjectId,
  reservationNo: String,  // 预订号
  tenantId: String,       // 租户ID
  userId: ObjectId,       // 用户ID
  venueId: ObjectId,      // 场馆ID
  courtId: ObjectId,      // 场地ID
  date: Date,            // 预订日期
  timeSlots: [{
    start: String,        // 开始时间
    end: String,          // 结束时间
    price: Number         // 价格
  }],
  duration: Number,       // 时长(分钟)
  totalPrice: Number,     // 总价
  status: String,         // 状态: pending, confirmed, cancelled, completed
  payment: {
    method: String,       // 支付方式
    status: String,       // 支付状态
    transactionId: String,// 交易ID
    paidAt: Date         // 支付时间
  },
  participants: [{
    name: String,         // 参与者姓名
    phone: String         // 联系电话
  }],
  notes: String,          // 备注
  cancelReason: String,   // 取消原因
  cancelledAt: Date,      // 取消时间
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.reservations.createIndex({ "tenantId": 1, "reservationNo": 1 }, { unique: true })
db.reservations.createIndex({ "tenantId": 1, "userId": 1 })
db.reservations.createIndex({ "venueId": 1, "courtId": 1, "date": 1 })
db.reservations.createIndex({ "status": 1 })
db.reservations.createIndex({ "createdAt": -1 })
```

#### 8. 内容集合 (contents)
```javascript
{
  _id: ObjectId,
  title: String,          // 标题
  content: String,        // 内容
  type: String,          // 类型: notice, article, faq
  tenantId: String,       // 租户ID
  authorId: ObjectId,     // 作者ID
  category: String,       // 分类
  tags: [String],         // 标签
  status: String,         // 状态: draft, published, archived
  publishedAt: Date,      // 发布时间
  viewCount: Number,      // 查看次数
  likeCount: Number,      // 点赞数
  commentCount: Number,   // 评论数
  images: [String],       // 图片URL数组
  attachments: [{
    name: String,         // 文件名
    url: String,          // 文件URL
    size: Number          // 文件大小
  }],
  seo: {
    keywords: [String],   // 关键词
    description: String   // 描述
  },
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.contents.createIndex({ "tenantId": 1, "type": 1, "status": 1 })
db.contents.createIndex({ "authorId": 1 })
db.contents.createIndex({ "publishedAt": -1 })
db.contents.createIndex({ "tags": 1 })
```

### Redis 缓存策略

#### 1. 缓存键命名规范
```javascript
// 用户相关
user:{userId}                    // 用户详情
users:{tenantId}:list:{page}     // 用户列表分页缓存
user:{userId}:permissions        // 用户权限缓存
user:{userId}:sessions          // 用户会话

// 限流相关
rate_limit:api:{ip}:{tenantId}   // API 限流
rate_limit:login:{ip}:{email}    // 登录限流
rate_limit:user:{userId}         // 用户限流

// 业务相关
product:{productId}              // 商品详情
venue:{venueId}                  // 场馆详情
order:{orderId}                  // 订单详情

// 配置相关
config:{tenantId}:settings       // 租户配置
config:system:permissions        // 系统权限列表

// 统计相关
stats:{tenantId}:daily:{date}    // 日统计
stats:{tenantId}:hourly:{hour}   // 小时统计
```

#### 2. 缓存过期策略
```javascript
// 缓存时间配置
const CACHE_TTL = {
  USER_INFO: 300,         // 用户信息: 5分钟
  USER_PERMISSIONS: 600,  // 用户权限: 10分钟
  PRODUCT_INFO: 1800,     // 商品信息: 30分钟
  VENUE_INFO: 3600,       // 场馆信息: 1小时
  CONFIG: 7200,           // 配置信息: 2小时
  STATS_DAILY: 86400,     // 日统计: 24小时
  RATE_LIMIT: 60          // 限流: 1分钟
}
```

## API 设计规范

### RESTful API 约定

#### 1. URL 设计规范
```
GET    /api/v1/users              # 获取用户列表
POST   /api/v1/users              # 创建用户
GET    /api/v1/users/{id}         # 获取用户详情
PUT    /api/v1/users/{id}         # 更新用户
DELETE /api/v1/users/{id}         # 删除用户
POST   /api/v1/users/batch        # 批量操作

GET    /api/v1/products           # 获取商品列表
POST   /api/v1/products           # 创建商品
GET    /api/v1/products/{id}      # 获取商品详情
PUT    /api/v1/products/{id}      # 更新商品
DELETE /api/v1/products/{id}      # 删除商品

GET    /api/v1/orders             # 获取订单列表
POST   /api/v1/orders             # 创建订单
GET    /api/v1/orders/{id}        # 获取订单详情
PUT    /api/v1/orders/{id}        # 更新订单
POST   /api/v1/orders/{id}/cancel # 取消订单
POST   /api/v1/orders/{id}/pay    # 支付订单
```

#### 2. 请求参数规范
```javascript
// 查询参数
GET /api/v1/users?page=1&limit=10&status=active&search=john

// 排序参数
GET /api/v1/users?sort=createdAt&order=desc

// 字段过滤
GET /api/v1/users?fields=id,username,email,status

// 关联查询
GET /api/v1/orders?include=user,products
```

#### 3. 响应格式规范
```javascript
// 成功响应
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "current": 1,
      "pageSize": 10,
      "total": 100,
      "pages": 10
    }
  },
  "message": "操作成功",
  "timestamp": "2024-01-01T00:00:00.000Z"
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 4. HTTP 状态码约定
```javascript
200 OK          // 成功
201 Created     // 创建成功
204 No Content  // 删除成功
400 Bad Request // 请求参数错误
401 Unauthorized // 未授权
403 Forbidden   // 权限不足
404 Not Found   // 资源不存在
409 Conflict    // 资源冲突
422 Unprocessable Entity // 业务逻辑错误
429 Too Many Requests    // 请求过多
500 Internal Server Error // 服务器错误
```

### API 安全规范

#### 1. 认证机制
```javascript
// JWT Token 认证
Authorization: Bearer <access_token>

// API Key 认证 (中台对外)
X-API-Key: <api_key>
X-API-Secret: <api_secret>

// 租户识别
X-Tenant-ID: <tenant_id>
```

#### 2. 请求签名 (敏感操作)
```javascript
// 签名算法: HMAC-SHA256
const signature = crypto
  .createHmac('sha256', secretKey)
  .update(method + url + timestamp + body)
  .digest('hex')

// 请求头
X-Timestamp: <timestamp>
X-Signature: <signature>
```

#### 3. 接口权限控制
```javascript
// 权限装饰器
@RequirePermission('user:read')
async getUsers(req, res) {
  // 实现
}

// 角色检查
@RequireRole('admin')
async deleteUser(req, res) {
  // 实现
}
```

## 部署架构

### Docker 容器化部署

#### 1. 后端服务 Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源码
COPY src/ ./src/
COPY docs/ ./docs/

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE 3001

CMD ["node", "src/app.js"]
```

#### 2. 前端应用 Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose 配置
```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:7.0
    container_name: middleware-mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: middleware
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js
    ports:
      - "27017:27017"
    networks:
      - middleware-network

  # Redis
  redis:
    image: redis:7.2-alpine
    container_name: middleware-redis
    restart: unless-stopped
    command: redis-server --requirepass password
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - middleware-network

  # API Gateway
  api-gateway:
    build:
      context: ./apps/api-gateway
      dockerfile: Dockerfile
    container_name: middleware-gateway
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      REDIS_URL: redis://redis:6379
      MONGODB_URL: mongodb://admin:password@mongodb:27017/middleware?authSource=admin
    depends_on:
      - mongodb
      - redis
    ports:
      - "3001:3001"
    networks:
      - middleware-network

  # User Service
  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile
    container_name: middleware-user-service
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3002
      REDIS_URL: redis://redis:6379
      MONGODB_URL: mongodb://admin:password@mongodb:27017/middleware?authSource=admin
    depends_on:
      - mongodb
      - redis
    networks:
      - middleware-network

  # Product Service
  product-service:
    build:
      context: ./services/product-service
      dockerfile: Dockerfile
    container_name: middleware-product-service
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3003
      REDIS_URL: redis://redis:6379
      MONGODB_URL: mongodb://admin:password@mongodb:27017/middleware?authSource=admin
    depends_on:
      - mongodb
      - redis
    networks:
      - middleware-network

  # Admin Console
  admin-console:
    build:
      context: ./apps/admin-console
      dockerfile: Dockerfile
    container_name: middleware-admin-console
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - api-gateway
    networks:
      - middleware-network

  # Nginx (反向代理)
  nginx:
    image: nginx:alpine
    container_name: middleware-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - admin-console
      - api-gateway
    networks:
      - middleware-network

volumes:
  mongodb_data:
  redis_data:

networks:
  middleware-network:
    driver: bridge
```

#### 4. Nginx 配置
```nginx
# infrastructure/nginx/nginx.conf
upstream api_gateway {
    least_conn;
    server api-gateway:3001;
}

upstream admin_console {
    least_conn;
    server admin-console:80;
}

# API 服务
server {
    listen 80;
    server_name api.middleware.local;

    # API 限流
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://api_gateway/health;
    }
}

# 管理控制台
server {
    listen 80;
    server_name admin.middleware.local;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://admin_console;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 监控与日志

#### 1. 应用监控配置
```javascript
// src/monitoring/metrics.js
const promClient = require('prom-client');

// 创建指标注册表
const register = new promClient.Registry();

// 默认指标 (CPU, 内存等)
promClient.collectDefaultMetrics({ register });

// 自定义指标
const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'tenant_id'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'tenant_id'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register]
});

const databaseConnectionPool = new promClient.Gauge({
  name: 'database_connection_pool_size',
  help: 'Current database connection pool size',
  registers: [register]
});

const redisConnections = new promClient.Gauge({
  name: 'redis_connections_active',
  help: 'Active Redis connections',
  registers: [register]
});

module.exports = {
  register,
  httpRequestTotal,
  httpRequestDuration,
  databaseConnectionPool,
  redisConnections
};
```

#### 2. 监控中间件
```javascript
// src/middleware/monitoring.js
const { httpRequestTotal, httpRequestDuration } = require('../monitoring/metrics');

const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // 请求完成时记录指标
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const tenantId = req.user?.tenantId || 'anonymous';
    
    // 记录请求总数
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode, tenantId)
      .inc();
    
    // 记录请求耗时
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, tenantId)
      .observe(duration);
  });
  
  next();
};

module.exports = monitoringMiddleware;
```

## 开发规范

### 代码规范

#### 1. ESLint 配置 (.eslintrc.js)
```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error'
  }
}
```

#### 2. Git 提交规范
```bash
# 提交类型
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式调整
refactor: 重构代码
test:     测试相关
chore:    构建过程或辅助工具的变动

# 提交格式
<type>(<scope>): <subject>

# 示例
feat(user): 添加用户批量删除功能
fix(auth): 修复token刷新逻辑
docs(api): 更新用户接口文档
```

#### 3. 分支管理策略
```bash
master/main    # 主分支 (生产环境)
develop        # 开发分支 (测试环境)
feature/*      # 功能分支
hotfix/*       # 紧急修复分支
release/*      # 发布分支
```

### 测试规范

#### 1. 单元测试示例
```javascript
// tests/services/userService.test.js
const userService = require('../../src/services/userService');
const User = require('../../src/models/User');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant1'
      };

      const mockUser = { ...userData, _id: 'user123' };
      User.prototype.save = jest.fn().mockResolvedValue(mockUser);

      const result = await userService.createUser(userData);

      expect(result).toEqual(mockUser);
      expect(User.prototype.save).toHaveBeenCalled();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        tenantId: 'tenant1'
      };

      User.prototype.save = jest.fn().mockRejectedValue({
        code: 11000,
        message: 'Duplicate key error'
      });

      await expect(userService.createUser(userData))
        .rejects.toThrow('Duplicate key error');
    });
  });
});
```

#### 2. 集成测试示例
```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Auth Endpoints', () => {
  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'admin@example.com',
        password: 'password123',
        tenantId: 'tenant1'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'admin@example.com',
        password: 'wrongpassword',
        tenantId: 'tenant1'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('认证失败');
    });
  });
});
```

## 实施路线

### 第一阶段：基础架构搭建 (2-3周)

#### 周1-2: 后端基础服务
- [ ] 搭建基础项目结构和 monorepo
- [ ] 实现用户认证服务 (JWT + Passport)
- [ ] 实现用户管理服务 (CRUD + 权限)
- [ ] 配置 MongoDB + Redis + 基础中间件
- [ ] 实现 API 网关和限流机制
- [ ] 编写 OpenAPI 文档

#### 周3: 前端控制台基础
- [ ] 搭建 Vue3 + Element Plus 项目结构
- [ ] 实现登录页面和认证流程
- [ ] 实现用户管理页面 (列表/创建/编辑)
- [ ] 实现权限控制和路由守卫
- [ ] 集成 Pinia 状态管理

### 第二阶段：核心业务模块 (3-4周)

#### 周4-5: 商品管理
- [ ] 实现商品管理服务 (CRUD + 库存)
- [ ] 实现商品分类和规格管理
- [ ] 实现商品管理前端页面
- [ ] 实现图片上传和管理
- [ ] 实现商品批量操作

#### 周6-7: 订单管理
- [ ] 实现订单管理服务 (订单流程)
- [ ] 实现支付集成 (模拟支付网关)
- [ ] 实现订单管理前端页面
- [ ] 实现订单状态流转
- [ ] 实现订单统计和报表

### 第三阶段：场馆和预订系统 (3-4周)

#### 周8-9: 场馆管理
- [ ] 实现场馆管理服务
- [ ] 实现场地和时段管理
- [ ] 实现场馆管理前端页面
- [ ] 实现地图集成 (可选)
- [ ] 实现场馆营业时间配置

#### 周10-11: 预订系统
- [ ] 实现预订管理服务
- [ ] 实现预订冲突检测
- [ ] 实现预订管理前端页面
- [ ] 实现预订日历组件
- [ ] 实现预订统计分析

### 第四阶段：内容管理和监控 (2-3周)

#### 周12-13: 内容管理
- [ ] 实现内容管理服务 (公告/文章)
- [ ] 实现富文本编辑器集成
- [ ] 实现内容管理前端页面
- [ ] 实现内容分类和标签
- [ ] 实现内容发布流程

#### 周14: 监控和完善
- [ ] 实现系统监控和指标收集
- [ ] 实现日志管理和查询
- [ ] 实现仪表盘和图表展示
- [ ] 性能优化和压力测试
- [ ] 完善文档和部署脚本

### 第五阶段：中台能力输出 (2周)

#### 周15-16: SDK 和 API 完善
- [ ] 实现浏览器 SDK 和 Node.js SDK
- [ ] 完善 OpenAPI 文档和示例
- [ ] 实现开发者文档门户
- [ ] 实现 API 调试工具
- [ ] 实现多租户隔离和配额管理

## 总结

基于 Vue3 + Express + MongoDB + Redis 的技术中台方案具有以下优势：

1. **技术栈统一**: 前后端都使用 JavaScript/TypeScript，降低学习成本
2. **快速开发**: 利用成熟框架和组件库，提升开发效率
3. **扩展性好**: 模块化架构支持服务拆分和水平扩展
4. **易于维护**: 统一的代码规范和项目结构
5. **成本可控**: 开源技术栈，避免厂商绑定

关键成功因素：
- 严格按照分层架构设计，保持代码结构清晰
- 重视缓存策略和性能优化
- 完善的测试覆盖和监控体系
- 渐进式实施，避免一次性大重构
- 持续的代码 Review 和技术分享

建议根据团队实际情况调整实施计划，优先实现核心业务价值，再逐步完善平台能力。