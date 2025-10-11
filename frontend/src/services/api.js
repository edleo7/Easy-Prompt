import { cache, cacheKeys } from './cache.js'

// 检查是否使用模拟数据
const USE_MOCK_DATA = true; // 设置为true以使用模拟数据

// 模拟用户数据
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'admin',
    password: '123456', // 在实际应用中，这应该是加密的密码
    createdAt: new Date().toISOString()
  }
];

// 模拟认证令牌
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTYzMzUxNjg1OH0.3RuT1nG2Jrb4aV1N5k7-rHffZdKgZr6uUcVl6k1Vr4I';

const API_BASE_URL = 'http://localhost:3001/api/v1'

// 通用请求函数
async function request(url, options = {}) {
  // 如果使用模拟数据，处理认证相关请求
  if (USE_MOCK_DATA) {
    // 模拟登录请求
    if (url === '/auth/login' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      const user = MOCK_USERS.find(u => u.email === body.email);
      
      if (user && user.password === body.password) {
        return {
          code: 200,
          message: '登录成功',
          data: {
            token: MOCK_TOKEN,
            user: {
              id: user.id,
              email: user.email,
              name: user.name
            }
          }
        };
      } else {
        throw new Error('邮箱或密码错误');
      }
    }
    
    // 模拟注册请求
    if (url === '/auth/register' && options.method === 'POST') {
      const body = JSON.parse(options.body);
      const existingUser = MOCK_USERS.find(u => u.email === body.email);
      
      if (existingUser) {
        throw new Error('用户已存在');
      }
      
      const newUser = {
        id: String(MOCK_USERS.length + 1),
        email: body.email,
        name: body.name || body.email.split('@')[0],
        password: body.password,
        createdAt: new Date().toISOString()
      };
      
      MOCK_USERS.push(newUser);
      
      return {
        code: 201,
        message: '注册成功',
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt
        }
      };
    }
    
    // 模拟获取用户信息请求
    if (url === '/users/profile' && options.method === 'GET') {
      const token = options.headers?.Authorization?.replace('Bearer ', '');
      if (token === MOCK_TOKEN) {
        const user = MOCK_USERS[0]; // 简化处理，返回第一个用户
        return {
          code: 200,
          message: '获取用户信息成功',
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
          }
        };
      } else {
        throw new Error('认证失败');
      }
    }
  }

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
    console.error('错误详情:', error.message, error.stack)
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

export default {
  projectAPI,
  memoryAPI,
  knowledgeAPI,
  promptAPI,
  authAPI,
}