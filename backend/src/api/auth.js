import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()
const prisma = new PrismaClient()

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '请填写邮箱和密码',
        data: null
      })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户已存在',
        data: null
      })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: name || email.split('@')[0]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: user
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        code: 400,
        message: '请填写邮箱和密码',
        data: null
      })
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误',
        data: null
      })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '邮箱或密码错误',
        data: null
      })
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      })
    }

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(401).json({
      code: 401,
      message: '认证失败',
      data: null
    })
  }
})

export default router
