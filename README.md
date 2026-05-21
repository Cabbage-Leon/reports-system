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
- **动画**: Framer Motion
- **存储**: Vercel Blob
- **密码加密**: bcryptjs

## 功能特性

### 已完成
- ✅ 用户认证（邮箱/密码登录）
- ✅ 报告列表展示（列表/卡片视图切换）
- ✅ 报告搜索与过滤（按类型、主题、关键词）
- ✅ 报告详情查看（内嵌预览）
- ✅ 报告上传功能
- ✅ 主题标签分类
- ✅ 管理员后台管理
- ✅ 移动端响应式设计
- ✅ 现代化 UI 设计与动画效果
- ✅ 主题可编辑
- ✅ Vercel Blob 私有存储配置
- ✅ 版本管理与自动构建

### 页面
- **首页** (`/`): 报告列表、搜索、过滤、视图切换
- **管理后台** (`/admin`): 报告上传、管理
- **登录** (`/login`): 用户认证

## 快速开始

### 前置条件

- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL 数据库
- Vercel Blob 存储（可选）

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
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
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
│   │   ├── topics/           # 主题管理
│   │   └── ...
│   ├── admin/                # 管理员页面
│   ├── login/                # 登录页面
│   ├── page.tsx              # 首页
│   ├── layout.tsx            # 根布局
│   └── globals.css           # 全局样式
├── components/               # 公共组件
│   ├── FilterTabs.tsx        # 过滤标签
│   ├── Modal.tsx             # 模态框
│   ├── ReportCard.tsx        # 报告卡片
│   ├── SearchBar.tsx         # 搜索栏
│   ├── SessionWrapper.tsx    # 会话包装器
│   ├── TopicTags.tsx         # 主题标签
│   └── VersionBadge.tsx      # 版本徽章
├── lib/                      # 工具库
│   ├── auth-options.ts       # NextAuth 配置
│   ├── auth.ts               # 认证配置
│   ├── prisma.ts             # Prisma 客户端
│   └── storage.ts            # Vercel Blob 存储
├── prisma/                   # Prisma 配置
│   └── schema.prisma         # 数据库 schema
├── scripts/                  # 脚本文件
│   ├── build.js              # 构建脚本
│   ├── generate-version.js   # 版本生成
│   └── init-user.ts          # 用户初始化
├── public/                   # 静态资源
│   └── version.json          # 版本信息
├── middleware.ts             # NextAuth 中间件
├── .env.example              # 环境变量示例
├── next.config.js            # Next.js 配置
├── tailwind.config.js        # TailwindCSS 配置
└── package.json              # 项目配置
```

## 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本（含版本生成） |
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
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 存储 token |

### 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 点击 Deploy 按钮

## 后续待办事项

### 高优先级
- [ ] 添加报告导出功能（PDF、Word）
- [ ] 实现报告编辑和删除功能
- [ ] 添加用户个人资料页面
- [ ] 优化报告搜索算法（全文搜索）
- [ ] 添加报告评论和反馈功能

### 中优先级
- [ ] 实现报告分享功能
- [ ] 添加报告归档和批量操作
- [ ] 实现数据统计和可视化图表
- [ ] 添加邮件通知功能
- [ ] 支持多语言（i18n）

### 低优先级
- [ ] 添加深色/浅色主题切换
- [ ] 实现报告模板功能
- [ ] 添加报告收藏和标签管理
- [ ] 优化性能和缓存策略
- [ ] 添加单元测试和 E2E 测试

## 许可证

MIT License