import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取记忆列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, scope, workspaceId, userId } = req.query

    const where = {
      OR: [
        { scope: 'USER', userId: userId || 'default-user' },
        { scope: 'WORKSPACE', workspaceId: workspaceId || undefined }
      ]
    }

    if (scope) where.scope = scope

    const memories = await prisma.memoryItem.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    const total = await prisma.memoryItem.count({ where })

    res.json({
      code: 200,
      message: '获取记忆列表成功',
      data: {
        memories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取记忆列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 创建记忆
router.post('/', async (req, res) => {
  try {
    console.log('收到创建记忆请求:', req.body) // 调试日志
    const { content, scope, workspaceId, weight, tags } = req.body
    const userId = 'default-user'

    if (!content) {
      return res.status(400).json({
        code: 400,
        message: '请填写记忆内容',
        data: null
      })
    }
    
    if (!scope) {
      return res.status(400).json({
        code: 400,
        message: '请提供记忆范围',
        data: null
      })
    }

    const memory = await prisma.memoryItem.create({
      data: {
        content,
        scope,
        workspaceId: scope === 'WORKSPACE' ? workspaceId : null,
        userId: scope === 'USER' ? userId : null,
        weight: weight || 'NORMAL',
        tags: tags ? JSON.stringify(tags) : '[]'
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      code: 201,
      message: '记忆创建成功',
      data: memory
    })
  } catch (error) {
    console.error('创建记忆错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取记忆详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = 'default-user'

    const memory = await prisma.memoryItem.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { workspace: { memberships: { some: { userId } } } }
        ]
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    if (!memory) {
      return res.status(404).json({
        code: 404,
        message: '记忆不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      message: '获取记忆详情成功',
      data: memory
    })
  } catch (error) {
    console.error('获取记忆详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 更新记忆
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { content, weight, tags } = req.body
    const userId = 'default-user'

    const memory = await prisma.memoryItem.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { workspace: { memberships: { some: { userId } } } }
        ]
      }
    })

    if (!memory) {
      return res.status(404).json({
        code: 404,
        message: '记忆不存在',
        data: null
      })
    }

    const updatedMemory = await prisma.memoryItem.update({
      where: { id },
      data: {
        content,
        weight,
        tags: tags ? JSON.stringify(tags) : memory.tags
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      code: 200,
      message: '记忆更新成功',
      data: updatedMemory
    })
  } catch (error) {
    console.error('更新记忆错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 删除记忆
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = 'default-user'

    const memory = await prisma.memoryItem.findFirst({
      where: {
        id,
        OR: [
          { scope: 'USER' },
          { workspace: { memberships: { some: { userId } } } }
        ]
      }
    })

    if (!memory) {
      return res.status(404).json({
        code: 404,
        message: '记忆不存在',
        data: null
      })
    }

    await prisma.memoryItem.delete({
      where: { id }
    })

    res.json({
      code: 200,
      message: '记忆删除成功',
      data: null
    })
  } catch (error) {
    console.error('删除记忆错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

export default router
