# 个人报告归档系统 - NextJS全栈实现计划

## 1. 需求分析

### 1.1 现有系统现状

当前系统为纯前端静态页面，使用 `localStorage` 存储报告数据，包含：

- `index.html`: 前端展示页（浏览、搜索、筛选）
- `admin.html`: 管理后台（上传、编辑、删除）

### 1.2 用户需求拆解

| 序号 | 需求点    | 描述                     | 当前状态                  |
| -- | ------ | ---------------------- | --------------------- |
| 1  | 文档CRUD | 上传的文档需要支持完整的增删改查       | 部分实现（前端localStorage）  |
| 2  | 后端登录   | 需要后端登录认证，不在前端直接展示      | 未实现                   |
| 3  | 文件存储   | HTML页面存储到指定目录，支持后续分类上传 | 未实现（当前仅存localStorage） |
| 4  | 页面重构   | 使用NextJS重构页面           | 未实现                   |

***

## 2. 技术方案设计

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    NextJS 全栈应用                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              前端层 (Client Components)              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │   首页    │  │  管理后台 │  │  登录页   │          │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │   │
│  └───────┼─────────────┼─────────────┼─────────────────┘   │
│          │             │             │                       │
│  ┌───────▼─────────────▼─────────────▼─────────────────┐   │
│  │              服务层 (Server Components/API)          │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │    /api/auth    /api/reports   /api/upload  │    │   │
│  │  └───────────────────┬─────────────────────────┘    │   │
│  └───────────────────────┼──────────────────────────────┘   │
│                          │                                   │
└───────────────────────────▼─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ SQLite   │ │ NextAuth │ │ uploads/ │
        │ 数据库   │ │  认证    │ │  文件目录 │
        └──────────┘ └──────────┘ └──────────┘
```

### 2.2 技术栈选择

| 层级   | 技术              | 版本  | 说明              |
| ---- | --------------- | --- | --------------- |
| 框架   | NextJS          | 14+ | App Router，全栈开发 |
| 样式   | Tailwind CSS    | 3+  | 现代化CSS框架        |
| 图标   | Lucide React    | 最新  | 轻量图标            |
| 数据库  | Prisma + SQLite | 最新  | ORM + 嵌入式数据库    |
| 认证   | NextAuth.js     | 4+  | 身份认证            |
| 文件存储 | 本地文件系统          | -   | 按分类存储到指定目录      |

### 2.3 目录结构

```
d:\Codes\reports\
├── app/                        # NextJS App Router
│   ├── api/                    # API路由
│   │   ├── auth/               # NextAuth配置
│   │   ├── reports/            # 报告CRUD
│   │   │   ├── route.ts        # GET/POST
│   │   │   └── [id]/           # PUT/DELETE
│   │   └── upload/             # 文件上传
│   ├── (public)/               # 公开页面
│   │   └── page.tsx            # 首页展示
│   ├── (admin)/                # 后台页面（需登录）
│   │   ├── admin/              # 管理后台
│   │   │   └── page.tsx
│   │   └── login/              # 登录页面
│   │       └── page.tsx
│   ├── layout.tsx              # 根布局
│   └── globals.css             # 全局样式
├── uploads/                    # 文件存储目录
│   ├── day/                    # 日报
│   ├── week/                   # 周报
│   └── month/                  # 月报
├── prisma/                     # Prisma配置
│   └── schema.prisma           # 数据库schema
├── lib/                        # 工具库
│   ├── auth.ts                 # 认证工具
│   ├── prisma.ts               # Prisma客户端
│   └── storage.ts              # 文件存储工具
├── components/                 # 公共组件
│   ├── ReportCard.tsx          # 报告卡片
│   ├── SearchBar.tsx           # 搜索栏
│   ├── FilterTabs.tsx          # 筛选标签
│   └── Modal.tsx               # 弹窗组件
├── package.json
├── next.config.js
└── tailwind.config.js
```

### 2.4 数据库设计

**Report 模型**

```prisma
model Report {
  id          String   @id @default(cuid())
  title       String
  type        String   // day/week/month
  typeText    String   // 日报/周报/月报
  topic       String
  filePath    String   // 文件存储路径
  createTime  DateTime @default(now())
  updateTime  DateTime @updatedAt
}
```

**User 模型（NextAuth自动管理）**

### 2.5 API接口设计

| 接口路径                | HTTP方法   | 功能       | 是否需要认证 |
| ------------------- | -------- | -------- | ------ |
| `/api/auth/signin`  | GET/POST | 用户登录     | 否      |
| `/api/auth/signout` | POST     | 用户登出     | 是      |
| `/api/reports`      | GET      | 获取报告列表   | 否（公开）  |
| `/api/reports/{id}` | GET      | 获取单个报告   | 否（公开）  |
| `/api/reports`      | POST     | 新增报告     | 是      |
| `/api/reports/{id}` | PUT      | 更新报告     | 是      |
| `/api/reports/{id}` | DELETE   | 删除报告     | 是      |
| `/api/upload`       | POST     | 上传HTML文件 | 是      |

***

## 3. 实现步骤

### 3.1 项目初始化（Phase 1）

| 步骤 | 任务             | 说明                                    |
| -- | -------------- | ------------------------------------- |
| 1  | 创建NextJS项目     | `npx create-next-app@14.0.0 .`        |
| 2  | 安装依赖           | Tailwind CSS 3、Prisma、NextAuth、Lucide |
| 3  | 配置Tailwind CSS | 更新tailwind.config.js和globals.css      |
| 4  | 初始化Prisma      | `npx prisma init`                     |
| 5  | 配置数据库schema    | 创建Report模型                            |
| 6  | 运行数据库迁移        | `npx prisma migrate dev`              |

### 3.2 认证模块（Phase 2）

| 步骤 | 任务         | 说明                                  |
| -- | ---------- | ----------------------------------- |
| 1  | 配置NextAuth | 创建/api/auth/\[...nextauth]/route.ts |
| 2  | 实现登录页面     | app/(admin)/login/page.tsx          |
| 3  | 保护后台路由     | 使用middleware.ts进行认证检查               |

### 3.3 报告CRUD（Phase 3）

| 步骤 | 任务        | 说明                     |
| -- | --------- | ---------------------- |
| 1  | 创建API路由   | /api/reports/route.ts  |
| 2  | 实现文件上传API | /api/upload/route.ts   |
| 3  | 创建工具函数    | lib/storage.ts（文件存储管理） |

### 3.4 页面开发（Phase 4）

| 步骤 | 任务    | 说明                         |
| -- | ----- | -------------------------- |
| 1  | 首页展示  | app/(public)/page.tsx      |
| 2  | 管理后台  | app/(admin)/admin/page.tsx |
| 3  | 公共组件  | components/目录下的UI组件        |
| 4  | 集成API | 前后端联调                      |

### 3.5 样式优化（Phase 5）

| 步骤 | 任务    | 说明        |
| -- | ----- | --------- |
| 1  | 响应式设计 | 适配移动端和桌面端 |
| 2  | 动画效果  | 平滑过渡、加载状态 |
| 3  | 主题配色  | 统一设计风格    |

***

## 4. 关键实现细节

### 4.1 文件存储方案

```
uploads/
├── day/           # 日报目录
│   └── {cuid}_{title}.html
├── week/          # 周报目录
│   └── {cuid}_{title}.html
└── month/         # 月报目录
    └── {cuid}_{title}.html
```

- 文件名格式：`{cuid}_{标题}.html`
- 文件路径存储在数据库的 `filePath` 字段
- 使用 `fs` 模块进行文件读写操作

### 4.2 NextAuth认证方案

- 使用CredentialsProvider进行用户名密码登录
- Session存储在cookie中（HttpOnly）
- 使用middleware保护/admin路由

### 4.3 安全性考虑

| 风险点    | 解决方案                               |
| ------ | ---------------------------------- |
| 文件上传漏洞 | 限制文件类型仅允许HTML，使用safe-filename处理文件名 |
| 路径遍历攻击 | 使用path.join和resolve确保安全路径          |
| 未授权访问  | NextAuth middleware保护敏感路由          |
| SQL注入  | Prisma ORM自动处理参数化查询                |

***

## 5. 依赖与环境

### 5.1 package.json

```json
{
  "dependencies": {
    "@next-auth/prisma-adapter": "^1.0.7",
    "@prisma/client": "^5.6.0",
    "bcryptjs": "^2.4.3",
    "lucide-react": "^0.263.0",
    "next": "^14.0.0",
    "next-auth": "^4.24.5",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.40",
    "@types/react-dom": "^18.2.17",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "prisma": "^5.6.0",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.3.2"
  }
}
```

***

## 6. 风险与应对

| 风险     | 应对策略                          |
| ------ | ----------------------------- |
| 文件存储容量 | 定期清理旧文件，或配置存储配额               |
| 并发访问   | NextJS自带优化，生产环境可配置ISR         |
| 前端状态管理 | 使用React Server Components获取数据 |

***

## 7. 交付物

| 交付物           | 说明         |
| ------------- | ---------- |
| `app/`        | NextJS应用代码 |
| `api/`        | API路由      |
| `components/` | UI组件       |
| `lib/`        | 工具函数       |
| `uploads/`    | 文件存储目录     |
| `prisma/`     | Prisma配置   |
| `README.md`   | 项目说明文档     |

***

## 8. 后续扩展建议

1. **权限管理**：支持多用户、角色权限
2. **文件格式扩展**：支持Markdown、PDF等格式
3. **搜索优化**：全文搜索、关键词高亮
4. **数据导出**：支持批量导出报告
5. **部署方案**：Vercel或Docker容器化部署

