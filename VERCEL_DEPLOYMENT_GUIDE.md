# Vercel 部署配置指南

## 环境变量配置清单

在 Vercel Dashboard 中进入项目 → Settings → Environment Variables，添加以下环境变量：

### 1. 数据库配置（必需）

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `DATABASE_URL` | Vercel Postgres 连接字符串 | `postgresql://...` |

**获取方式**：
1. 进入 Vercel Dashboard → Storage
2. 点击已创建的 Postgres 数据库
3. 复制 Connection String

### 2. NextAuth 配置（必需）

| 环境变量 | 说明 | 生成方式 |
|---------|------|---------|
| `NEXTAUTH_URL` | 网站 URL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | 加密密钥 | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | 前端 URL | `https://your-app.vercel.app` |

**生成密钥**：
```bash
openssl rand -base64 32
```

### 3. Vercel Blob 存储配置（必需 - 用于文件上传）

| 环境变量 | 说明 | 获取方式 |
|---------|------|---------|
| `BLOB_READ_WRITE_TOKEN` | Blob 存储访问令牌 | Vercel Storage 自动生成 |

**获取方式**：
1. 进入 Vercel Dashboard → 项目 → Storage
2. 点击已创建的 Blob 存储
3. 在 Quickstart 或 Token 页面复制 Token

## Storage 创建步骤

### 创建 Vercel Postgres

1. Vercel Dashboard → Storage → Connect Store → Postgres
2. 选择区域（建议选择与应用相同的区域）
3. 创建数据库
4. 复制 Connection String 到 `DATABASE_URL` 环境变量

### 创建 Vercel Blob

1. Vercel Dashboard → Storage → Connect Store → Blob
2. 给存储命名（如：`reports-blob`）
3. 选择权限：Public（公开访问）或 Private（需要签名 URL）
4. 点击 Create
5. 自动生成 `BLOB_READ_WRITE_TOKEN`，复制到环境变量

## 环境变量配置示例

```
# 数据库
DATABASE_URL=postgresql://abc123:def456@db.xxx.vercel-storage.com:5432/vercel_db

# NextAuth
NEXTAUTH_URL=https://reports-system-eight.vercel.app
NEXTAUTH_SECRET=bG9jYWxob3N0X3NlY3JldF9rZXlfZm9yX3Byb2R1Y3Rpb24
NEXT_PUBLIC_APP_URL=https://reports-system-eight.vercel.app

# Blob 存储（自动生成）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx...
```

## 本地开发配置

本地开发时，在 `.env` 文件中配置：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reports_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**注意**：
- 本地开发需要本地 PostgreSQL 数据库
- Blob 存储 Token 本地不需要配置（Vercel SDK 会自动使用服务器端 Token）

## 部署后验证

部署完成后，访问以下地址验证配置：

1. 主页面：`https://your-app.vercel.app`
2. 登录页面：`https://your-app.vercel.app/login`
3. 统计 API：`https://your-app.vercel.app/api/stats`
4. 上传测试：登录后尝试上传报告

## 常见问题

### Q1: 文件上传返回 500 错误

**检查项**：
1. Vercel Blob 是否正确创建
2. `BLOB_READ_WRITE_TOKEN` 是否配置
3. 查看 Vercel Functions 日志排查具体错误

### Q2: 数据库连接失败

**检查项**：
1. `DATABASE_URL` 是否正确配置
2. Postgres 数据库是否在 Vercel Storage 中创建
3. Connection String 是否完整

### Q3: 版本信息不显示

**检查项**：
1. 确认构建日志中有版本生成信息
2. 检查 `public/version.json` 是否存在
3. 确认 Vercel 环境能访问 public 目录