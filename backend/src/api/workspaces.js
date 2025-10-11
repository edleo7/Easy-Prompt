import express from 'express'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const router = express.Router()
const prisma = new PrismaClient()

// 获取工作空间列表
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        memberships: {
          where: { userId },
          select: { role: true }
        },
        _count: {
          select: {
            tasks: true,
            templates: true,
            knowledgeBases: true,
            chatSessions: true
          }
        }
      }
    })

    res.json({
      code: 0,
      data: workspaces,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取工作空间列表错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 创建工作空间
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    const userId = req.user.userId

    if (!name) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：工作空间名称不能为空'
      })
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        ownerId: userId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    res.status(201).json({
      code: 0,
      data: workspace,
      message: 'ok'
    })
  } catch (error) {
    console.error('创建工作空间错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 获取工作空间详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        memberships: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            templates: true,
            knowledgeBases: true,
            chatSessions: true,
            apiKeys: true
          }
        }
      }
    })

    if (!workspace) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '资源不存在'
      })
    }

    res.json({
      code: 0,
      data: workspace,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取工作空间详情错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 添加工作空间成员
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, role } = req.body
    const currentUserId = req.user.userId

    // 检查当前用户是否有权限
    const workspace = await prisma.workspace.findFirst({
      where: {
        id,
        OR: [
          { ownerId: currentUserId },
          { memberships: { some: { userId: currentUserId, role: { in: ['OWNER', 'ADMIN'] } } } }
        ]
      }
    })

    if (!workspace) {
      return res.status(403).json({
        code: 40301,
        data: null,
        message: '无权限'
      })
    }

    const membership = await prisma.membership.create({
      data: {
        userId,
        workspaceId: id,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    res.status(201).json({
      code: 0,
      data: membership,
      message: 'ok'
    })
  } catch (error) {
    console.error('添加工作空间成员错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

export default router
