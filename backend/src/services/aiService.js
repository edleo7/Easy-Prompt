/**
 * AI服务抽象层
 * 支持：DeepSeek、通义千问、文心一言、Kimi等国产模型
 */

import axios from 'axios'

class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'deepseek'
    this.config = {
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat'
      },
      qianwen: {
        apiKey: process.env.QIANWEN_API_KEY,
        baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
        model: 'qwen-turbo'
      },
      wenxin: {
        apiKey: process.env.WENXIN_API_KEY,
        secretKey: process.env.WENXIN_SECRET_KEY,
        baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
        model: 'ernie-bot-turbo'
      },
      kimi: {
        apiKey: process.env.KIMI_API_KEY,
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k'
      }
    }
    
    this.initialized = false
    this.initProvider()
  }

  /**
   * 初始化AI服务提供商
   */
  initProvider() {
    const config = this.config[this.provider]
    
    if (!config) {
      console.warn(`⚠️ 不支持的AI提供商: ${this.provider}，降级到DeepSeek`)
      this.provider = 'deepseek'
      return this.initProvider()
    }

    if (!config.apiKey) {
      console.warn(`⚠️ ${this.provider} API Key未配置，AI功能将不可用`)
      this.initialized = false
      return
    }

    this.initialized = true
    console.log(`✅ AI服务初始化完成: ${this.provider}`)
  }

  /**
   * 对话（通用接口）
   * @param {Array<Object>} messages - 对话消息 [{role, content}]
   * @param {Object} options - 选项
   * @returns {Promise<String>} AI回复
   */
  async chat(messages, options = {}) {
    if (!this.initialized) {
      throw new Error('AI服务未初始化或API Key未配置')
    }

    const {
      temperature = 0.7,
      maxTokens = 2000,
      stream = false
    } = options

    switch (this.provider) {
      case 'deepseek':
        return await this.chatWithDeepSeek(messages, { temperature, maxTokens, stream })
      case 'qianwen':
        return await this.chatWithQianwen(messages, { temperature, maxTokens })
      case 'wenxin':
        return await this.chatWithWenxin(messages, { temperature, maxTokens })
      case 'kimi':
        return await this.chatWithKimi(messages, { temperature, maxTokens })
      default:
        throw new Error(`不支持的AI提供商: ${this.provider}`)
    }
  }

  /**
   * DeepSeek对话
   */
  async chatWithDeepSeek(messages, options) {
    const config = this.config.deepseek
    
    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model,
          messages: messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          stream: options.stream || false
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('DeepSeek API调用失败:', error.message)
      throw new Error(`DeepSeek API错误: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  /**
   * 通义千问对话
   */
  async chatWithQianwen(messages, options) {
    const config = this.config.qianwen
    
    try {
      const response = await axios.post(
        `${config.baseUrl}/services/aigc/text-generation/generation`,
        {
          model: config.model,
          input: {
            messages: messages
          },
          parameters: {
            temperature: options.temperature,
            max_tokens: options.maxTokens
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.output.text
    } catch (error) {
      console.error('通义千问API调用失败:', error.message)
      throw new Error(`通义千问API错误: ${error.message}`)
    }
  }

  /**
   * 文心一言对话
   */
  async chatWithWenxin(messages, options) {
    const config = this.config.wenxin
    
    // 文心一言需要先获取access_token
    // 这里简化处理，实际应该缓存token
    
    try {
      // 转换消息格式
      const lastMessage = messages[messages.length - 1]
      
      const response = await axios.post(
        `${config.baseUrl}/wenxinworkshop/chat/${config.model}`,
        {
          messages: messages,
          temperature: options.temperature,
          max_output_tokens: options.maxTokens
        },
        {
          params: {
            access_token: config.apiKey // 简化处理
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.result
    } catch (error) {
      console.error('文心一言API调用失败:', error.message)
      throw new Error(`文心一言API错误: ${error.message}`)
    }
  }

  /**
   * Kimi (Moonshot) 对话
   */
  async chatWithKimi(messages, options) {
    const config = this.config.kimi
    
    try {
      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model,
          messages: messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return response.data.choices[0].message.content
    } catch (error) {
      console.error('Kimi API调用失败:', error.message)
      throw new Error(`Kimi API错误: ${error.message}`)
    }
  }

  /**
   * 生成摘要
   * @param {String} text - 原文本
   * @param {Number} maxLength - 最大长度
   * @returns {Promise<String>} 摘要
   */
  async generateSummary(text, maxLength = 200) {
    if (!text || text.length === 0) {
      return ''
    }

    // 如果文本很短，直接返回
    if (text.length <= maxLength) {
      return text
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的文本摘要助手，擅长提取文本的核心要点。'
      },
      {
        role: 'user',
        content: `请为以下文本生成简洁的摘要（不超过${maxLength}字）：\n\n${text.substring(0, 4000)}`
      }
    ]

    try {
      const summary = await this.chat(messages, { temperature: 0.3, maxTokens: 500 })
      return summary
    } catch (error) {
      console.error('生成摘要失败:', error)
      // 降级：返回简单截取
      return text.substring(0, maxLength) + '...'
    }
  }

  /**
   * 提取关键词
   * @param {String} text - 原文本
   * @param {Number} count - 关键词数量
   * @returns {Promise<Array<String>>} 关键词数组
   */
  async extractKeywords(text, count = 10) {
    if (!text || text.length === 0) {
      return []
    }

    const messages = [
      {
        role: 'system',
        content: '你是一个专业的关键词提取助手，擅长从文本中提取核心关键词。'
      },
      {
        role: 'user',
        content: `请从以下文本中提取${count}个最重要的关键词，用逗号分隔：\n\n${text.substring(0, 4000)}`
      }
    ]

    try {
      const response = await this.chat(messages, { temperature: 0.3, maxTokens: 200 })
      // 解析关键词
      const keywords = response
        .split(/[,，、\n]/)
        .map(kw => kw.trim())
        .filter(kw => kw.length > 0)
        .slice(0, count)
      return keywords
    } catch (error) {
      console.error('提取关键词失败:', error)
      return []
    }
  }

  /**
   * 语义搜索（基于AI理解）
   * @param {String} query - 查询文本
   * @param {Array<Object>} corpus - 文档库 [{id, content}]
   * @returns {Promise<Array<Object>>} 排序后的文档
   */
  async semanticSearch(query, corpus) {
    if (!query || corpus.length === 0) {
      return corpus
    }

    // 构建提示词
    const documentsText = corpus
      .map((doc, idx) => `[${idx}] ${doc.content.substring(0, 500)}...`)
      .join('\n\n')

    const messages = [
      {
        role: 'system',
        content: '你是一个智能搜索助手，根据用户查询找出最相关的文档。'
      },
      {
        role: 'user',
        content: `用户查询："${query}"\n\n以下是文档列表：\n${documentsText}\n\n请返回与查询最相关的文档编号（从0开始），按相关性排序，用逗号分隔。只返回编号，不要其他解释。`
      }
    ]

    try {
      const response = await this.chat(messages, { temperature: 0.1, maxTokens: 100 })
      // 解析文档编号
      const indices = response
        .match(/\d+/g)
        ?.map(Number)
        .filter(idx => idx >= 0 && idx < corpus.length) || []

      // 按AI排序返回文档
      const sortedDocs = indices.map(idx => corpus[idx])
      // 添加未被排序的文档
      const remainingDocs = corpus.filter((_, idx) => !indices.includes(idx))
      
      return [...sortedDocs, ...remainingDocs]
    } catch (error) {
      console.error('语义搜索失败:', error)
      return corpus // 降级：返回原顺序
    }
  }

  /**
   * 问答（基于知识库上下文）
   * @param {String} question - 问题
   * @param {String} context - 上下文知识
   * @returns {Promise<Object>} {answer, references}
   */
  async answerQuestion(question, context) {
    const messages = [
      {
        role: 'system',
        content: '你是一个知识库AI助手，基于提供的知识库内容回答用户问题。如果知识库中没有相关信息，请明确告知用户。'
      },
      {
        role: 'user',
        content: `知识库内容：\n${context}\n\n用户问题：${question}\n\n请基于知识库内容回答问题。`
      }
    ]

    try {
      const answer = await this.chat(messages, { temperature: 0.7, maxTokens: 1000 })
      return {
        answer,
        references: [] // 后续可以实现引用溯源
      }
    } catch (error) {
      console.error('问答失败:', error)
      throw error
    }
  }
}

// 单例模式
let instance = null

export function getAIService() {
  if (!instance) {
    instance = new AIService()
  }
  return instance
}

export default AIService

