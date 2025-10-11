import express from 'express'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const router = express.Router()
const prisma = new PrismaClient()

// 获取工作空间的 API Keys
router.get('/:workspaceId/apikeys', async (req, res) => {
  try {
    const { workspaceId } = req.params
    const userId = req.user.userId

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

    const apiKeys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyHash: true,
        createdAt: true
      }
    })

    // 对 keyHash 进行脱敏处理
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      keyMasked: key.keyHash.substring(0, 8) + '...' + key.keyHash.substring(key.keyHash.length - 4)
    }))

    res.json({
      code: 0,
      data: maskedKeys,
      message: 'ok'
    })
  } catch (error) {
    console.error('获取 API Keys 错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 创建 API Key
router.post('/:workspaceId/apikeys', async (req, res) => {
  try {
    const { workspaceId } = req.params
    const { name } = req.body
    const userId = req.user.userId

    if (!name) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '参数错误：API Key 名称不能为空'
      })
    }

    // 检查用户是否有权限
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } }
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

    // 生成 API Key
    const apiKey = `ep_${uuidv4().replace(/-/g, '')}`
    const keyHash = await bcrypt.hash(apiKey, 10)

    const newApiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        workspaceId
      }
    })

    res.status(201).json({
      code: 0,
      data: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // 仅在创建时返回明文
        createdAt: newApiKey.createdAt
      },
      message: 'ok'
    })
  } catch (error) {
    console.error('创建 API Key 错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

// 删除 API Key
router.delete('/:workspaceId/apikeys/:keyId', async (req, res) => {
  try {
    const { workspaceId, keyId } = req.params
    const userId = req.user.userId

    // 检查用户是否有权限
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId, role: { in: ['OWNER', 'ADMIN'] } } } }
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

    await prisma.apiKey.delete({
      where: { id: keyId }
    })

    res.json({
      code: 0,
      data: null,
      message: 'ok'
    })
  } catch (error) {
    console.error('删除 API Key 错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务异常'
    })
  }
})

export default router
