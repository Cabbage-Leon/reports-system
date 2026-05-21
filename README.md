# Reports System

一个基于 Next.js 构建的报告管理系统，提供报告的创建、浏览、搜索和管理功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: PostgreSQL (Vercel Postgres)
- **ORM**: Prisma
- **认证**: NextAuth.js
- **样式**: TailwindCSS 3
- **图标**: Lucide React
- **密码加密**: bcryptjs

## 功能特性

- ✅ 用户认证（邮箱/密码登录）
- ✅ 报告列表展示
- ✅ 报告搜索与过滤
- ✅ 报告详情查看
- ✅ 报告上传功能
- ✅ 主题标签分类
- ✅ 统计数据展示
- ✅ 管理员后台管理

## 快速开始

### 前置条件

- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL 数据库

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 为 `.env` 并配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://user:password@localhost:5432/reports_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 数据库初始化

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 项目结构

```
.
├── app/                      # Next.js App Router 目录
│   ├── api/                  # API 路由
│   │   ├── auth/             # 认证相关
│   │   ├── reports/          # 报告管理
│   │   ├── stats/            # 统计数据
│   │   └── topics/           # 主题管理
│   ├── admin/                # 管理员页面
│   ├── login/                # 登录页面
│   └── layout.tsx            # 根布局
├── components/               # 公共组件
│   ├── FilterTabs.tsx        # 过滤标签
│   ├── Modal.tsx             # 模态框
│   ├── ReportCard.tsx        # 报告卡片
│   ├── SearchBar.tsx         # 搜索栏
│   ├── SessionWrapper.tsx    # 会话包装器
│   └── TopicTags.tsx         # 主题标签
├── lib/                      # 工具库
│   ├── auth.ts               # 认证配置
│   └── prisma.ts             # Prisma 客户端
├── prisma/                   # Prisma 配置
│   └── schema.prisma         # 数据库 schema
├── scripts/                  # 脚本文件
│   └── build.js              # 构建脚本
├── .env                      # 环境变量
├── next.config.js            # Next.js 配置
├── tailwind.config.js        # TailwindCSS 配置
└── package.json              # 项目配置
```

## 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm run db:push` | 推送数据库 schema |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:studio` | 启动 Prisma Studio |

## Vercel 部署

### 环境变量配置

在 Vercel Dashboard 的 Environment Variables 中添加以下变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | Vercel Postgres 连接字符串 |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | 安全的随机字符串 |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |

### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 点击 Deploy 按钮

## 许可证

MIT License