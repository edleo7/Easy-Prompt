/**
 * 支付网关集成服务
 * 支持多种支付方式：Stripe、PayPal、支付宝、微信支付
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 支付网关配置
 */
const PAYMENT_CONFIG = {
  stripe: {
    enabled: process.env.STRIPE_ENABLED === 'true',
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  paypal: {
    enabled: process.env.PAYPAL_ENABLED === 'true',
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox' // sandbox, live
  },
  alipay: {
    enabled: process.env.ALIPAY_ENABLED === 'true',
    appId: process.env.ALIPAY_APP_ID,
    privateKey: process.env.ALIPAY_PRIVATE_KEY,
    publicKey: process.env.ALIPAY_PUBLIC_KEY,
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do'
  },
  wechat: {
    enabled: process.env.WECHAT_ENABLED === 'true',
    appId: process.env.WECHAT_APP_ID,
    mchId: process.env.WECHAT_MCH_ID,
    apiKey: process.env.WECHAT_API_KEY,
    certPath: process.env.WECHAT_CERT_PATH
  }
}

class PaymentGatewayService {
  constructor() {
    this.gateways = {}
    this.initializeGateways()
  }

  async initializeGateways() {
    try {
      // 初始化Stripe
      if (PAYMENT_CONFIG.stripe.enabled) {
        await this.initializeStripe()
      }

      // 初始化PayPal
      if (PAYMENT_CONFIG.paypal.enabled) {
        await this.initializePayPal()
      }

      // 初始化支付宝
      if (PAYMENT_CONFIG.alipay.enabled) {
        await this.initializeAlipay()
      }

      // 初始化微信支付
      if (PAYMENT_CONFIG.wechat.enabled) {
        await this.initializeWeChat()
      }

      console.log('✅ 支付网关初始化完成')
    } catch (error) {
      console.error('支付网关初始化失败:', error)
    }
  }

  async initializeStripe() {
    try {
      const stripe = await import('stripe')
      this.gateways.stripe = stripe.default(PAYMENT_CONFIG.stripe.secretKey)
      console.log('✅ Stripe支付网关初始化成功')
    } catch (error) {
      console.warn('Stripe初始化失败:', error.message)
    }
  }

  async initializePayPal() {
    try {
      const paypal = await import('@paypal/checkout-server-sdk')
      
      const environment = PAYMENT_CONFIG.paypal.mode === 'live' 
        ? new paypal.core.LiveEnvironment(PAYMENT_CONFIG.paypal.clientId, PAYMENT_CONFIG.paypal.clientSecret)
        : new paypal.core.SandboxEnvironment(PAYMENT_CONFIG.paypal.clientId, PAYMENT_CONFIG.paypal.clientSecret)
      
      this.gateways.paypal = new paypal.core.PayPalHttpClient(environment)
      console.log('✅ PayPal支付网关初始化成功')
    } catch (error) {
      console.warn('PayPal初始化失败:', error.message)
    }
  }

  async initializeAlipay() {
    try {
      // 这里应该集成支付宝SDK
      // 由于支付宝SDK比较复杂，这里提供接口框架
      this.gateways.alipay = {
        config: PAYMENT_CONFIG.alipay,
        initialized: true
      }
      console.log('✅ 支付宝支付网关初始化成功')
    } catch (error) {
      console.warn('支付宝初始化失败:', error.message)
    }
  }

  async initializeWeChat() {
    try {
      // 这里应该集成微信支付SDK
      this.gateways.wechat = {
        config: PAYMENT_CONFIG.wechat,
        initialized: true
      }
      console.log('✅ 微信支付网关初始化成功')
    } catch (error) {
      console.warn('微信支付初始化失败:', error.message)
    }
  }

  /**
   * 创建支付订单
   * @param {Object} orderData - 订单数据
   * @param {string} gateway - 支付网关
   * @returns {Promise<Object>} 支付结果
   */
  async createPayment(orderData, gateway = 'stripe') {
    try {
      const { amount, currency, planId, userId, description } = orderData

      // 创建订单记录
      const order = await prisma.paymentOrder.create({
        data: {
          userId,
          planId,
          amount: Math.round(amount * 100), // 转换为分
          currency: currency || 'usd',
          status: 'pending',
          gateway,
          description,
          metadata: JSON.stringify(orderData)
        }
      })

      let paymentResult

      switch (gateway) {
        case 'stripe':
          paymentResult = await this.createStripePayment(order, orderData)
          break
        case 'paypal':
          paymentResult = await this.createPayPalPayment(order, orderData)
          break
        case 'alipay':
          paymentResult = await this.createAlipayPayment(order, orderData)
          break
        case 'wechat':
          paymentResult = await this.createWeChatPayment(order, orderData)
          break
        default:
          throw new Error(`不支持的支付网关: ${gateway}`)
      }

      // 更新订单状态
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          gatewayOrderId: paymentResult.id,
          status: paymentResult.status,
          paymentUrl: paymentResult.paymentUrl
        }
      })

      return {
        orderId: order.id,
        gatewayOrderId: paymentResult.id,
        status: paymentResult.status,
        paymentUrl: paymentResult.paymentUrl,
        clientSecret: paymentResult.clientSecret
      }
    } catch (error) {
      console.error('创建支付订单失败:', error)
      throw error
    }
  }

  /**
   * 创建Stripe支付
   * @param {Object} order - 订单数据
   * @param {Object} orderData - 订单详情
   * @returns {Promise<Object>} 支付结果
   */
  async createStripePayment(order, orderData) {
    if (!this.gateways.stripe) {
      throw new Error('Stripe支付网关未初始化')
    }

    try {
      const paymentIntent = await this.gateways.stripe.paymentIntents.create({
        amount: order.amount,
        currency: order.currency,
        metadata: {
          orderId: order.id,
          planId: order.planId,
          userId: order.userId
        },
        description: order.description
      })

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret
      }
    } catch (error) {
      console.error('Stripe支付创建失败:', error)
      throw error
    }
  }

  /**
   * 创建PayPal支付
   * @param {Object} order - 订单数据
   * @param {Object} orderData - 订单详情
   * @returns {Promise<Object>} 支付结果
   */
  async createPayPalPayment(order, orderData) {
    if (!this.gateways.paypal) {
      throw new Error('PayPal支付网关未初始化')
    }

    try {
      const paypal = await import('@paypal/checkout-server-sdk')
      
      const request = new paypal.orders.OrdersCreateRequest()
      request.prefer('return=representation')
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: order.currency.toUpperCase(),
            value: (order.amount / 100).toFixed(2)
          },
          description: order.description
        }],
        application_context: {
          brand_name: 'EasyPrompt',
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success?orderId=${order.id}`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?orderId=${order.id}`
        }
      })

      const response = await this.gateways.paypal.execute(request)
      
      return {
        id: response.result.id,
        status: 'pending',
        paymentUrl: response.result.links.find(link => link.rel === 'approve').href
      }
    } catch (error) {
      console.error('PayPal支付创建失败:', error)
      throw error
    }
  }

  /**
   * 创建支付宝支付
   * @param {Object} order - 订单数据
   * @param {Object} orderData - 订单详情
   * @returns {Promise<Object>} 支付结果
   */
  async createAlipayPayment(order, orderData) {
    if (!this.gateways.alipay) {
      throw new Error('支付宝支付网关未初始化')
    }

    try {
      // 这里应该调用支付宝API
      // 由于支付宝SDK集成复杂，这里返回模拟结果
      return {
        id: `alipay_${order.id}`,
        status: 'pending',
        paymentUrl: `${PAYMENT_CONFIG.alipay.gateway}?orderId=${order.id}`
      }
    } catch (error) {
      console.error('支付宝支付创建失败:', error)
      throw error
    }
  }

  /**
   * 创建微信支付
   * @param {Object} order - 订单数据
   * @param {Object} orderData - 订单详情
   * @returns {Promise<Object>} 支付结果
   */
  async createWeChatPayment(order, orderData) {
    if (!this.gateways.wechat) {
      throw new Error('微信支付网关未初始化')
    }

    try {
      // 这里应该调用微信支付API
      return {
        id: `wechat_${order.id}`,
        status: 'pending',
        paymentUrl: `weixin://wxpay/bizpayurl?pr=${order.id}`
      }
    } catch (error) {
      console.error('微信支付创建失败:', error)
      throw error
    }
  }

  /**
   * 处理支付回调
   * @param {string} gateway - 支付网关
   * @param {Object} webhookData - 回调数据
   * @returns {Promise<Object>} 处理结果
   */
  async handleWebhook(gateway, webhookData) {
    try {
      switch (gateway) {
        case 'stripe':
          return await this.handleStripeWebhook(webhookData)
        case 'paypal':
          return await this.handlePayPalWebhook(webhookData)
        case 'alipay':
          return await this.handleAlipayWebhook(webhookData)
        case 'wechat':
          return await this.handleWeChatWebhook(webhookData)
        default:
          throw new Error(`不支持的支付网关: ${gateway}`)
      }
    } catch (error) {
      console.error('处理支付回调失败:', error)
      throw error
    }
  }

  /**
   * 处理Stripe回调
   * @param {Object} webhookData - 回调数据
   * @returns {Promise<Object>} 处理结果
   */
  async handleStripeWebhook(webhookData) {
    const { type, data } = webhookData

    if (type === 'payment_intent.succeeded') {
      const paymentIntent = data.object
      const orderId = paymentIntent.metadata.orderId

      // 更新订单状态
      await prisma.paymentOrder.update({
        where: { id: orderId },
        data: { status: 'completed' }
      })

      // 激活用户订阅
      await this.activateSubscription(orderId)

      return { success: true, orderId }
    }

    return { success: false, message: '未处理的回调类型' }
  }

  /**
   * 激活用户订阅
   * @param {string} orderId - 订单ID
   * @returns {Promise<void>}
   */
  async activateSubscription(orderId) {
    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId },
        include: { user: true }
      })

      if (!order) {
        throw new Error('订单不存在')
      }

      // 创建或更新订阅
      await prisma.subscription.upsert({
        where: { userId: order.userId },
        update: {
          planId: order.planId,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
          autoRenew: true
        },
        create: {
          userId: order.userId,
          planId: order.planId,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        }
      })

      // 更新用户套餐
      await prisma.user.update({
        where: { id: order.userId },
        data: { plan: order.planId.toUpperCase() }
      })

      console.log(`用户 ${order.userId} 订阅已激活`)
    } catch (error) {
      console.error('激活订阅失败:', error)
      throw error
    }
  }

  /**
   * 获取支付状态
   * @param {string} orderId - 订单ID
   * @returns {Promise<Object>} 支付状态
   */
  async getPaymentStatus(orderId) {
    try {
      const order = await prisma.paymentOrder.findUnique({
        where: { id: orderId }
      })

      if (!order) {
        throw new Error('订单不存在')
      }

      return {
        orderId: order.id,
        status: order.status,
        amount: order.amount / 100,
        currency: order.currency,
        gateway: order.gateway,
        createdAt: order.createdAt
      }
    } catch (error) {
      console.error('获取支付状态失败:', error)
      throw error
    }
  }

  /**
   * 获取支持的支付方式
   * @returns {Array} 支付方式列表
   */
  getSupportedGateways() {
    const gateways = []
    
    if (this.gateways.stripe) {
      gateways.push({
        id: 'stripe',
        name: 'Stripe',
        description: '支持信用卡、借记卡',
        enabled: true
      })
    }
    
    if (this.gateways.paypal) {
      gateways.push({
        id: 'paypal',
        name: 'PayPal',
        description: 'PayPal账户支付',
        enabled: true
      })
    }
    
    if (this.gateways.alipay) {
      gateways.push({
        id: 'alipay',
        name: '支付宝',
        description: '支付宝账户支付',
        enabled: true
      })
    }
    
    if (this.gateways.wechat) {
      gateways.push({
        id: 'wechat',
        name: '微信支付',
        description: '微信账户支付',
        enabled: true
      })
    }

    return gateways
  }
}

// 创建单例实例
const paymentGateway = new PaymentGatewayService()

export default paymentGateway






