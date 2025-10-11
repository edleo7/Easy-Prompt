# 📘 EasyPrompt - Prompt 增强与记忆管理平台

## 项目简介

EasyPrompt 是一款面向企业与个人的 **Prompt 增强与记忆管理平台**。通过 **Memory Engine（记忆引擎）** 与 **Prompt Orchestration（提示词编排）**，解决大模型在上下文有限、提示词不稳定、知识库管理困难的问题。

## 技术栈

### 前端
- **框架**: React 18 + Vite
- **UI 组件库**: Arco Design
- **状态管理**: Redux Toolkit
- **路由**: React Router
- **网络请求**: Axios + React Query

### 后端
- **语言 & 框架**: Node.js + Express
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **缓存**: Redis
- **向量数据库**: Milvus
- **容器化**: Docker

## 项目结构

```
EasyPrompt/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/         # 公共组件
│   │   │   └── arco-design/   # Arco Design 组件库
│   │   ├── pages/             # 页面组件
│   │   │   ├── Home.jsx       # 首页
│   │   │   ├── TaskManagement.jsx  # 任务管理
│   │   │   ├── PromptEditor.jsx    # Prompt 编辑器
│   │   │   ├── KnowledgeBase.jsx   # 知识库管理
│   │   │   └── Settings.jsx        # 系统设置
│   │   ├── store/             # 状态管理
│   │   ├── services/         # API 封装
│   │   ├── utils/             # 工具函数
│   │   ├── App.jsx            # 应用入口
│   │   └── main.jsx           # 渲染入口
│   ├── package.json           # 前端依赖
│   ├── vite.config.js         # Vite 配置
│   ├── Dockerfile             # 前端容器配置
│   └── nginx.conf             # Nginx 配置
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── api/               # API 路由
│   │   │   ├── auth.js        # 认证相关
│   │   │   ├── tasks.js       # 任务管理
│   │   │   ├── prompts.js     # Prompt 管理
│   │   │   ├── knowledge.js   # 知识库管理
│   │   │   └── users.js       # 用户管理
│   │   ├── controllers/       # 控制器
│   │   ├── services/          # 业务服务
│   │   ├── models/            # 数据模型
│   │   ├── adapters/          # LLM 适配器
│   │   ├── utils/             # 工具函数
│   │   │   ├── auth.js        # 认证中间件
│   │   │   └── errorHandler.js # 错误处理
│   │   └── app.js             # 应用入口
│   ├── prisma/
│   │   └── schema.prisma      # 数据库模型定义
│   ├── package.json           # 后端依赖
│   ├── Dockerfile             # 后端容器配置
│   └── env.example            # 环境变量示例
├── docker-compose.yml         # Docker 编排配置
└── README.md                  # 项目说明
```

## 文件夹说明

### 前端 (frontend/)
- **src/components/**: 公共组件，包含基于 Arco Design 的二次封装组件
- **src/pages/**: 页面组件，包含各个功能模块的页面
- **src/store/**: Redux 状态管理
- **src/services/**: API 接口封装
- **src/utils/**: 工具函数和通用方法

### 后端 (backend/)
- **src/api/**: RESTful API 路由定义
- **src/controllers/**: 控制器，处理业务逻辑
- **src/services/**: 核心业务服务（Memory Engine、Prompt Orchestration）
- **src/models/**: Prisma 数据模型
- **src/adapters/**: LLM 模型适配器
- **src/utils/**: 工具函数、中间件、错误处理

### 数据库相关
- **prisma/schema.prisma**: 数据库模型定义
- **prisma/migrations/**: 数据库迁移文件

## 快速开始

### 1. 环境准备
```bash
# 安装 Node.js 18+
# 安装 Docker 和 Docker Compose
# 安装 PostgreSQL、Redis、Milvus
```

### 2. 克隆项目
```bash
git clone <repository-url>
cd EasyPrompt
```

### 3. 配置环境变量
```bash
# 复制环境变量文件
cp backend/env.example backend/.env

# 编辑 .env 文件，配置数据库连接等信息
```

### 4. 启动服务
```bash
# 使用 Docker Compose 启动所有服务
docker-compose up -d

# 或者分别启动前后端
cd frontend && npm install && npm run dev
cd backend && npm install && npm run dev
```

### 5. 数据库初始化
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma studio  # 打开数据库管理界面
```

## 开发指南

### 前端开发
```bash
cd frontend
npm install
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run preview    # 预览构建结果
```

### 后端开发
```bash
cd backend
npm install
npm run dev        # 启动开发服务器
npm run db:generate # 生成 Prisma 客户端
npm run db:push    # 推送数据库变更
npm run db:studio  # 打开 Prisma Studio
```

## 功能模块

### 1. 任务管理
- 创建和管理 Prompt 任务
- 支持多种任务类型（Prompt 调优、视觉理解、多轮对话）
- 任务状态跟踪和进度管理

### 2. Prompt 编辑器
- 可视化 Prompt 编辑
- 变量替换和动态拼接
- 实时预览和执行
- Prompt 模板管理

### 3. 知识库管理
- 文档上传和解析（PDF、Word、Markdown）
- 自动分块和向量化
- 语义搜索和检索
- 知识库绑定任务

### 4. 记忆引擎
- 短时记忆（Redis 缓存）
- 长时记忆（数据库存储）
- 上下文管理和拼接
- 记忆检索和调用

### 5. 系统设置
- API Key 管理
- 模型配置
- 用户权限管理
- 系统参数设置

## 部署说明

### Docker 部署
```bash
# 构建和启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 生产环境配置
1. 配置环境变量
2. 设置数据库连接
3. 配置 Redis 和 Milvus
4. 设置 LLM API Key
5. 配置反向代理和 SSL

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

## 许可证

MIT License
