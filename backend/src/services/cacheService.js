/**
 * 缓存服务
 * 支持内存缓存、Redis缓存和文件缓存
 */

import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  type: process.env.CACHE_TYPE || 'memory', // memory, redis, file
  ttl: parseInt(process.env.CACHE_TTL) || 3600, // 默认1小时
  maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000, // 最大缓存条目数
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  },
  file: {
    path: process.env.CACHE_FILE_PATH || './cache',
    maxFileSize: parseInt(process.env.CACHE_MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
}

class CacheService {
  constructor() {
    this.cache = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0
    }
    this.redis = null
    this.initializeCache()
  }

  async initializeCache() {
    try {
      switch (CACHE_CONFIG.type) {
        case 'redis':
          await this.initializeRedis()
          break
        case 'file':
          await this.initializeFileCache()
          break
        case 'memory':
        default:
          console.log('✅ 内存缓存初始化成功')
          break
      }
    } catch (error) {
      console.error('缓存初始化失败:', error)
      // 降级到内存缓存
      CACHE_CONFIG.type = 'memory'
    }
  }

  async initializeRedis() {
    try {
      const redis = await import('redis')
      this.redis = redis.createClient({
        host: CACHE_CONFIG.redis.host,
        port: CACHE_CONFIG.redis.port,
        password: CACHE_CONFIG.redis.password,
        db: CACHE_CONFIG.redis.db
      })

      this.redis.on('error', (err) => {
        console.error('Redis连接错误:', err)
        // 降级到内存缓存
        CACHE_CONFIG.type = 'memory'
      })

      await this.redis.connect()
      console.log('✅ Redis缓存初始化成功')
    } catch (error) {
      console.warn('Redis初始化失败，降级到内存缓存:', error.message)
      CACHE_CONFIG.type = 'memory'
    }
  }

  async initializeFileCache() {
    try {
      await fs.mkdir(CACHE_CONFIG.file.path, { recursive: true })
      console.log('✅ 文件缓存初始化成功')
    } catch (error) {
      console.warn('文件缓存初始化失败，降级到内存缓存:', error.message)
      CACHE_CONFIG.type = 'memory'
    }
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 过期时间（秒）
   * @returns {Promise<boolean>} 设置结果
   */
  async set(key, value, ttl = CACHE_CONFIG.ttl) {
    try {
      const cacheKey = this.generateKey(key)
      const cacheValue = {
        value,
        expires: Date.now() + (ttl * 1000),
        createdAt: Date.now()
      }

      switch (CACHE_CONFIG.type) {
        case 'redis':
          return await this.setRedis(cacheKey, cacheValue, ttl)
        case 'file':
          return await this.setFile(cacheKey, cacheValue)
        case 'memory':
        default:
          return this.setMemory(cacheKey, cacheValue)
      }
    } catch (error) {
      console.error('设置缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {Promise<any>} 缓存值
   */
  async get(key) {
    try {
      const cacheKey = this.generateKey(key)
      let result

      switch (CACHE_CONFIG.type) {
        case 'redis':
          result = await this.getRedis(cacheKey)
          break
        case 'file':
          result = await this.getFile(cacheKey)
          break
        case 'memory':
        default:
          result = this.getMemory(cacheKey)
          break
      }

      if (result) {
        this.stats.hits++
        return result.value
      } else {
        this.stats.misses++
        return null
      }
    } catch (error) {
      console.error('获取缓存失败:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {Promise<boolean>} 删除结果
   */
  async delete(key) {
    try {
      const cacheKey = this.generateKey(key)

      switch (CACHE_CONFIG.type) {
        case 'redis':
          return await this.deleteRedis(cacheKey)
        case 'file':
          return await this.deleteFile(cacheKey)
        case 'memory':
        default:
          return this.deleteMemory(cacheKey)
      }
    } catch (error) {
      console.error('删除缓存失败:', error)
      return false
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<boolean>} 清空结果
   */
  async clear() {
    try {
      switch (CACHE_CONFIG.type) {
        case 'redis':
          await this.redis.flushDb()
          break
        case 'file':
          const files = await fs.readdir(CACHE_CONFIG.file.path)
          for (const file of files) {
            await fs.unlink(path.join(CACHE_CONFIG.file.path, file))
          }
          break
        case 'memory':
        default:
          this.cache.clear()
          break
      }

      this.stats.size = 0
      return true
    } catch (error) {
      console.error('清空缓存失败:', error)
      return false
    }
  }

  // Redis缓存方法
  async setRedis(key, value, ttl) {
    await this.redis.setEx(key, ttl, JSON.stringify(value))
    this.stats.sets++
    return true
  }

  async getRedis(key) {
    const result = await this.redis.get(key)
    if (result) {
      const parsed = JSON.parse(result)
      if (parsed.expires > Date.now()) {
        return parsed
      } else {
        await this.redis.del(key)
        return null
      }
    }
    return null
  }

  async deleteRedis(key) {
    const result = await this.redis.del(key)
    this.stats.deletes++
    return result > 0
  }

  // 文件缓存方法
  async setFile(key, value) {
    const filePath = path.join(CACHE_CONFIG.file.path, `${key}.json`)
    await fs.writeFile(filePath, JSON.stringify(value))
    this.stats.sets++
    this.stats.size++
    return true
  }

  async getFile(key) {
    try {
      const filePath = path.join(CACHE_CONFIG.file.path, `${key}.json`)
      const data = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(data)
      
      if (parsed.expires > Date.now()) {
        return parsed
      } else {
        await this.deleteFile(key)
        return null
      }
    } catch (error) {
      return null
    }
  }

  async deleteFile(key) {
    try {
      const filePath = path.join(CACHE_CONFIG.file.path, `${key}.json`)
      await fs.unlink(filePath)
      this.stats.deletes++
      this.stats.size--
      return true
    } catch (error) {
      return false
    }
  }

  // 内存缓存方法
  setMemory(key, value) {
    // 检查缓存大小限制
    if (this.cache.size >= CACHE_CONFIG.maxSize) {
      // 删除最旧的条目
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, value)
    this.stats.sets++
    this.stats.size = this.cache.size
    return true
  }

  getMemory(key) {
    const value = this.cache.get(key)
    if (value && value.expires > Date.now()) {
      return value
    } else if (value) {
      this.cache.delete(key)
      this.stats.size = this.cache.size
    }
    return null
  }

  deleteMemory(key) {
    const result = this.cache.delete(key)
    this.stats.deletes++
    this.stats.size = this.cache.size
    return result
  }

  /**
   * 生成缓存键
   * @param {string} key - 原始键
   * @returns {string} 生成的键
   */
  generateKey(key) {
    return crypto.createHash('md5').update(key).digest('hex')
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0

    return {
      type: CACHE_CONFIG.type,
      size: this.stats.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
      sets: this.stats.sets,
      deletes: this.stats.deletes
    }
  }

  /**
   * 清理过期缓存
   * @returns {Promise<number>} 清理的条目数
   */
  async cleanup() {
    let cleaned = 0
    const now = Date.now()

    try {
      switch (CACHE_CONFIG.type) {
        case 'redis':
          // Redis会自动清理过期键
          break
        case 'file':
          const files = await fs.readdir(CACHE_CONFIG.file.path)
          for (const file of files) {
            try {
              const filePath = path.join(CACHE_CONFIG.file.path, file)
              const data = await fs.readFile(filePath, 'utf-8')
              const parsed = JSON.parse(data)
              
              if (parsed.expires <= now) {
                await fs.unlink(filePath)
                cleaned++
              }
            } catch (error) {
              // 忽略文件读取错误
            }
          }
          break
        case 'memory':
        default:
          for (const [key, value] of this.cache.entries()) {
            if (value.expires <= now) {
              this.cache.delete(key)
              cleaned++
            }
          }
          this.stats.size = this.cache.size
          break
      }

      console.log(`清理了 ${cleaned} 个过期缓存条目`)
      return cleaned
    } catch (error) {
      console.error('清理缓存失败:', error)
      return 0
    }
  }
}

// 创建单例实例
const cacheService = new CacheService()

// 定期清理过期缓存
setInterval(() => {
  cacheService.cleanup()
}, 5 * 60 * 1000) // 每5分钟清理一次

export default cacheService






