### Nginx 新手入门与部署实践（面向 Vite/React 前端项目）

适合谁：从未用过或刚开始使用 Nginx 的同学。本文以你的前端项目（Vite 7 + React 19）为例，手把手带你完成安装、基本概念、常用命令、静态站点托管、反向代理 API 和 WebSocket、HTTPS 配置、压缩与缓存优化、CORS、安全头、日志与排错等。

---

### 1. 安装 Nginx

#### 1.1 Ubuntu/Debian（推荐部署环境）

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx
sudo systemctl status nginx
# 防火墙（如使用 UFW）：
sudo ufw allow 'Nginx Full'
```

默认重要路径：
- 主配置：`/etc/nginx/nginx.conf`
- 站点配置：`/etc/nginx/sites-available/` 与 `sites-enabled/`
- 日志：`/var/log/nginx/access.log`、`/var/log/nginx/error.log`

#### 1.2 CentOS/RHEL

```bash
sudo yum install -y epel-release
sudo yum install -y nginx
sudo systemctl enable --now nginx
```

#### 1.3 macOS（开发机）

```bash
brew install nginx
brew services start nginx
# 默认监听 8080；主配置：/opt/homebrew/etc/nginx/nginx.conf
```

---

### 2. 基本概念速读

- Master/Worker：Nginx 主进程负责管理，工作进程处理请求，通常多进程并发。
- 配置结构：
  - `nginx.conf` 为入口；常见会 `include /etc/nginx/conf.d/*.conf` 或 `sites-enabled/*`。
  - `http` 块里可定义 `server`（虚拟主机），每个 `server` 里包含多个 `location`（路由匹配）。
- 关键指令：
  - `server`：一个域名站点（监听端口、域名、证书等）。
  - `location`：路径匹配，决定如何处理该路径请求（静态/代理/重写）。
  - `upstream`：定义后端集群，配合 `proxy_pass` 做负载均衡。
  - `root` vs `alias`：`root` 将 URI 附在目录后；`alias` 用于替换匹配到的前缀。

---

### 3. 常用命令与配置管理

```bash
# 语法检查
sudo nginx -t

# 重新加载配置（零停机）
sudo nginx -s reload
# 或
sudo systemctl reload nginx

# 启停服务
sudo systemctl start|stop|restart nginx

# 查看监听端口
sudo ss -ltnp | grep nginx
```

建议：每次改动配置后，先 `nginx -t` 检查，再 reload。

---

### 4. 将 Vite 构建产物（dist）作为静态站点托管

步骤：
1) 生成前端产物

```bash
pnpm build
# 产物默认在项目根目录的 dist/ 下
```

2) 拷贝产物到服务器目录（示例）

```bash
sudo mkdir -p /var/www/admin-frontend/dist
sudo rsync -av --delete ./dist/ /var/www/admin-frontend/dist/
```

3) 新建站点配置（Ubuntu 示例）

创建文件：`/etc/nginx/sites-available/admin-frontend.conf`

```nginx
server {
    listen 80;
    server_name example.com; # 换成你的域名或服务器 IP

    root /var/www/admin-frontend/dist;
    index index.html;
    charset utf-8;

    # SPA 路由：找不到静态文件时回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存（针对带 hash 的文件效果最佳）
    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    # index.html 不缓存，便于新版本即时生效
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store";
    }

    # 基础安全响应头（入门版）
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";

    # 压缩（需编译模块支持才可用 brotli；gzip 默认可用）
    gzip on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml font/woff2;
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/admin-frontend.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

---

### 5. 反向代理后端 API 与 WebSocket

假设后端 REST 在 `http://127.0.0.1:8080`，WebSocket 在 `ws://127.0.0.1:9000`：

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/admin-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # REST API 反代
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 上传较大文件时：
        # client_max_body_size 20m;
        # 超时策略：
        # proxy_read_timeout 60s;
    }

    # WebSocket 反代（如你的项目有 /ws 的实时能力）
    location /ws/ {
        proxy_pass http://127.0.0.1:9000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

提示：如你的后端需要 Cookie/Session，确保 `proxy_set_header Host` 与跨域策略正确，或直接同域部署减少跨域复杂度。

---

### 6. HTTPS（Let’s Encrypt 免费证书）

安装 certbot 与 nginx 插件（Ubuntu）：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
# 证书自动续期服务会自动安装
```

或手动配置（示例）：

```nginx
# 80 端口做到 443 的跳转
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf; # 推荐安全套件
    ssl_trusted_certificate /etc/letsencrypt/live/example.com/chain.pem;

    root /var/www/admin-frontend/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /ws/ {
        proxy_pass http://127.0.0.1:9000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

可选：启用 HSTS（确保 HTTPS 稳定后再开启）

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 7. 压缩与缓存策略（前端性能）

- 压缩：`gzip on;` 基本够用；如需 brotli 需安装带 brotli 模块的 Nginx 或使用反向代理如 CDN。
- 缓存：对带内容哈希的静态资源设置长缓存；对 `index.html` 禁止缓存。

示例片段：

```nginx
gzip on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml font/woff2;

location ~* \.(?:js|css|woff2?|ttf|png|jpg|jpeg|gif|svg)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800, immutable";
}
location = /index.html { expires -1; add_header Cache-Control "no-store"; }
```

---

### 8. CORS 跨域（如前后端不同域）

如需允许前端域访问后端 API：

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080/;
    add_header Access-Control-Allow-Origin https://admin.example.com always; # 或 *
    add_header Access-Control-Allow-Credentials true always;
    add_header Access-Control-Allow-Headers * always;
    add_header Access-Control-Allow-Methods GET,POST,PUT,DELETE,OPTIONS,PATCH always;
    if ($request_method = OPTIONS) { return 204; }
}
```

建议：优先同域部署避免复杂的 CORS 和 Cookie 问题。

---

### 9. 日志与问题排查

常用：

```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

调试 502/504：
- 502 多为后端未启动/地址错误/权限/SELinux
- 504 多为后端处理慢，调大 `proxy_read_timeout` 或优化后端

常见问题：
- SPA 刷新 404：缺少 `try_files $uri $uri/ /index.html;`
- 413 上传超限：加 `client_max_body_size 20m;`
- WebSocket 失败：缺少 `Upgrade/Connection` 头或未启用 `proxy_http_version 1.1`
- 证书过期：`sudo certbot renew --dry-run` 检查续期

---

### 10. 进阶：负载均衡与多后端

```nginx
upstream api_upstream {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    # 可配置 weight、max_fails、fail_timeout 等
}

server {
    listen 80;
    server_name example.com;
    root /var/www/admin-frontend/dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://api_upstream; }
}
```

---

### 11. 在 macOS 开发环境用 Nginx 反代 Vite Dev Server（可选）

若你希望通过 `https://local.dev.test` 访问本地 Vite（默认 5000）：

1) 在 hosts 中映射（仅示例）

```bash
sudo sh -c 'echo "127.0.0.1 local.dev.test" >> /etc/hosts'
```

2) 生成自签名证书（或使用 mkcert）后，配置 Nginx：

```nginx
server {
    listen 443 ssl http2;
    server_name local.dev.test;
    ssl_certificate     /path/to/dev.crt;
    ssl_certificate_key /path/to/dev.key;

    # 将所有请求代理到 Vite Dev Server
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;  # 支持 HMR WebSocket
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

启动/重载：

```bash
brew services restart nginx
```

---

### 12. 完整模板（可直接复制修改）

将以下内容保存为 `/etc/nginx/sites-available/admin-frontend.conf`，并按注释替换域名与路径：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改为你的域名或服务器 IP
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # 改为你的域名

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;    # 改证书路径
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;   # 改证书路径
    include /etc/letsencrypt/options-ssl-nginx.conf;

    root /var/www/admin-frontend/dist;  # 改为你的 dist 路径
    index index.html;
    charset utf-8;

    # 性能：压缩 + 缓存
    gzip on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml font/woff2;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store";
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;  # 改为你的后端地址
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # client_max_body_size 20m;       # 如需更大上传
        # proxy_read_timeout 60s;         # 如需更长超时
    }

    # WebSocket 反代（如需要）
    location /ws/ {
        proxy_pass http://127.0.0.1:9000/;  # 改为你的 WS 服务地址
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 基础安全响应头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
}
```

启用配置并重载：

```bash
sudo ln -s /etc/nginx/sites-available/admin-frontend.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo nginx -s reload
```

---

### 13. 结语

到这里，你已经掌握：安装 Nginx、配置静态站点（Vite 构建产物）、配置 API 与 WebSocket 反代、开启 HTTPS、做压缩与缓存优化、设置跨域与安全头、查看日志与排错。若你提供部署域名、后端端口与服务器系统，我可以直接根据你的环境生成可用的配置文件并指导上线。

