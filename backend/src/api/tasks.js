import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取项目列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, workspaceId, status, search, tags } = req.query

    const where = { 
      workspaceId: workspaceId || undefined
    }
    if (type) where.type = type
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    }
    if (tags) {
      const tagArray = tags.split(',')
      where.tags = {
        contains: JSON.stringify(tagArray)
      }
    }

    const tasks = await prisma.task.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        },
        kb: {
          select: { id: true, name: true }
        },
        _count: {
          select: { prompts: true }
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
    const { 
      name, 
      type, 
      workspaceId, 
      templateId, 
      kbId, 
      variables,
      description,
      status = 'draft',
      tags,
      coverImage
    } = req.body

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
        createdById: 'default-user', // 使用默认用户ID
        description,
        status,
        tags: tags ? JSON.stringify(tags) : null,
        coverImage,
        lastAccessedAt: new Date()
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
        },
        _count: {
          select: { prompts: true }
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

// 获取项目详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        template: {
          select: { id: true, name: true }
        },
        kb: {
          select: { id: true, name: true }
        },
        prompts: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { prompts: true }
        }
      }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在',
        data: null
      })
    }

    // 更新最后访问时间
    await prisma.task.update({
      where: { id },
      data: { lastAccessedAt: new Date() }
    })

    res.json({
      code: 200,
      message: '获取项目详情成功',
      data: task
    })
  } catch (error) {
    console.error('获取项目详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { 
      name, 
      description, 
      status, 
      tags, 
      coverImage,
      type,
      workspaceId,
      templateId,
      kbId,
      variables
    } = req.body

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在',
        data: null
      })
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        name,
        description,
        status,
        tags: tags ? JSON.stringify(tags) : task.tags,
        coverImage,
        type,
        workspaceId,
        templateId,
        kbId,
        variables: variables ? JSON.stringify(variables) : task.variables,
        lastAccessedAt: new Date()
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
        },
        _count: {
          select: { prompts: true }
        }
      }
    })

    res.json({
      code: 200,
      message: '项目更新成功',
      data: updatedTask
    })
  } catch (error) {
    console.error('更新项目错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在',
        data: null
      })
    }

    // 级联删除相关的Prompt
    await prisma.task.delete({
      where: { id }
    })

    res.json({
      code: 200,
      message: '项目删除成功',
      data: null
    })
  } catch (error) {
    console.error('删除项目错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取项目统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        _count: {
          select: { prompts: true }
        }
      }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在',
        data: null
      })
    }

    // 获取Prompt状态统计
    const promptStats = await prisma.prompt.groupBy({
      by: ['status'],
      where: { taskId: id },
      _count: { status: true }
    })

    const stats = {
      totalPrompts: task._count.prompts,
      promptStatusCounts: promptStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status
        return acc
      }, {}),
      lastAccessedAt: task.lastAccessedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }

    res.json({
      code: 200,
      message: '获取项目统计成功',
      data: stats
    })
  } catch (error) {
    console.error('获取项目统计错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

export default router
