import { cache, cacheKeys } from './cache.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

// 开发环境模拟数据（仅在后端不可用时使用）
const DEV_MOCK_USER = {
  id: '1',
  email: 'admin@example.com',
  name: 'Admin',
  username: 'admin'
}

const DEV_MOCK_TOKEN = 'dev-mock-token-' + Date.now()

// 通用请求函数
async function request(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log('发送API请求:', `${API_BASE_URL}${url}`, config)
    const response = await fetch(`${API_BASE_URL}${url}`, config)
    console.log('API响应状态:', response.status, response.statusText)
    
    const data = await response.json()
    console.log('API响应数据:', data)
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败')
    }
    
    return data
  } catch (error) {
    console.error('API请求错误:', error)
    
    // 开发环境降级：如果是登录请求且后端不可用，使用模拟数据
    if (import.meta.env.DEV && url === '/auth/login') {
      console.warn('⚠️ 后端服务不可用，使用开发环境模拟登录')
      const body = JSON.parse(options.body || '{}')
      
      // 简单的模拟验证
      if (body.email === 'admin@example.com' && body.password === 'admin123') {
        return {
          code: 200,
          message: '登录成功（开发模式）',
          data: {
            token: DEV_MOCK_TOKEN,
            user: DEV_MOCK_USER
          }
        }
      } else {
        throw new Error('用户名或密码错误（开发模式：admin@example.com / admin123）')
      }
    }
    
    throw error
  }
}

// 带缓存的请求函数
async function requestWithCache(url, options = {}, cacheKey, ttl = 5 * 60 * 1000) {
  // 尝试从缓存获取
  if (cacheKey && cache.has(cacheKey)) {
    console.log(`Cache hit: ${cacheKey}`)
    return cache.get(cacheKey)
  }

  // 执行请求
  const result = await request(url, options)
  
  // 缓存结果
  if (cacheKey) {
    cache.set(cacheKey, result, ttl)
    console.log(`Cache set: ${cacheKey}`)
  }
  
  return result
}

// 项目管理API
export const projectAPI = {
  // 获取项目列表（带缓存和分页）
  getProjects: (params = {}) => {
    const { page = 1, limit = 10, type, status, search } = params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && { search })
    })
    
    const cacheKey = cacheKeys.projects(page, limit, { type, status, search })
    
    return requestWithCache(`/projects?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, cacheKey)
  },

  // 创建项目
  createProject: async (data) => {
    const result = await request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 获取项目详情
  getProject: (id) => {
    const cacheKey = `project:${id}`
    return requestWithCache(`/projects/${id}`, {
      method: 'GET',
    }, cacheKey)
  },

  // 更新项目
  updateProject: async (id, data) => {
    const result = await request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 删除项目
  deleteProject: async (id) => {
    const result = await request(`/projects/${id}`, {
      method: 'DELETE',
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },
}

// 记忆管理API
export const memoryAPI = {
  // 获取记忆列表（带缓存和分页）
  getMemories: (params = {}) => {
    const { page = 1, limit = 10, scope, workspaceId, userId } = params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(scope && { scope }),
      ...(workspaceId && { workspaceId }),
      ...(userId && { userId })
    })
    
    const cacheKey = cacheKeys.memories(page, limit, { scope, workspaceId, userId })
    
    return requestWithCache(`/memories?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, cacheKey)
  },

  // 创建记忆
  createMemory: async (data) => {
    const result = await request('/memories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 获取记忆详情
  getMemory: (id) => {
    const cacheKey = `memory:${id}`
    return requestWithCache(`/memories/${id}`, {
      method: 'GET',
    }, cacheKey)
  },

  // 更新记忆
  updateMemory: async (id, data) => {
    const result = await request(`/memories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 删除记忆
  deleteMemory: async (id) => {
    const result = await request(`/memories/${id}`, {
      method: 'DELETE',
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },
}

// 知识库管理API
export const knowledgeAPI = {
  // 获取知识库列表（带缓存和分页）
  getKnowledgeBases: (params = {}) => {
    const { page = 1, limit = 10, type, status, search } = params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(status && { status }),
      ...(search && { search })
    })
    
    const cacheKey = cacheKeys.knowledgeBases(page, limit, { type, status, search })
    
    return requestWithCache(`/kb?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, cacheKey)
  },

  // 创建知识库
  createKnowledgeBase: async (data) => {
    const result = await request('/kb', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 获取知识库详情
  getKnowledgeBase: (id) => {
    const cacheKey = `knowledgeBase:${id}`
    return requestWithCache(`/kb/${id}`, {
      method: 'GET',
    }, cacheKey)
  },

  // 更新知识库
  updateKnowledgeBase: async (id, data) => {
    const result = await request(`/kb/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 删除知识库
  deleteKnowledgeBase: async (id) => {
    const result = await request(`/kb/${id}`, {
      method: 'DELETE',
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },

  // 上传文件
  uploadFile: async (formData) => {
    const result = await request('/kb/upload', {
      method: 'POST',
      headers: {
        // 不设置Content-Type，让浏览器自动设置
      },
      body: formData,
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },
}

// Prompt生成API
export const promptAPI = {
  // 生成Prompt（带缓存）
  generatePrompt: (data) => {
    const { task, type, knowledgeIds = [], memoryIds = [] } = data
    const cacheKey = cacheKeys.prompt(task, type, knowledgeIds, memoryIds)
    
    return requestWithCache('/prompts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }, cacheKey, 10 * 60 * 1000) // 10分钟缓存
  },

  // 获取Prompt模板列表（带缓存和分页）
  getTemplates: (params = {}) => {
    const { page = 1, limit = 10, type, search } = params
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(search && { search })
    })
    
    const cacheKey = cacheKeys.templates(page, limit, { type, search })
    
    return requestWithCache(`/prompts/templates?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, cacheKey)
  },

  // 保存Prompt模板
  saveTemplate: async (data) => {
    const result = await request('/prompts/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    // 清除相关缓存
    cache.clear()
    
    return result
  },
}

// 用户认证API
export const authAPI = {
  // 登录
  login: (data) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 注册
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // 获取用户信息
  getUserInfo: () => request('/users/profile'),

  // 退出登录
  logout: () => {
    // 清除本地存储的认证信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 跳转到登录页面
    window.location.hash = '#/login'
    window.location.reload()
  },
}

// 导出request函数供其他模块使用
export { request }

export default {
  projectAPI,
  memoryAPI,
  knowledgeAPI,
  promptAPI,
  authAPI,
}