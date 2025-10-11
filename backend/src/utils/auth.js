import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌',
        data: null
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
        data: null
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({
      code: 403,
      message: '认证令牌无效',
      data: null
    })
  }
}

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        code: 401,
        message: '未认证',
        data: null
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足',
        data: null
      })
    }

    next()
  }
}
