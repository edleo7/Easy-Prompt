import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取项目下的Prompt列表
router.get('/projects/:projectId/prompts', async (req, res) => {
  try {
    const { projectId } = req.params
    const { page = 1, limit = 20, status, search } = req.query

    const where = { taskId: projectId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { content: { contains: search } }
      ]
    }

    const prompts = await prisma.prompt.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        task: {
          select: { id: true, name: true }
        }
      }
    })

    const total = await prisma.prompt.count({ where })

    res.json({
      code: 200,
      message: '获取Prompt列表成功',
      data: {
        prompts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取Prompt列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 创建Prompt
router.post('/projects/:projectId/prompts', async (req, res) => {
  try {
    const { projectId } = req.params
    const { name, content, variables, kbReferences, status = 'draft' } = req.body

    if (!name || !content) {
      return res.status(400).json({
        code: 400,
        message: '请填写Prompt名称和内容',
        data: null
      })
    }

    // 检查项目是否存在
    const task = await prisma.task.findUnique({
      where: { id: projectId }
    })

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '项目不存在',
        data: null
      })
    }

    const prompt = await prisma.prompt.create({
      data: {
        taskId: projectId,
        name,
        content,
        variables: variables ? JSON.stringify(variables) : null,
        kbReferences: kbReferences ? JSON.stringify(kbReferences) : null,
        status
      },
      include: {
        task: {
          select: { id: true, name: true }
        }
      }
    })

    // 更新项目的Prompt数量
    await prisma.task.update({
      where: { id: projectId },
      data: {
        promptCount: {
          increment: 1
        }
      }
    })

    res.status(201).json({
      code: 201,
      message: 'Prompt创建成功',
      data: prompt
    })
  } catch (error) {
    console.error('创建Prompt错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取Prompt详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const prompt = await prisma.prompt.findUnique({
      where: { id },
      include: {
        task: {
          select: { id: true, name: true }
        }
      }
    })

    if (!prompt) {
      return res.status(404).json({
        code: 404,
        message: 'Prompt不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      message: '获取Prompt详情成功',
      data: prompt
    })
  } catch (error) {
    console.error('获取Prompt详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 更新Prompt
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, content, variables, kbReferences, status, version } = req.body

    const prompt = await prisma.prompt.findUnique({
      where: { id }
    })

    if (!prompt) {
      return res.status(404).json({
        code: 404,
        message: 'Prompt不存在',
        data: null
      })
    }

    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: {
        name,
        content,
        variables: variables ? JSON.stringify(variables) : prompt.variables,
        kbReferences: kbReferences ? JSON.stringify(kbReferences) : prompt.kbReferences,
        status,
        version: version ? version + 1 : prompt.version + 1
      },
      include: {
        task: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      code: 200,
      message: 'Prompt更新成功',
      data: updatedPrompt
    })
  } catch (error) {
    console.error('更新Prompt错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 删除Prompt
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const prompt = await prisma.prompt.findUnique({
      where: { id }
    })

    if (!prompt) {
      return res.status(404).json({
        code: 404,
        message: 'Prompt不存在',
        data: null
      })
    }

    await prisma.prompt.delete({
      where: { id }
    })

    // 更新项目的Prompt数量
    await prisma.task.update({
      where: { id: prompt.taskId },
      data: {
        promptCount: {
          decrement: 1
        }
      }
    })

    res.json({
      code: 200,
      message: 'Prompt删除成功',
      data: null
    })
  } catch (error) {
    console.error('删除Prompt错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 复制Prompt
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    const originalPrompt = await prisma.prompt.findUnique({
      where: { id }
    })

    if (!originalPrompt) {
      return res.status(404).json({
        code: 404,
        message: 'Prompt不存在',
        data: null
      })
    }

    const duplicatedPrompt = await prisma.prompt.create({
      data: {
        taskId: originalPrompt.taskId,
        name: name || `${originalPrompt.name} (副本)`,
        content: originalPrompt.content,
        variables: originalPrompt.variables,
        kbReferences: originalPrompt.kbReferences,
        status: 'draft',
        version: 1
      },
      include: {
        task: {
          select: { id: true, name: true }
        }
      }
    })

    // 更新项目的Prompt数量
    await prisma.task.update({
      where: { id: originalPrompt.taskId },
      data: {
        promptCount: {
          increment: 1
        }
      }
    })

    res.status(201).json({
      code: 201,
      message: 'Prompt复制成功',
      data: duplicatedPrompt
    })
  } catch (error) {
    console.error('复制Prompt错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

export default router