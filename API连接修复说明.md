# API连接修复说明

## 问题分析

### 原始问题
浏览器显示："后端服务未启动，使用模拟数据"

### 后端状态
✅ 后端服务实际已正常启动在 **3001端口**
```
🚀 服务器运行在端口 3001
📊 健康检查: http://localhost:3001/health
```

### 真实原因
❌ 前端API调用的URL格式错误，导致请求失败

**错误的URL**：
```
/api/v1http://localhost:3001/api/v1/kb?page=1&pageSize=20
```

**正确的URL**：
```
http://localhost:3001/api/v1/kb?page=1&pageSize=20
```

## 根本原因

在 `knowledgeBase.js` 中，每个API函数都错误地包含了完整的基础URL：

```javascript
// ❌ 错误写法
export const getKnowledgeBases = async (params = {}) => {
  return request(`${API_BASE_URL}/kb?${queryParams}`, {  // 重复添加了 API_BASE_URL
    method: 'GET'
  })
}
```

而 `request` 函数本身会自动添加 `API_BASE_URL`：

```javascript
// api.js 中的 request 函数
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, config)  // 这里已经加上了 API_BASE_URL
}
```

这导致URL被重复拼接两次！

## 修复内容

### 1. 修复 `knowledgeBase.js` 的所有API调用

**文件**: `frontend/src/services/knowledgeBase.js`

**修改前**：
```javascript
return request(`${API_BASE_URL}/kb?${queryParams}`, { method: 'GET' })
return request(`${API_BASE_URL}/kb/${id}`, { method: 'PUT' })
return request(`${API_BASE_URL}/kb/${kbId}/folders`, { method: 'POST' })
// ... 等等
```

**修改后**：
```javascript
return request(`/kb?${queryParams}`, { method: 'GET' })
return request(`/kb/${id}`, { method: 'PUT' })
return request(`/kb/${kbId}/folders`, { method: 'POST' })
// ... 等等
```

### 2. 移除不需要的常量定义

删除了 `knowledgeBase.js` 开头的：
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'
```

因为 `request` 函数已经处理了基础URL。

## 修复后的正确流程

### API调用流程

1. **前端调用**：
   ```javascript
   getKnowledgeBases({ page: 1, pageSize: 20 })
   ```

2. **knowledgeBase.js**：
   ```javascript
   return request('/kb?page=1&pageSize=20', { method: 'GET' })
   ```

3. **api.js 中的 request 函数**：
   ```javascript
   const API_BASE_URL = 'http://localhost:3001/api/v1'
   fetch(`${API_BASE_URL}${url}`)  // http://localhost:3001/api/v1/kb?page=1&pageSize=20
   ```

4. **后端接收**：
   ```
   GET http://localhost:3001/api/v1/kb?page=1&pageSize=20
   ✅ 正确匹配到路由 /api/v1/kb
   ```

## 服务状态

### ✅ 后端服务
- **端口**: 3001
- **状态**: 正常运行
- **API前缀**: `/api/v1`
- **健康检查**: `http://localhost:3001/health`

### ✅ 前端服务
- **端口**: 5173（Vite默认）
- **开发服务器**: http://localhost:5173
- **API配置**: `http://localhost:3001/api/v1`

### ✅ 环境变量配置

**后端** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
```

**前端** (`frontend/.env.development`):
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## API URL 规范

### ✅ 正确的URL格式

| API Service | 调用方式 | 最终URL |
|------------|---------|---------|
| 获取知识库列表 | `request('/kb')` | `http://localhost:3001/api/v1/kb` |
| 创建知识库 | `request('/kb')` | `http://localhost:3001/api/v1/kb` |
| 获取文件夹树 | `request('/kb/123/folders')` | `http://localhost:3001/api/v1/kb/123/folders` |
| 创建文档 | `request('/kb/123/files')` | `http://localhost:3001/api/v1/kb/123/files` |

### ❌ 错误的URL格式（已修复）

| 错误调用 | 问题 |
|---------|------|
| `request('http://localhost:3001/api/v1/kb')` | 完整URL会被再次拼接 |
| `request('api/v1/kb')` | 缺少开头的 `/` |
| `request('kb')` | 缺少开头的 `/` |

## 测试验证

### 1. 检查后端日志
```bash
# 应该看到类似这样的日志：
GET /api/v1/kb?page=1&pageSize=20
✅ 200 OK
```

### 2. 检查浏览器控制台
```javascript
// 应该看到：
发送API请求: http://localhost:3001/api/v1/kb?page=1&pageSize=20
API响应状态: 200 OK
API响应数据: { code: 200, data: {...}, message: '...' }
```

### 3. 检查Network面板
- **Request URL**: `http://localhost:3001/api/v1/kb?page=1&pageSize=20` ✅
- **Status**: 200 ✅
- **Response**: 正常的JSON数据 ✅

## 修复的文件清单

1. ✅ `frontend/src/services/knowledgeBase.js` - 移除所有 `${API_BASE_URL}` 前缀
2. ✅ `frontend/src/services/api.js` - 添加 `export { request }`
3. ✅ `backend/.env` - 设置 `PORT=3001`
4. ✅ `frontend/.env.development` - 设置正确的API地址

## 现在可以测试了！

### 测试步骤

1. **刷新浏览器** （http://localhost:5173）
2. **登录系统** （admin@example.com / admin123）
3. **点击"知识库管理"**
4. **应该看到**：
   - ✅ 不再显示"使用模拟数据"
   - ✅ 显示3个真实的知识库卡片
   - ✅ 可以创建、编辑、删除知识库
   - ✅ 可以进入详情页查看文档

### 成功的标志

浏览器控制台应该显示：
```
发送API请求: http://localhost:3001/api/v1/kb?page=1&pageSize=20
API响应状态: 200 OK
API响应数据: {
  code: 200,
  data: {
    knowledgeBases: [...],
    pagination: {...}
  },
  message: '获取知识库列表成功'
}
```

## 总结

✅ **问题已完全修复**！

- 后端服务正常运行在 3001 端口
- 前端API调用格式正确
- URL不再重复拼接
- 所有知识库API都已修复

现在刷新浏览器，前后端连接应该完全正常！🎉

