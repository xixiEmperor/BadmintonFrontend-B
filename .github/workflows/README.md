# GitHub Actions CI/CD 部署指南

本项目已配置了完整的 CI/CD 流水线，当推送到 `main` 分支时会自动触发构建和部署。

## 工作流程说明

流水线包含以下步骤：
1. **代码检出** - 从仓库拉取最新代码
2. **环境设置** - 配置 Node.js 18 和 pnpm
3. **依赖安装** - 安装项目依赖
4. **代码检查** - 运行 ESLint 检查代码质量
5. **项目构建** - 执行 `pnpm run build` 构建生产版本
6. **部署** - 根据配置部署到目标平台

## 部署选项配置

在 `.github/workflows/deploy.yml` 文件中，你可以根据需要取消注释以下任一部署选项：

### 选项1：GitHub Pages（推荐）
适用于静态网站托管，无需额外配置，开箱即用。

### 选项2：自定义服务器（SSH）
需要配置以下 Secrets：
- `SERVER_HOST`: 服务器地址
- `SERVER_USER`: SSH 用户名
- `SSH_PRIVATE_KEY`: SSH 私钥
- `SERVER_PORT`: SSH 端口（可选，默认22）

### 选项3：Netlify
需要配置以下 Secrets：
- `NETLIFY_AUTH_TOKEN`: Netlify 认证令牌
- `NETLIFY_SITE_ID`: Netlify 站点 ID

### 选项4：Vercel
需要配置以下 Secrets：
- `VERCEL_TOKEN`: Vercel 令牌
- `VERCEL_ORG_ID`: Vercel 组织 ID
- `VERCEL_PROJECT_ID`: Vercel 项目 ID

### 选项5：Docker 部署
使用提供的 Dockerfile 构建 Docker 镜像。

## 配置步骤

### 1. 设置 GitHub Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加必要的秘钥。

### 2. 选择部署目标

编辑 `.github/workflows/deploy.yml` 文件，取消注释你想要使用的部署选项。

### 3. 推送代码

推送代码到 `main` 分支将自动触发部署流水线。

## Docker 部署

如果选择 Docker 部署，请确保：

1. 构建镜像：
   ```bash
   docker build -t your-app .
   ```

2. 运行容器：
   ```bash
   docker run -d -p 80:80 your-app
   ```

## 注意事项

- 确保所有敏感信息都存储在 GitHub Secrets 中，不要硬编码在代码中
- 生产环境建议使用 HTTPS 和适当的安全配置
- 定期更新依赖包以保持安全性
- 监控部署状态和日志输出

## 故障排除

如果部署失败：

1. 检查 GitHub Actions 日志
2. 确认所有必要的 Secrets 已正确配置
3. 验证构建产物是否正确生成在 `dist` 目录
4. 检查目标平台的配置和权限
