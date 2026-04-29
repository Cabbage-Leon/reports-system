# Vercel 部署指南

## 部署前准备

### 1. 克隆项目到 GitHub

```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/your-username/reports-system.git
git branch -M main
git push -u origin main
```

### 2. 创建 Vercel 账号

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "New Project" 导入项目

### 3. 创建 Vercel Postgres 数据库

1. 在 Vercel Dashboard 中点击 "Storage"
2. 选择 "Create Database"
3. 选择 "Postgres"
4. 选择区域（推荐：iad1 - 美东）
5. 复制连接字符串

### 4. 配置环境变量

在 Vercel Project Settings → Environment Variables 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | Vercel Postgres 连接字符串 |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | 你的 Vercel 应用 URL |
| `NEXTAUTH_SECRET` | `随机32位密钥` | 使用 `openssl rand -base64 32` 生成 |

### 5. 部署

点击 "Deploy" 开始部署，Vercel 会自动：
- 安装依赖
- 运行 Prisma 生成和数据库迁移
- 构建并启动应用

## 部署后配置

### 创建管理员账号

部署完成后，运行以下命令创建初始管理员：

```bash
# 使用 Vercel CLI
vercel run npm -- run db:create-user

# 或直接在数据库中插入
```

### 验证部署

1. 访问 `https://your-app.vercel.app`
2. 访问 `https://your-app.vercel.app/admin`
3. 使用管理员账号登录

## 本地开发（连接到生产数据库）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接本地项目到 Vercel
vercel link

# 下载环境变量
vercel env pull .env.local

# 运行开发服务器
npm run dev
```

## 常见问题

### 1. 数据库连接失败
确保 `DATABASE_URL` 格式正确，包含 `sslmode=require`

### 2. NextAuth 回调错误
确保 `NEXTAUTH_URL` 与实际访问 URL 完全匹配（包含 https://）

### 3. Prisma 生成失败
在本地运行 `npx prisma generate` 后重新部署

## 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: Vercel Postgres (PostgreSQL)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **样式**: Tailwind CSS
- **部署**: Vercel
