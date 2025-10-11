# 📘 EasyPrompt README (PRD 文档)

## 1. 项目简介
**EasyPrompt** 是一款面向企业与个人的 **Prompt 增强与记忆管理平台**。  
它借鉴了 PromptPilot 的产品交互风格，通过 **Memory Engine（记忆引擎）** 与 **Prompt Orchestration（提示词编排）**，解决大模型在上下文有限、提示词不稳定、知识库管理困难的问题。  

目标：  
- **比微调更轻** → 无需重新训练模型  
- **比单纯 Prompt 更强** → 具备长期记忆与知识调用能力  
- **前后端分离** → 前端基于 Arco Design，后端基于 Node/Express  
- **数据库与管理** → 使用 PostgreSQL，并通过 Prisma Studio 管理数据库  

---

## 2. 架构设计

### 总体架构
```
用户交互层（Web/移动端）
        ↓
前端应用（React + Arco Design）
        ↓
API 网关（Node.js / Express）
        ↓
业务服务层
    ├── Memory Engine（记忆引擎）
    ├── Prompt Orchestration（提示词编排）
    ├── Knowledge Base（知识库检索 + 向量数据库）
    └── LLM Adapter（模型接入层：Qwen, GLM, Baichuan...）
        ↓
数据库与存储
    ├── PostgreSQL（用户 & 任务数据，Prisma ORM 管理）
    ├── 向量数据库（Milvus / Weaviate / Pinecone）
    └── 日志 & 监控（ElasticSearch + Grafana）
```

---

## 3. 功能模块

### 3.1 前端功能（基于 Arco Design）
参考 PromptPilot 的交互原型，主要页面：  
- **任务管理**  
  - 新建任务 / 查看任务  
  - 任务分类（Prompt 调优 / 视觉理解 / 多轮对话）  
- **Prompt 生成功能**  
  - 自然语言描述 → 自动生成标准化 Prompt  
  - 集成知识库引用  
- **Prompt 调试**  
  - 填充变量、生成模型回答、对比评测  
  - 优化与批量测试功能  
- **知识库管理**  
  - 上传文件（PDF/Doc/Markdown）  
  - 自动分块 + 向量化  
  - 绑定任务，辅助 Prompt 调优  
- **多轮对话**  
  - 模拟对话，支持上下文拼接  
- **API Key 管理**  
  - 用户生成 / 管理个人 API Key  
- **订阅与积分体系**  
  - 支持免费版与标准版套餐（参考截图样式）  

### 3.2 后端功能
- **用户服务**
  - 登录/注册/订阅权限管理 (JWT + Prisma ORM)  
- **Memory Engine**
  - 短时记忆：Redis 缓存会话  
  - 长时记忆：Prisma + 向量库存储摘要  
- **Prompt Orchestration**
  - Prompt 模板化（变量替换）  
  - 动态拼接（输入 + 记忆 + 知识库）  
- **Knowledge Base**
  - 文档解析 → Embedding  
  - 语义检索（Top-k Recall）  
- **LLM Adapter**
  - 多模型适配层，支持 Qwen/GLM/Baichuan  
  - 模型路由机制  

---

## 4. 技术栈

### 前端
- **框架**：React + Vite  
- **UI 组件库**：Arco Design（[GitHub 仓库](https://github.com/arco-design/arco-design.git)，需保持版本一致）  
- **状态管理**：Redux Toolkit / Recoil  
- **网络请求**：Axios / React Query  
- **构建与部署**：Vite + Docker  

### 后端
- **语言 & 框架**：Node.js (Express)  
- **ORM 工具**：Prisma（支持 Prisma Studio 图形化数据库客户端）  
- **数据库**：PostgreSQL  
- **缓存**：Redis  
- **向量数据库**：Milvus / Weaviate  
- **模型接入**：OpenAI / Qwen / ChatGLM / Baichuan API  
- **容器化**：Docker + Kubernetes  

---

## 5. 目录结构

### 前端
```
frontend/
├── src/
│   ├── assets/         # 静态资源
│   ├── components/     # 公共组件（基于 Arco Design 二次封装）
│   ├── pages/          # 页面组件（任务管理、Prompt 编辑、知识库等）
│   ├── store/          # 状态管理
│   ├── services/       # API 封装
│   ├── utils/          # 工具函数
│   └── App.jsx
├── package.json
└── vite.config.js
```

### 后端
```
backend/
├── src/
│   ├── api/            # 路由定义
│   ├── controllers/    # 控制器
│   ├── services/       # Memory Engine & Prompt Orchestration
│   ├── models/         # Prisma Schema（对应 PostgreSQL）
│   ├── adapters/       # LLM Adapter
│   ├── utils/          # 工具 & 中间件
│   └── app.js
├── prisma/
│   ├── schema.prisma   # Prisma 数据模型定义
│   └── migrations/     # 数据库迁移文件
├── package.json
└── docker-compose.yml
```

---

## 6. 开发规范

- **代码风格**：ESLint + Prettier  
- **提交规范**：Conventional Commits  
- **分支策略**：Git Flow (main / develop / feature)  
- **接口规范**：RESTful API，统一返回格式 `{ code, data, message }`  
- **组件规范**：二次封装 Arco Design，保证 UI 一致性  

---

## 7. 部署与运维

### 部署流程
1. 前端构建（Vite → dist → Nginx 托管）  
2. 后端服务容器化（Express + Docker）  
3. PostgreSQL 初始化 & Prisma migrate  
4. 使用 Prisma Studio 打开数据库进行数据管理  
5. 配置环境变量（API Keys, DB URL, Redis URL）  

### 环境变量示例
```
# backend/.env
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/easyprompt
REDIS_URL=redis://localhost:6379
VECTOR_DB_URL=http://localhost:19530
LLM_PROVIDER=qwen
LLM_API_KEY=xxxxx
```

### 运维
- **监控**：Prometheus + Grafana  
- **日志**：ElasticSearch + Kibana  
- **容灾**：多模型切换，主备数据库  

---

## 8. 项目路线图

- **MVP 阶段（0-3个月）**  
  - Prompt 生成/调试界面  
  - 知识库导入 + 简单检索  
  - 对话 + 短时记忆  
- **Beta 阶段（3-6个月）**  
  - 长时记忆管理  
  - Prompt 批量测试与优化  
  - 积分与订阅体系  
- **正式版（6-12个月）**  
  - 私有化部署方案  
  - 企业级协同功能  
  - 行业定制解决方案  

---

## 9. 愿景
> **EasyPrompt = 让 AI 更懂你**  
让每一次 Prompt 都不再是“从零开始”，而是“基于记忆与知识的持续优化”。  
