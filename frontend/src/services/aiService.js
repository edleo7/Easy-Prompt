/**
 * AI服务模块 - 统一管理各种AI模型调用
 * 支持DeepSeek、GPT、Claude等多种模型
 */

// AI模型配置
const AI_MODELS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    displayName: '智能助手',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
    apiKey: 'sk-f443ecb4d4194aa0bdb009d1c32d7f9b',
    model: 'deepseek-chat',
    maxTokens: 4000,
    temperature: 0.7
  },
  GPT4: {
    name: 'GPT-4',
    displayName: 'GPT-4',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '', // 需要用户配置
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.7
  },
  CLAUDE: {
    name: 'Claude',
    displayName: 'Claude',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: '', // 需要用户配置
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4000,
    temperature: 0.7
  }
}

/**
 * 基础AI服务类
 */
class AIService {
  constructor() {
    this.currentModel = AI_MODELS.DEEPSEEK // 默认使用DeepSeek
  }

  /**
   * 设置当前使用的AI模型
   * @param {string} modelName - 模型名称
   */
  setModel(modelName) {
    if (AI_MODELS[modelName]) {
      this.currentModel = AI_MODELS[modelName]
    } else {
      console.warn(`模型 ${modelName} 不存在，使用默认模型`)
    }
  }

  /**
   * 获取当前模型信息
   */
  getCurrentModel() {
    return this.currentModel
  }

  /**
   * 获取所有可用模型
   */
  getAvailableModels() {
    return Object.keys(AI_MODELS).map(key => ({
      key,
      ...AI_MODELS[key]
    }))
  }

  /**
   * 调用AI模型进行文本生成
   * @param {string} prompt - 输入提示词
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} AI响应结果
   */
  async generateText(prompt, options = {}) {
    const {
      temperature = this.currentModel.temperature,
      maxTokens = this.currentModel.maxTokens,
      systemMessage = '你是一个智能助手，请根据用户的问题提供准确、有用的回答。'
    } = options

    try {
      const response = await this._callAPI(prompt, {
        temperature,
        maxTokens,
        systemMessage
      })

      return {
        success: true,
        content: response.content,
        model: this.currentModel.displayName,
        usage: response.usage || null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('AI调用失败:', error)
      return {
        success: false,
        error: error.message,
        model: this.currentModel.displayName,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 调用AI模型进行多模态处理（图片+文本）
   * @param {string} prompt - 文本提示词
   * @param {File|string} image - 图片文件或base64
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} AI响应结果
   */
  async generateMultimodal(prompt, image, options = {}) {
    // 目前DeepSeek不支持多模态，这里返回文本处理结果
    return this.generateText(prompt, options)
  }

  /**
   * 调用AI模型进行Prompt优化
   * @param {string} originalPrompt - 原始Prompt
   * @param {Object} context - 上下文信息（记忆、知识库等）
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 优化后的Prompt
   */
  async optimizePrompt(originalPrompt, context = {}, options = {}) {
    const systemMessage = `你是一个专业的Prompt工程师，擅长优化和增强提示词。
请根据用户提供的原始Prompt和上下文信息，生成一个更精确、更有效的Prompt。

优化原则：
1. 保持原始意图不变
2. 增加必要的上下文信息
3. 使用清晰、具体的指令
4. 确保输出格式符合要求
5. 提高AI理解和执行的效果

请直接返回优化后的Prompt，不要添加额外说明。`

    const enhancedPrompt = `原始Prompt: ${originalPrompt}

上下文信息:
${JSON.stringify(context, null, 2)}

请优化这个Prompt，使其更加精确和有效。`

    return this.generateText(enhancedPrompt, {
      ...options,
      systemMessage
    })
  }

  /**
   * 调用AI模型进行文本理解分析
   * @param {string} text - 待分析的文本
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeText(text, options = {}) {
    const systemMessage = `你是一个专业的文本分析专家，擅长理解文本的语义、情感、主题和结构。
请对用户提供的文本进行深入分析，包括但不限于：
1. 主要主题和关键词
2. 情感倾向
3. 文本结构分析
4. 潜在意图
5. 建议的后续行动

请以结构化的JSON格式返回分析结果。`

    const analysisPrompt = `请分析以下文本：

${text}

请提供详细的分析结果。`

    return this.generateText(analysisPrompt, {
      ...options,
      systemMessage
    })
  }

  /**
   * 内部API调用方法
   * @private
   */
  async _callAPI(prompt, options) {
    const { temperature, maxTokens, systemMessage } = options

    if (this.currentModel.name === 'DeepSeek') {
      return this._callDeepSeekAPI(prompt, { temperature, maxTokens, systemMessage })
    } else if (this.currentModel.name === 'GPT-4') {
      return this._callOpenAIAPI(prompt, { temperature, maxTokens, systemMessage })
    } else if (this.currentModel.name === 'Claude') {
      return this._callClaudeAPI(prompt, { temperature, maxTokens, systemMessage })
    } else {
      throw new Error(`不支持的模型: ${this.currentModel.name}`)
    }
  }

  /**
   * 调用DeepSeek API
   * @private
   */
  async _callDeepSeekAPI(prompt, options) {
    const { temperature, maxTokens, systemMessage } = options

    const response = await fetch(this.currentModel.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.currentModel.apiKey}`
      },
      body: JSON.stringify({
        model: this.currentModel.model,
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API调用失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0]?.message?.content || '抱歉，我无法生成回复。',
      usage: data.usage
    }
  }

  /**
   * 调用OpenAI API
   * @private
   */
  async _callOpenAIAPI(prompt, options) {
    // 实现OpenAI API调用
    throw new Error('OpenAI API暂未实现，请配置API Key')
  }

  /**
   * 调用Claude API
   * @private
   */
  async _callClaudeAPI(prompt, options) {
    // 实现Claude API调用
    throw new Error('Claude API暂未实现，请配置API Key')
  }
}

// 创建单例实例
const aiService = new AIService()

export default aiService
export { AI_MODELS }
