/**
 * 监控和日志服务
 * 提供处理进度监控、错误日志记录和使用量统计
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 监控配置
 */
const MONITORING_CONFIG = {
  logLevel: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
  logFile: process.env.LOG_FILE || './logs/app.log',
  maxLogSize: parseInt(process.env.MAX_LOG_SIZE) || 10 * 1024 * 1024, // 10MB
  maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  metricsInterval: parseInt(process.env.METRICS_INTERVAL) || 60000 // 1分钟
}

class MonitoringService {
  constructor() {
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    this.currentLevel = this.logLevels[MONITORING_CONFIG.logLevel]
    this.metrics = {
      requests: 0,
      errors: 0,
      processingTime: [],
      memoryUsage: [],
      cpuUsage: []
    }
    this.processingTasks = new Map()
    this.initializeLogging()
    this.startMetricsCollection()
  }

  async initializeLogging() {
    try {
      // 创建日志目录
      const logDir = path.dirname(MONITORING_CONFIG.logFile)
      await fs.mkdir(logDir, { recursive: true })
      
      console.log('✅ 监控服务初始化成功')
    } catch (error) {
      console.error('监控服务初始化失败:', error)
    }
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  async log(level, message, meta = {}) {
    if (this.logLevels[level] < this.currentLevel) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta: {
        ...meta,
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }

    // 控制台输出
    console.log(JSON.stringify(logEntry))

    // 文件输出
    try {
      await this.writeToLogFile(logEntry)
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }

    // 数据库记录（错误级别）
    if (level === 'error') {
      await this.logToDatabase(logEntry)
    }
  }

  /**
   * 写入日志文件
   * @param {Object} logEntry - 日志条目
   */
  async writeToLogFile(logEntry) {
    const logLine = JSON.stringify(logEntry) + '\n'
    
    try {
      await fs.appendFile(MONITORING_CONFIG.logFile, logLine)
      
      // 检查文件大小，必要时轮转
      const stats = await fs.stat(MONITORING_CONFIG.logFile)
      if (stats.size > MONITORING_CONFIG.maxLogSize) {
        await this.rotateLogFile()
      }
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  /**
   * 轮转日志文件
   */
  async rotateLogFile() {
    try {
      const logDir = path.dirname(MONITORING_CONFIG.logFile)
      const logBase = path.basename(MONITORING_CONFIG.logFile, '.log')
      
      // 移动现有日志文件
      for (let i = MONITORING_CONFIG.maxLogFiles - 1; i > 0; i--) {
        const oldFile = path.join(logDir, `${logBase}.${i}.log`)
        const newFile = path.join(logDir, `${logBase}.${i + 1}.log`)
        
        try {
          await fs.rename(oldFile, newFile)
        } catch (error) {
          // 文件不存在，忽略
        }
      }
      
      // 移动当前日志文件
      const rotatedFile = path.join(logDir, `${logBase}.1.log`)
      await fs.rename(MONITORING_CONFIG.logFile, rotatedFile)
      
      console.log('日志文件已轮转')
    } catch (error) {
      console.error('日志文件轮转失败:', error)
    }
  }

  /**
   * 记录到数据库
   * @param {Object} logEntry - 日志条目
   */
  async logToDatabase(logEntry) {
    try {
      await prisma.errorLog.create({
        data: {
          level: logEntry.level,
          message: logEntry.message,
          metadata: JSON.stringify(logEntry.meta),
          timestamp: new Date(logEntry.timestamp)
        }
      })
    } catch (error) {
      console.error('记录错误日志到数据库失败:', error)
    }
  }

  /**
   * 开始处理任务监控
   * @param {string} taskId - 任务ID
   * @param {string} type - 任务类型
   * @param {Object} meta - 元数据
   */
  startTask(taskId, type, meta = {}) {
    this.processingTasks.set(taskId, {
      id: taskId,
      type,
      status: 'processing',
      startTime: Date.now(),
      progress: 0,
      meta
    })

    this.log('info', `任务开始: ${type}`, { taskId, type, ...meta })
  }

  /**
   * 更新任务进度
   * @param {string} taskId - 任务ID
   * @param {number} progress - 进度百分比 (0-100)
   * @param {string} message - 进度消息
   */
  updateTaskProgress(taskId, progress, message = '') {
    const task = this.processingTasks.get(taskId)
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress))
      task.message = message
      task.lastUpdate = Date.now()

      this.log('debug', `任务进度更新: ${taskId}`, {
        progress: task.progress,
        message,
        type: task.type
      })
    }
  }

  /**
   * 完成任务
   * @param {string} taskId - 任务ID
   * @param {Object} result - 结果数据
   */
  completeTask(taskId, result = {}) {
    const task = this.processingTasks.get(taskId)
    if (task) {
      task.status = 'completed'
      task.endTime = Date.now()
      task.duration = task.endTime - task.startTime
      task.result = result

      this.log('info', `任务完成: ${task.type}`, {
        taskId,
        duration: task.duration,
        ...result
      })

      // 记录处理时间指标
      this.metrics.processingTime.push(task.duration)
      if (this.metrics.processingTime.length > 1000) {
        this.metrics.processingTime = this.metrics.processingTime.slice(-1000)
      }

      this.processingTasks.delete(taskId)
    }
  }

  /**
   * 任务失败
   * @param {string} taskId - 任务ID
   * @param {Error} error - 错误对象
   */
  failTask(taskId, error) {
    const task = this.processingTasks.get(taskId)
    if (task) {
      task.status = 'failed'
      task.endTime = Date.now()
      task.duration = task.endTime - task.startTime
      task.error = {
        message: error.message,
        stack: error.stack
      }

      this.log('error', `任务失败: ${task.type}`, {
        taskId,
        duration: task.duration,
        error: error.message
      })

      this.metrics.errors++
      this.processingTasks.delete(taskId)
    }
  }

  /**
   * 获取任务状态
   * @param {string} taskId - 任务ID
   * @returns {Object|null} 任务状态
   */
  getTaskStatus(taskId) {
    return this.processingTasks.get(taskId) || null
  }

  /**
   * 获取所有处理中的任务
   * @returns {Array} 任务列表
   */
  getProcessingTasks() {
    return Array.from(this.processingTasks.values())
  }

  /**
   * 记录API请求
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   * @param {number} duration - 处理时间
   */
  recordRequest(req, res, duration) {
    this.metrics.requests++

    this.log('info', 'API请求', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    })

    // 记录处理时间
    this.metrics.processingTime.push(duration)
    if (this.metrics.processingTime.length > 1000) {
      this.metrics.processingTime = this.metrics.processingTime.slice(-1000)
    }
  }

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文信息
   */
  recordError(error, context = {}) {
    this.metrics.errors++

    this.log('error', '系统错误', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  /**
   * 开始指标收集
   */
  startMetricsCollection() {
    if (!MONITORING_CONFIG.enableMetrics) {
      return
    }

    setInterval(() => {
      this.collectMetrics()
    }, MONITORING_CONFIG.metricsInterval)
  }

  /**
   * 收集系统指标
   */
  async collectMetrics() {
    try {
      const memoryUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()

      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      })

      this.metrics.cpuUsage.push({
        timestamp: Date.now(),
        user: cpuUsage.user,
        system: cpuUsage.system
      })

      // 保持最近1000个数据点
      if (this.metrics.memoryUsage.length > 1000) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-1000)
      }
      if (this.metrics.cpuUsage.length > 1000) {
        this.metrics.cpuUsage = this.metrics.cpuUsage.slice(-1000)
      }

      // 记录到数据库
      await this.saveMetricsToDatabase()
    } catch (error) {
      console.error('收集指标失败:', error)
    }
  }

  /**
   * 保存指标到数据库
   */
  async saveMetricsToDatabase() {
    try {
      const avgProcessingTime = this.metrics.processingTime.length > 0
        ? this.metrics.processingTime.reduce((a, b) => a + b, 0) / this.metrics.processingTime.length
        : 0

      await prisma.systemMetrics.create({
        data: {
          requests: this.metrics.requests,
          errors: this.metrics.errors,
          avgProcessingTime: Math.round(avgProcessingTime),
          memoryUsage: JSON.stringify(this.metrics.memoryUsage.slice(-1)[0] || {}),
          cpuUsage: JSON.stringify(this.metrics.cpuUsage.slice(-1)[0] || {}),
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('保存指标到数据库失败:', error)
    }
  }

  /**
   * 获取系统指标
   * @returns {Object} 指标数据
   */
  getMetrics() {
    const avgProcessingTime = this.metrics.processingTime.length > 0
      ? this.metrics.processingTime.reduce((a, b) => a + b, 0) / this.metrics.processingTime.length
      : 0

    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      avgProcessingTime: Math.round(avgProcessingTime),
      activeTasks: this.processingTasks.size,
      memoryUsage: this.metrics.memoryUsage.slice(-10), // 最近10个数据点
      cpuUsage: this.metrics.cpuUsage.slice(-10),
      uptime: process.uptime()
    }
  }

  /**
   * 获取使用量统计
   * @param {string} userId - 用户ID
   * @param {string} period - 统计周期 (day, week, month)
   * @returns {Promise<Object>} 使用量统计
   */
  async getUsageStatistics(userId, period = 'day') {
    try {
      const now = new Date()
      let startDate

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }

      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
          AVG(processing_time) as avg_processing_time,
          SUM(CASE WHEN endpoint LIKE '%/prompts%' THEN 1 ELSE 0 END) as prompt_generations,
          SUM(CASE WHEN endpoint LIKE '%/kb%' THEN 1 ELSE 0 END) as knowledge_operations,
          SUM(CASE WHEN endpoint LIKE '%/memories%' THEN 1 ELSE 0 END) as memory_operations
        FROM api_logs 
        WHERE user_id = ${userId} 
        AND created_at >= ${startDate}
      `

      return stats[0] || {
        total_requests: 0,
        error_requests: 0,
        avg_processing_time: 0,
        prompt_generations: 0,
        knowledge_operations: 0,
        memory_operations: 0
      }
    } catch (error) {
      console.error('获取使用量统计失败:', error)
      return null
    }
  }

  /**
   * 健康检查
   * @returns {Object} 健康状态
   */
  getHealthStatus() {
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    return {
      status: memoryUsagePercent > 90 ? 'unhealthy' : 'healthy',
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round(memoryUsagePercent)
      },
      activeTasks: this.processingTasks.size,
      requests: this.metrics.requests,
      errors: this.metrics.errors
    }
  }
}

// 创建单例实例
const monitoringService = new MonitoringService()

export default monitoringService






