# EasyPrompt API 设计文档（v0.1）

**风格**：RESTful（为前后端分离而设计）  
**鉴权**：JWT（`Authorization: Bearer <token>`） + Workspace 级权限  
**返回统一格式**：`{ "code": 0, "data": <payload>, "message": "ok", "traceId": "<uuid>" }`  
**错误码**：`code != 0`，例如 `40001(参数错误) / 40101(未登录) / 40301(无权限) / 40401(资源不存在) / 50000(服务异常)`  
**分页**：`?page=1&pageSize=20`，返回头或 data 中包含 `total/page/pageSize`  
**速率限制**：默认 `60 req/min/ip`，登录后按套餐级别提升  
**版本**：`/api/v1/*`

---

## 目录
- [鉴权与用户管理](#鉴权与用户管理)
- [工作空间 & API Key](#工作空间--api-key)
- [任务管理（Prompt 调优 / 视觉理解 / 多轮对话）](#任务管理prompt-调优--视觉理解--多轮对话)
- [Prompt 模板与编排](#prompt-模板与编排)
- [知识库（KB）与文档](#知识库kb与文档)
- [记忆（Memory Engine）](#记忆memory-engine)
- [对话与消息](#对话与消息)
- [评测与批量测试](#评测与批量测试)
- [订阅 / 套餐 / 积分](#订阅--套餐--积分)
- [模型路由与供应商](#模型路由与供应商)
- [运营与审计](#运营与审计)
- [Prisma Schema 建议](#prisma-schema-建议)
- [环境变量](#环境变量)

---

## 鉴权与用户管理

### POST /api/v1/auth/register
- **body**: `{ email, password, name }`
- **resp**: `user + token`  
- 规则：密码强度校验，邮箱唯一

### POST /api/v1/auth/login
- **body**: `{ email, password }`
- **resp**: `{ token, user }`

### GET /api/v1/auth/me
- **resp**: 当前用户信息

### PATCH /api/v1/users/:id
- **body**: `{ name?, avatarUrl? }`

---

## 工作空间 & API Key

### POST /api/v1/workspaces
- **body**: `{ name }`
- **resp**: `workspace`（创建者为 owner）

### GET /api/v1/workspaces
- 列表 + 角色（owner/admin/member）

### POST /api/v1/workspaces/:id/members
- **body**: `{ userId, role }`

### GET /api/v1/workspaces/:id/apikeys
### POST /api/v1/workspaces/:id/apikeys
- **resp**: `{ id, name, keyMasked, createdAt }`（明文仅创建时返回一次）
- **说明**：按截图支持“选择使用”

---

## 任务管理（Prompt 调优 / 视觉理解 / 多轮对话）

**任务 Task**：承载一次 Prompt 优化或评测的对象，可关联 KB / 模板 / 变量。

### GET /api/v1/tasks
- 过滤：`?type=prompt|vision|chat&keyword=`

### POST /api/v1/tasks
- **body**: `{ name, type, workspaceId, kbId?, templateId?, variables? }`

### GET /api/v1/tasks/:id
### PATCH /api/v1/tasks/:id
### DELETE /api/v1/tasks/:id

---

## Prompt 模板与编排

### GET /api/v1/templates
### POST /api/v1/templates
- **body**: `{ name, type, systemText?, userText?, variables:[{key,desc,required,default}] }`

### POST /api/v1/orchestrate/preview
- **body**: `{ templateId, input, kbIds?, memoryOn?, model?, variables? }`
- **resp**: `{ promptPreview, tokensEstimate }`

### POST /api/v1/orchestrate/execute
- 调用 LLM，返回模型输出（可流式 SSE）
- **body**: 同上 + `{ streaming?: true }`

---

## 知识库（KB）与文档

### GET /api/v1/kb
### POST /api/v1/kb
- **body**: `{ name, description? }`

### POST /api/v1/kb/:kbId/files
- **form-data**: `file`（pdf/docx/md/txt）
- **流程**：解析 → 分块 → Embedding → 写向量库 → 建立 file/doc 记录

### GET /api/v1/kb/:kbId/files
### DELETE /api/v1/kb/:kbId/files/:fileId

### POST /api/v1/kb/search
- **body**: `{ kbIds:[id], query, topK=5 }`
- **resp**: `[{ docId, chunkId, text, score, metadata }]`

---

## 记忆（Memory Engine）

### 短时记忆（Session Memory）
- 自动挂接在对话 session 上，由后端在 Redis 维护最近 N 轮。

### 长时记忆（Long-term Memory）

#### GET /api/v1/memory
- 过滤：`?scope=user|workspace&tag=`

#### POST /api/v1/memory
- **body**: `{ scope:"user|workspace", content, weight?: "high|normal", tags?: string[] }`

#### PATCH /api/v1/memory/:id
#### DELETE /api/v1/memory/:id

> 编排层会按权重与相关度注入到 Prompt。

---

## 对话与消息

### POST /api/v1/chat/sessions
- **body**: `{ workspaceId, kbIds?, templateId?, model?, title? }`

### GET /api/v1/chat/sessions
### GET /api/v1/chat/sessions/:id

### POST /api/v1/chat/sessions/:id/messages
- **body**: `{ role: "user"|"assistant"|"system", content, attachments? }`
- **resp**: `{ message, streamingUrl? }`（流式 SSE 可选）

### GET /api/v1/chat/sessions/:id/messages
- 支持分页

---

## 评测与批量测试

### POST /api/v1/eval/datasets
- **body**: `{ name, items:[{input, expected?, vars?}] }`

### POST /api/v1/eval/run
- **body**: `{ taskId?, templateId, datasetId, kbIds?, model, metrics:["exact","bleu","rouge","llm-judge"], parallel?: 5 }`
- **resp**: `{ runId }`

### GET /api/v1/eval/run/:runId
- 结果明细、指标统计、失败样本

---

## 订阅 / 套餐 / 积分

### GET /api/v1/billing/plans
### POST /api/v1/billing/subscribe
- **body**: `{ planId, channel:"wechat|alipay|stripe", autoRenew?:true }`

### GET /api/v1/billing/current
- 返回当前套餐（到期时间、积分、KB 配额）

### POST /api/v1/credits/grant
- 管理员为工作空间发放积分

---

## 模型路由与供应商

### GET /api/v1/models
- 返回可用模型列表（`name, provider, contextWindow, price`）

### POST /api/v1/models/test
- **body**: `{ model, prompt }`

> 后端保留路由策略：如“文本生成用 Qwen，复杂推理用 GLM”。

---

## 运营与审计

### GET /api/v1/audit/logs
- 过滤：`?userId=&type=login|chat|kb_upload&dateStart=&dateEnd=`

### GET /api/v1/metrics/usage
- 统计调用量、平均响应时间、失败率、tokens 消耗

---

## Prisma Schema 建议

> 关键表：`User`、`Workspace`、`Membership`、`ApiKey`、`Task`、`Template`、`KnowledgeBase`、`File`、`DocChunk`、`ChatSession`、`Message`、`MemoryItem`、`EvalDataset`、`EvalRun`、`Subscription`、`CreditLedger`。

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
generator client {
  provider = "prisma-client-js"
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  passwordHash String
  name         String?
  avatarUrl    String?
  memberships  Membership[]
  apiKeys      ApiKey[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Workspace {
  id           String        @id @default(cuid())
  name         String
  ownerId      String
  owner        User          @relation(fields: [ownerId], references: [id])
  memberships  Membership[]
  tasks        Task[]
  templates    Template[]
  knowledgeBases KnowledgeBase[]
  apiKeys      ApiKey[]
  subscriptions Subscription[]
  creditLedgers CreditLedger[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Membership {
  id           String   @id @default(cuid())
  role         Role
  userId       String
  workspaceId  String
  user         User     @relation(fields: [userId], references: [id])
  workspace    Workspace @relation(fields: [workspaceId], references: [id])

  @@unique([userId, workspaceId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

model ApiKey {
  id           String    @id @default(cuid())
  name         String
  keyHash      String
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  createdAt    DateTime  @default(now())
}

model Task {
  id           String    @id @default(cuid())
  name         String
  type         TaskType
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  templateId   String?
  template     Template? @relation(fields: [templateId], references: [id])
  kbId         String?
  kb           KnowledgeBase? @relation(fields: [kbId], references: [id])
  variables    Json?
  createdById  String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum TaskType {
  PROMPT
  VISION
  CHAT
}

model Template {
  id           String   @id @default(cuid())
  name         String
  type         TaskType
  systemText   String?
  userText     String?
  variables    Json?    // [{key,desc,required,default}]
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model KnowledgeBase {
  id           String   @id @default(cuid())
  name         String
  description  String?
  workspaceId  String
  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  files        File[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model File {
  id           String   @id @default(cuid())
  kbId         String
  kb           KnowledgeBase @relation(fields: [kbId], references: [id])
  name         String
  mimeType     String
  size         Int
  storageUrl   String
  chunks       DocChunk[]
  createdAt    DateTime @default(now())
}

model DocChunk {
  id         String  @id @default(cuid())
  fileId     String
  file       File    @relation(fields: [fileId], references: [id])
  idx        Int
  text       String
  embedding  Bytes?  // 或外部向量库 id
  metadata   Json?
}

model ChatSession {
  id           String  @id @default(cuid())
  title        String?
  workspaceId  String
  kbIds        String[]
  templateId   String?
  model        String?
  createdById  String
  createdAt    DateTime @default(now())
  messages     Message[]
}

model Message {
  id           String  @id @default(cuid())
  sessionId    String
  session      ChatSession @relation(fields: [sessionId], references: [id])
  role         String
  content      String
  tokens       Int?
  latencyMs    Int?
  createdAt    DateTime @default(now())
}

model MemoryItem {
  id           String   @id @default(cuid())
  scope        MemoryScope
  workspaceId  String?
  userId       String?
  content      String
  weight       MemoryWeight @default(NORMAL)
  tags         String[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum MemoryScope {
  USER
  WORKSPACE
}

enum MemoryWeight {
  HIGH
  NORMAL
}

model EvalDataset {
  id           String  @id @default(cuid())
  name         String
  workspaceId  String
  items        Json    // [{input, expected?, vars?}] 大型可拆分表存储
  createdAt    DateTime @default(now())
}

model EvalRun {
  id           String  @id @default(cuid())
  workspaceId  String
  templateId   String?
  taskId       String?
  datasetId    String
  model        String
  metrics      Json    // {exact, bleu, rouge, llm-judge}
  result       Json    // 明细
  createdAt    DateTime @default(now())
}

model Subscription {
  id           String  @id @default(cuid())
  workspaceId  String
  planId       String
  status       String
  expireAt     DateTime
  createdAt    DateTime @default(now())
}

model CreditLedger {
  id           String  @id @default(cuid())
  workspaceId  String
  delta        Int
  reason       String
  createdAt    DateTime @default(now())
}
```

---

## 环境变量

```env
# backend/.env
PORT=3000
NODE_ENV=production

DATABASE_URL=postgresql://user:pass@db:5432/easyprompt
REDIS_URL=redis://redis:6379

# 向量库（任选其一）
MILVUS_URL=http://milvus:19530
WEAVIATE_URL=http://weaviate:8080

# LLM 供应商
LLM_PROVIDER_DEFAULT=qwen
QWEN_API_KEY=xxxx
GLM_API_KEY=xxxx
BAICHUAN_API_KEY=xxxx

# JWT & 安全
JWT_SECRET=change_me
RATE_LIMIT_PER_MIN=60
```

> 提示：使用 **Prisma Studio** 打开数据库：`npx prisma studio`  
> 迁移：`npx prisma migrate dev --name init`  
> 生成客户端：`npx prisma generate`

---

## 备注
- 所有 `POST/PUT/PATCH` 需进行服务端校验，防止注入与越权。  
- 上传文件应做 MIME 与大小限制，并进行异步解析与分块（可使用队列）。  
- 对话与执行建议提供 **SSE** 流式接口以提升交互体验（Arco 前端可用 EventSource 或 fetch+ReadableStream）。
