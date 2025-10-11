/**
 * 订阅管理API
 * 处理用户套餐和计费相关功能
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken } from '../utils/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// 应用认证中间件到所有路由（除了获取套餐列表）
router.use((req, res, next) => {
  if (req.path === '/plans') {
    return next()
  }
  return authenticateToken(req, res, next)
})

/**
 * 套餐类型定义
 */
const PLANS = {
  FREE: {
    id: 'free',
    name: '免费版',
    price: 0,
    features: {
      maxProjects: 3,
      maxMemories: 100,
      maxKnowledgeBases: 2,
      maxStorage: 100, // MB
      aiGenerations: 50, // 每月
      supportLevel: 'community'
    }
  },
  BASIC: {
    id: 'basic',
    name: '基础版',
    price: 29,
    features: {
      maxProjects: 20,
      maxMemories: 1000,
      maxKnowledgeBases: 10,
      maxStorage: 1000, // MB
      aiGenerations: 500, // 每月
      supportLevel: 'email'
    }
  },
  PRO: {
    id: 'pro',
    name: '专业版',
    price: 99,
    features: {
      maxProjects: 100,
      maxMemories: 10000,
      maxKnowledgeBases: 50,
      maxStorage: 10000, // MB
      aiGenerations: 2000, // 每月
      supportLevel: 'priority'
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    features: {
      maxProjects: -1, // 无限制
      maxMemories: -1, // 无限制
      maxKnowledgeBases: -1, // 无限制
      maxStorage: -1, // 无限制
      aiGenerations: -1, // 无限制
      supportLevel: 'dedicated'
    }
  }
}

/**
 * 获取所有可用套餐
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.values(PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      features: plan.features
    }))

    res.json({
      code: 0,
      data: plans,
      message: '获取套餐列表成功'
    })
  } catch (error) {
    console.error('获取套餐列表错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取用户当前订阅信息
 */
router.get('/current', async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        subscription: {
          select: {
            id: true,
            planId: true,
            status: true,
            startDate: true,
            endDate: true,
            autoRenew: true,
            paymentMethod: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '用户不存在'
      })
    }

    const currentPlan = PLANS[user.plan] || PLANS.FREE
    const subscription = user.subscription

    res.json({
      code: 0,
      data: {
        user: {
          id: user.id,
          plan: user.plan
        },
        currentPlan: {
          id: currentPlan.id,
          name: currentPlan.name,
          price: currentPlan.price,
          features: currentPlan.features
        },
        subscription: subscription ? {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          autoRenew: subscription.autoRenew,
          paymentMethod: subscription.paymentMethod
        } : null
      },
      message: '获取订阅信息成功'
    })
  } catch (error) {
    console.error('获取订阅信息错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

/**
 * 创建订阅
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId
    const { planId, paymentMethod } = req.body

    if (!planId || !PLANS[planId.toUpperCase()]) {
      return res.status(400).json({
        code: 40001,
        data: null,
        message: '无效的套餐ID'
      })
    }

    // 检查是否已有活跃订阅
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trial'] }
      }
    })

    if (existingSubscription) {
      return res.status(400).json({
        code: 40002,
        data: null,
        message: '用户已有活跃订阅'
      })
    }

    const plan = PLANS[planId.toUpperCase()]
    const startDate = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 默认1个月

    // 创建订阅记录
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'active',
        startDate,
        endDate,
        autoRenew: true,
        paymentMethod: paymentMethod || 'credit_card'
      }
    })

    // 更新用户套餐
    await prisma.user.update({
      where: { id: userId },
      data: { plan: planId.toUpperCase() }
    })

    res.json({
      code: 0,
      data: {
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          autoRenew: subscription.autoRenew,
          paymentMethod: subscription.paymentMethod
        },
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          features: plan.features
        }
      },
      message: '订阅创建成功'
    })
  } catch (error) {
    console.error('创建订阅错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

/**
 * 更新订阅
 */
router.put('/:subscriptionId', async (req, res) => {
  try {
    const userId = req.user.userId
    const { subscriptionId } = req.params
    const { planId, autoRenew } = req.body

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId
      }
    })

    if (!subscription) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '订阅不存在'
      })
    }

    const updateData = {}
    if (planId && PLANS[planId.toUpperCase()]) {
      updateData.planId = planId.toUpperCase()
    }
    if (autoRenew !== undefined) {
      updateData.autoRenew = autoRenew
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData
    })

    // 如果更新了套餐，同时更新用户套餐
    if (planId) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: planId.toUpperCase() }
      })
    }

    res.json({
      code: 0,
      data: {
        subscription: {
          id: updatedSubscription.id,
          planId: updatedSubscription.planId,
          status: updatedSubscription.status,
          startDate: updatedSubscription.startDate,
          endDate: updatedSubscription.endDate,
          autoRenew: updatedSubscription.autoRenew,
          paymentMethod: updatedSubscription.paymentMethod
        }
      },
      message: '订阅更新成功'
    })
  } catch (error) {
    console.error('更新订阅错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

/**
 * 取消订阅
 */
router.delete('/:subscriptionId', async (req, res) => {
  try {
    const userId = req.user.userId
    const { subscriptionId } = req.params

    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId
      }
    })

    if (!subscription) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '订阅不存在'
      })
    }

    // 更新订阅状态为已取消
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        autoRenew: false
      }
    })

    // 将用户套餐降级为免费版
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'FREE' }
    })

    res.json({
      code: 0,
      data: null,
      message: '订阅已取消'
    })
  } catch (error) {
    console.error('取消订阅错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

/**
 * 获取使用情况统计
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        _count: {
          select: {
            tasks: true,
            memories: true,
            knowledgeBases: true,
            prompts: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        code: 40401,
        data: null,
        message: '用户不存在'
      })
    }

    const currentPlan = PLANS[user.plan] || PLANS.FREE
    const usage = {
      projects: {
        used: user._count.tasks,
        limit: currentPlan.features.maxProjects
      },
      memories: {
        used: user._count.memories,
        limit: currentPlan.features.maxMemories
      },
      knowledgeBases: {
        used: user._count.knowledgeBases,
        limit: currentPlan.features.maxKnowledgeBases
      },
      aiGenerations: {
        used: user._count.prompts,
        limit: currentPlan.features.aiGenerations
      }
    }

    res.json({
      code: 0,
      data: {
        usage,
        plan: {
          id: currentPlan.id,
          name: currentPlan.name,
          features: currentPlan.features
        }
      },
      message: '获取使用情况成功'
    })
  } catch (error) {
    console.error('获取使用情况错误:', error)
    res.status(500).json({
      code: 50000,
      data: null,
      message: '服务器内部错误'
    })
  }
})

export default router
