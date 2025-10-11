import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取模板列表
router.get('/', async (req, res) => {
  try {
    const { workspaceId, type, page = 1, pageSize = 20 } = req.query
    const userId = req.user.userId

    if (!workspaceId) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：工作空间ID不能为空'
      })
    }

    // 检查用户是否有权限访问该工作空间
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

    const where = { workspaceId }
    if (type) where.type = type

    const templates = await prisma.template.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: parseInt(pageSize),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            tasks: true,
            chatSessions: true,
            evalRuns: true
          }
        }
      }
    })

    const total = await prisma.template.count({ where })

    res.json({
      code: 0,
      data: {
        items: templates,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      },
      message: 'ok'
    })
  } catch (error) {
    console.error('获取模板列表错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 创建模板
router.post('/', async (req, res) => {
  try {
    const { name, type, systemText, userText, variables, workspaceId } = req.body
    const userId = req.user.userId

    if (!name || !type || !workspaceId) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：名称、类型和工作空间ID不能为空'
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

    const template = await prisma.template.create({
      data: {
        name,
        type,
        systemText,
        userText,
        variables: variables ? JSON.parse(variables) : null,
        workspaceId
      }
    })

    res.status(201).json({
      code: 0,
      data: template,
      message: 'ok'
    })
  } catch (error) {
    console.error('创建模板错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 获取模板详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const template = await prisma.template.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId } } }
          ]
        }
      },
      include: {
        workspace: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            tasks: true,
            chatSessions: true,
            evalRuns: true
          }
        }
      }
    })

    if (!template) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    res.json({
      code: 0,
      data: template,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取模板详情错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 更新模板
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, systemText, userText, variables } = req.body
    const userId = req.user.userId

    const template = await prisma.template.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } }
          ]
        }
      }
    })

    if (!template) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name,
        systemText,
        userText,
        variables: variables ? JSON.parse(variables) : null
      }
    })

    res.json({
      code: 0,
      data: updatedTemplate,
      message: 'ok'
    })
  } catch (error) {
    console.error('更新模板错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 删除模板
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const template = await prisma.template.findFirst({
      where: {
        id,
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } }
          ]
        }
      }
    })

    if (!template) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    await prisma.template.delete({
      where: { id }
    })

    res.json({
      code: 0,
      data: null,
      message: 'ok'
    })
  } catch (error) {
    console.error('删除模板错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

export default router
