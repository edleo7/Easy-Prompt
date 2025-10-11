import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取项目列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, workspaceId } = req.query

    const where = { 
      workspaceId: workspaceId || undefined
    }
    if (type) where.type = type

    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        },
        kb: {
          select: { id: true, name: true }
        }
      }
    })

    const total = await prisma.task.count({ where })

    res.json({
      code: 200,
      message: '获取项目列表成功',
      data: {
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取项目列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 创建项目
router.post('/', async (req, res) => {
  try {
    const { name, type, workspaceId, templateId, kbId, variables } = req.body

    if (!name || !type) {
      return res.status(400).json({
        code: 400,
        message: '请填写项目名称和类型',
        data: null
      })
    }

    const task = await prisma.task.create({
      data: {
        name,
        type,
        workspaceId: workspaceId || null,
        templateId: templateId || null,
        kbId: kbId || null,
        variables: variables ? JSON.stringify(variables) : null,
        createdById: 'default-user' // 使用默认用户ID
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        },
        kb: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      code: 201,
      message: '项目创建成功',
      data: task
    })
  } catch (error) {
    console.error('创建项目错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取任务详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId
      },
      include: {
        prompts: {
          orderBy: { createdAt: 'desc' }
        },
        memories: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      message: '获取任务详情成功',
      data: task
    })
  } catch (error) {
    console.error('获取任务详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 更新任务
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, status } = req.body
    const userId = req.user.userId

    const task = await prisma.task.findFirst({
      where: { id, userId }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        name,
        description,
        status
      }
    })

    res.json({
      code: 200,
      message: '任务更新成功',
      data: updatedTask
    })
  } catch (error) {
    console.error('更新任务错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 删除任务
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const task = await prisma.task.findFirst({
      where: { id, userId }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在',
        data: null
      })
    }

    await prisma.task.delete({
      where: { id }
    })

    res.json({
      code: 200,
      message: '任务删除成功',
      data: null
    })
  } catch (error) {
    console.error('删除任务错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

export default router
