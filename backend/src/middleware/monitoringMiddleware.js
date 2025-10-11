/**
 * 监控中间件
 * 记录API请求、响应时间和错误信息
 */

import monitoringService from '../services/monitoringService.js'
import cacheService from '../services/cacheService.js'

/**
 * API请求监控中间件
 */
export const apiMonitoringMiddleware = (req, res, next) => {
  const startTime = Date.now()
  const originalSend = res.send

  // 记录请求开始
  monitoringService.log('info', 'API请求开始', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // 拦截响应
  res.send = function(data) {
    const duration = Date.now() - startTime
    
    // 记录请求完成
    monitoringService.recordRequest(req, res, duration)
    
    // 记录到数据库
    if (req.user?.userId) {
      prisma.apiLog.create({
        data: {
          userId: req.user.userId,
          method: req.method,
          endpoint: req.url,
          statusCode: res.statusCode,
          processingTime: duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        }
      }).catch(error => {
        console.error('记录API日志失败:', error)
      })
    }

    // 调用原始send方法
    originalSend.call(this, data)
  }

  next()
}

/**
 * 错误监控中间件
 */
export const errorMonitoringMiddleware = (error, req, res, next) => {
  // 记录错误
  monitoringService.recordError(error, {
    method: req.method,
    url: req.url,
    userId: req.user?.userId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })

  // 记录到数据库
  prisma.errorLog.create({
    data: {
      level: 'ERROR',
      message: error.message,
      metadata: JSON.stringify({
        stack: error.stack,
        method: req.method,
        url: req.url,
        userId: req.user?.userId
      })
    }
  }).catch(dbError => {
    console.error('记录错误日志失败:', dbError)
  })

  next(error)
}

/**
 * 缓存中间件
 */
export const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return next()
    }

    try {
      // 生成缓存键
      const cacheKey = `api_${req.method}_${req.url}_${JSON.stringify(req.query)}`
      
      // 尝试从缓存获取
      const cachedData = await cacheService.get(cacheKey)
      
      if (cachedData) {
        monitoringService.log('debug', '缓存命中', { url: req.url })
        return res.json(cachedData)
      }

      // 拦截响应以缓存数据
      const originalSend = res.send
      res.send = function(data) {
        // 只缓存成功的响应
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(data)
            cacheService.set(cacheKey, parsedData, ttl)
            monitoringService.log('debug', '数据已缓存', { url: req.url })
          } catch (error) {
            console.error('缓存数据失败:', error)
          }
        }
        
        originalSend.call(this, data)
      }

      next()
    } catch (error) {
      console.error('缓存中间件错误:', error)
      next()
    }
  }
}

/**
 * 限流中间件
 */
export const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map()

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress
    const now = Date.now()
    const windowStart = now - windowMs

    // 清理过期的请求记录
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart)
      requests.set(key, userRequests)
    } else {
      requests.set(key, [])
    }

    const userRequests = requests.get(key)

    if (userRequests.length >= maxRequests) {
      monitoringService.log('warn', '请求频率限制', {
        ip: key,
        requests: userRequests.length,
        maxRequests
      })

      return res.status(429).json({
        code: 429,
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil(windowMs / 1000)
      })
    }

    // 记录当前请求
    userRequests.push(now)
    requests.set(key, userRequests)

    next()
  }
}

/**
 * 健康检查中间件
 */
export const healthCheckMiddleware = (req, res, next) => {
  if (req.path === '/health') {
    const healthStatus = monitoringService.getHealthStatus()
    const cacheStats = cacheService.getStats()
    
    return res.json({
      status: healthStatus.status,
      timestamp: new Date().toISOString(),
      uptime: healthStatus.uptime,
      memory: healthStatus.memory,
      cache: cacheStats,
      version: process.env.npm_package_version || '1.0.0'
    })
  }
  
  next()
}

export default {
  apiMonitoringMiddleware,
  errorMonitoringMiddleware,
  cacheMiddleware,
  rateLimitMiddleware,
  healthCheckMiddleware
}






