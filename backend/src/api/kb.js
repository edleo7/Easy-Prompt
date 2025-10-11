import express from 'express'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import { authenticateToken } from '../utils/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// 临时禁用认证中间件（开发环境）
// router.use(authenticateToken)

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'), false)
    }
  }
})

// 获取知识库列表
router.get('/', async (req, res) => {
  try {
    const { workspaceId, page = 1, pageSize = 20 } = req.query
    const userId = req.user?.userId || 'cmgbkrbf800008vqh4nd73vf5' // 开发环境默认用户

    // 如果没有提供工作空间ID，使用默认工作空间
    let workspaceIdToUse = workspaceId
    if (!workspaceId) {
      // 查找或创建默认工作空间
      let defaultWorkspace = await prisma.workspace.findFirst({
        where: { name: '默认工作空间' }
      })
      
      if (!defaultWorkspace) {
        defaultWorkspace = await prisma.workspace.create({
          data: {
            name: '默认工作空间',
            ownerId: userId
          }
        })
      }
      workspaceIdToUse = defaultWorkspace.id
    }

    // 检查用户是否有权限访问该工作空间
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceIdToUse,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } }
        ]
      }
    })

    if (!workspace) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: { workspaceId: workspaceIdToUse },
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            files: true,
            tasks: true,
            chatSessions: true,
            evalRuns: true
          }
        }
      }
    })

    const total = await prisma.knowledgeBase.count({ where: { workspaceId } })

    res.json({
      code: 0,
      data: {
        items: knowledgeBases,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: 'ok'
    })
  } catch (error) {
    console.error('获取知识库列表错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 创建知识库
router.post('/', async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body
    const userId = req.user.userId

    if (!name || !workspaceId) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：名称和工作空间ID不能为空'
      })
    }

    // 检查用户是否有权限
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } }
        ]
      }
    })

    if (!workspace) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        name,
        description,
        workspaceId
      }
    })

    res.status(201).json({
      code: 0,
      data: knowledgeBase,
      message: 'ok'
    })
  } catch (error) {
    console.error('创建知识库错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 上传文件到知识库
router.post('/:kbId/files', upload.single('file'), async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.user.userId

    if (!req.file) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：请选择文件'
      })
    }

    // 检查知识库是否存在且用户有权限
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: {
        id: kbId,
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId } } }
          ]
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    // 创建文件记录
    const file = await prisma.file.create({
      data: {
        name: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        storageUrl: req.file.path,
        kbId,
        status: 'pending'
      }
    })

    // 异步处理文件解析和分块
    const { processFileAsync } = await import('../services/fileParser.js')
    
    // 在后台异步处理文件，不等待结果
    processFileAsync(file.id).catch(error => {
      console.error(`文件 ${file.id} 异步处理失败:`, error)
    })

    res.status(201).json({
      code: 0,
      data: {
        ...file,
        status: 'pending'
      },
      message: '文件上传成功，正在处理中'
    })
  } catch (error) {
    console.error('上传文件错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 获取知识库文件列表
router.get('/:kbId/files', async (req, res) => {
  try {
    const { kbId } = req.params
    const userId = req.user.userId

    // 检查知识库是否存在且用户有权限
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
      where: {
        id: kbId,
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId } } }
          ]
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    const files = await prisma.file.findMany({
      where: { kbId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chunks: true }
        }
      }
    })

    res.json({
      code: 0,
      data: files,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取文件列表错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 删除知识库文件
router.delete('/:kbId/files/:fileId', async (req, res) => {
  try {
    const { kbId, fileId } = req.params
    const userId = req.user.userId

    // 检查文件是否存在且用户有权限
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        kbId,
        kb: {
          workspace: {
            OR: [
              { ownerId: userId },
              { memberships: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } }
            ]
          }
        }
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    await prisma.file.delete({
      where: { id: fileId }
    })

    res.json({
      code: 0,
      data: null,
      message: 'ok'
    })
  } catch (error) {
    console.error('删除文件错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 搜索知识库
router.post('/search', async (req, res) => {
  try {
    const { kbIds, query, topK = 5 } = req.body
    const userId = req.user.userId

    if (!kbIds || !Array.isArray(kbIds) || kbIds.length === 0) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：知识库ID列表不能为空'
      })
    }

    if (!query) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：搜索查询不能为空'
      })
    }

    // 使用向量搜索服务
    const { searchKnowledgeBase } = await import('../services/vectorSearch.js')
    const results = await searchKnowledgeBase(kbIds, query, topK, userId)

    res.json({
      code: 0,
      data: results,
      message: 'ok'
    })
  } catch (error) {
    console.error('搜索知识库错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 获取文件处理状态
router.get('/files/:fileId/status', async (req, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user.userId

    const { getFileProcessingStatus } = await import('../services/fileParser.js')
    const status = await getFileProcessingStatus(fileId)

    res.json({
      code: 0,
      data: status,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取文件状态错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 重新处理文件
router.post('/files/:fileId/reprocess', async (req, res) => {
  try {
    const { fileId } = req.params
    const userId = req.user.userId

    const { reprocessFile } = await import('../services/fileParser.js')
    await reprocessFile(fileId)

    res.json({
      code: 0,
      data: null,
      message: '文件重新处理已启动'
    })
  } catch (error) {
    console.error('重新处理文件错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

export default router
