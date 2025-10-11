import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

// 导入路由
import authRoutes from './api/auth.js'
import workspaceRoutes from './api/workspaces.js'
import apiKeyRoutes from './api/apikeys.js'
import taskRoutes from './api/tasks.js'
import templateRoutes from './api/templates.js'
import kbRoutes from './api/kb_simple.js'
import userRoutes from './api/users.js'
import memoryRoutes from './api/memories.js'
import promptRoutes from './api/prompts.js'
import subscriptionRoutes from './api/subscriptions.js'
import ocrRoutes from './api/ocr.js'

// 导入中间件
import { errorHandler } from './utils/errorHandler.js'
import { 
  apiMonitoringMiddleware, 
  errorMonitoringMiddleware, 
  cacheMiddleware, 
  rateLimitMiddleware, 
  healthCheckMiddleware 
} from './middleware/monitoringMiddleware.js'

// 导入服务
import monitoringService from './services/monitoringService.js'
import cacheService from './services/cacheService.js'
import vectorDB from './services/vectorDatabase.js'
import professionalFileParser from './services/professionalFileParser.js'
import paymentGateway from './services/paymentGateway.js'
import batchProcessingService from './services/batchProcessingService.js'

dotenv.config()

const app = express()
const prisma = new PrismaClient()

// 中间件
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 监控中间件
app.use(apiMonitoringMiddleware)
app.use(healthCheckMiddleware)
app.use(rateLimitMiddleware(100, 60000)) // 每分钟最多100个请求
app.use(cacheMiddleware(3600)) // 1小时缓存

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API 路由
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/workspaces', workspaceRoutes)
app.use('/api/v1/workspaces', apiKeyRoutes)
app.use('/api/v1/tasks', taskRoutes)
app.use('/api/v1/projects', taskRoutes) // 添加项目管理路由别名
app.use('/api/v1/templates', templateRoutes)
app.use('/api/v1/kb', kbRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/memories', memoryRoutes)
app.use('/api/v1/prompts', promptRoutes)
app.use('/api/v1/subscriptions', subscriptionRoutes)
app.use('/api/v1/ocr', ocrRoutes)

// 错误处理
app.use(errorMonitoringMiddleware)
app.use(errorHandler)

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    code: 404, 
    message: '接口不存在',
    data: null 
  })
})

const PORT = process.env.PORT || 3002

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`)
  console.log(`📊 健康检查: http://localhost:${PORT}/health`)
})

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...')
  await prisma.$disconnect()
  process.exit(0)
})

export default app