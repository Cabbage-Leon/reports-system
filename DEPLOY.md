# Vercel 部署指南

## 环境变量配置

### 开发环境 (.env.local)

```bash
# 复制模板
cp .env.example .env.local

# SQLite 本地数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="你的开发密钥"

# 应用
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 生产环境 (Vercel)

在 Vercel Dashboard → Project Settings → Environment Variables 中配置：

| 变量名               | 值                             | 说明                    |
| ----------------- | ----------------------------- | --------------------- |
| `DATABASE_URL`    | `postgresql://...`            | Vercel Postgres 连接字符串 |
| `NEXTAUTH_URL`    | `https://your-app.vercel.app` | 你的 Vercel 应用 URL      |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`     | 随机密钥（生产专用）            |

## 部署步骤

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/reports-system.git
git push -u origin main
```

### 2. Vercel 部署

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "New Project" → 导入仓库
4. 在 "Environment Variables" 中添加：

```
DATABASE_URL = postgresql://user:password@host:5432/db?sslmode=require
NEXTAUTH_URL = https://your-app.vercel.app
NEXTAUTH_SECRET = 生成的新密钥
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

1. 点击 "Deploy"

### 3. 创建数据库表

Vercel 会自动在构建时运行 `prisma db push`，但如果需要手动执行：

```bash
vercel run npx prisma db push
```

### 4. 创建管理员账号

```bash
# 方法 1: 使用 Vercel CLI
vercel run npx tsx scripts/init-user.ts

# 方法 2: 访问 /admin 页面自动重定向到登录
```

## NEXTAUTH\_SECRET 生成方法

```bash
# Linux / macOS / Git Bash
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 常见问题

### 1. DATABASE\_URL 格式错误

确保 PostgreSQL 连接字符串包含 `?sslmode=require`

正确格式：

```
postgresql://user:password@host:5432/database?sslmode=require
```

### 2. NEXTAUTH\_URL 不匹配

生产环境的 `NEXTAUTH_URL` 必须与实际访问的 URL 完全一致

### 3. 构建失败

检查 Vercel Build Log，确保 Prisma 生成成功：

```
npx prisma generate && next build
```

## 本地开发连接生产数据库

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 下载环境变量
vercel env pull .env.local

# 运行开发服务器
npm run dev
```

