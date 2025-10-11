import express from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        apiKey: true,
        createdAt: true,
        _count: {
          select: {
            tasks: true,
            prompts: true,
            documents: true
          }
        }
      }
    })

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const { username, email } = req.body
    const userId = req.user.userId

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        email
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        plan: true,
        updatedAt: true
      }
    })

    res.json({
      code: 200,
      message: '用户信息更新成功',
      data: user
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.userId

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: '请提供当前密码和新密码',
        data: null
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({
        code: 400,
        message: '当前密码错误',
        data: null
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    res.json({
      code: 200,
      message: '密码修改成功',
      data: null
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

export default router
