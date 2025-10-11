// 简单的内存缓存服务
class CacheService {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5分钟默认过期时间
  }

  // 设置缓存
  set(key, value, ttl = this.defaultTTL) {
    const expireTime = Date.now() + ttl
    this.cache.set(key, {
      value,
      expireTime
    })
  }

  // 获取缓存
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expireTime) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key)
  }

  // 清空所有缓存
  clear() {
    this.cache.clear()
  }

  // 检查缓存是否存在
  has(key) {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expireTime) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // 获取缓存大小
  size() {
    return this.cache.size
  }

  // 清理过期缓存
  cleanExpired() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        this.cache.delete(key)
      }
    }
  }
}

// 创建全局缓存实例
export const cache = new CacheService()

// 缓存键生成器
export const cacheKeys = {
  projects: (page = 1, limit = 10, filters = {}) => 
    `projects:${page}:${limit}:${JSON.stringify(filters)}`,
  memories: (page = 1, limit = 10, filters = {}) => 
    `memories:${page}:${limit}:${JSON.stringify(filters)}`,
  knowledgeBases: (page = 1, limit = 10, filters = {}) => 
    `knowledgeBases:${page}:${limit}:${JSON.stringify(filters)}`,
  templates: (page = 1, limit = 10, filters = {}) => 
    `templates:${page}:${limit}:${JSON.stringify(filters)}`,
  user: (userId) => `user:${userId}`,
  prompt: (task, type, knowledgeIds, memoryIds) => 
    `prompt:${task}:${type}:${knowledgeIds.join(',')}:${memoryIds.join(',')}`
}

// 缓存装饰器
export function withCache(keyGenerator, ttl = 5 * 60 * 1000) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value

    descriptor.value = async function(...args) {
      const key = keyGenerator(...args)
      
      // 尝试从缓存获取
      const cached = cache.get(key)
      if (cached) {
        console.log(`Cache hit: ${key}`)
        return cached
      }

      // 执行原方法
      const result = await method.apply(this, args)
      
      // 缓存结果
      cache.set(key, result, ttl)
      console.log(`Cache set: ${key}`)
      
      return result
    }
  }
}

export default cache
