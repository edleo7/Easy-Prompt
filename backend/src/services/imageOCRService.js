/**
 * 图片OCR识别服务
 * 集成DeepSeek多模态能力进行图片文字识别
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * DeepSeek多模态API配置
 */
const DEEPSEEK_CONFIG = {
  apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-f443ecb4d4194aa0bdb009d1c32d7f9b',
  model: 'deepseek-vl-7b-chat', // DeepSeek视觉模型
  maxTokens: 4000,
  temperature: 0.1
}

/**
 * 支持的图片格式
 */
const SUPPORTED_IMAGE_TYPES = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/tiff': 'tiff',
  'image/tif': 'tif',
  'image/webp': 'webp',
  'image/heif': 'heif',
  'image/heic': 'heic'
}

class ImageOCRService {
  constructor() {
    this.isInitialized = false
    this.initialize()
  }

  async initialize() {
    try {
      console.log('🖼️ 图片OCR服务初始化中...')
      this.isInitialized = true
      console.log('✅ 图片OCR服务初始化完成')
    } catch (error) {
      console.error('❌ 图片OCR服务初始化失败:', error)
      this.isInitialized = false
    }
  }

  /**
   * 检查是否为支持的图片格式
   * @param {string} mimeType - MIME类型
   * @returns {boolean} 是否支持
   */
  isSupportedImageType(mimeType) {
    return SUPPORTED_IMAGE_TYPES.hasOwnProperty(mimeType)
  }

  /**
   * 将图片转换为Base64编码
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<string>} Base64编码的图片
   */
  async imageToBase64(imagePath) {
    try {
      const imageBuffer = await fs.readFile(imagePath)
      const base64 = imageBuffer.toString('base64')
      const mimeType = await this.getImageMimeType(imagePath)
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      console.error('图片转Base64失败:', error)
      throw error
    }
  }

  /**
   * 获取图片MIME类型
   * @param {string} imagePath - 图片文件路径
   * @returns {Promise<string>} MIME类型
   */
  async getImageMimeType(imagePath) {
    const ext = path.extname(imagePath).toLowerCase()
    const extToMime = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.bmp': 'image/bmp',
      '.gif': 'image/gif',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
      '.webp': 'image/webp',
      '.heif': 'image/heif',
      '.heic': 'image/heic'
    }
    return extToMime[ext] || 'image/jpeg'
  }

  /**
   * 调用DeepSeek多模态API进行OCR识别
   * @param {string} imageBase64 - Base64编码的图片
   * @param {string} prompt - 识别提示词
   * @returns {Promise<Object>} OCR识别结果
   */
  async recognizeTextWithDeepSeek(imageBase64, prompt = '请识别图片中的所有文字内容') {
    try {
      if (!this.isInitialized) {
        throw new Error('OCR服务未初始化')
      }

      const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_CONFIG.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            }
          ],
          temperature: DEEPSEEK_CONFIG.temperature,
          max_tokens: DEEPSEEK_CONFIG.maxTokens,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`DeepSeek API调用失败: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        text: data.choices[0]?.message?.content || '',
        usage: data.usage,
        model: DEEPSEEK_CONFIG.model,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('DeepSeek OCR识别失败:', error)
      return {
        success: false,
        error: error.message,
        model: DEEPSEEK_CONFIG.model,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 处理图片文件并提取文字
   * @param {string} imagePath - 图片文件路径
   * @param {string} mimeType - 图片MIME类型
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async processImage(imagePath, mimeType, options = {}) {
    try {
      if (!this.isSupportedImageType(mimeType)) {
        throw new Error(`不支持的图片格式: ${mimeType}`)
      }

      // 将图片转换为Base64
      const imageBase64 = await this.imageToBase64(imagePath)
      
      // 构建OCR提示词
      const prompt = options.prompt || this.buildOCRPrompt(options)
      
      // 调用DeepSeek进行OCR识别
      const ocrResult = await this.recognizeTextWithDeepSeek(imageBase64, prompt)
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error)
      }

      return {
        success: true,
        content: ocrResult.text,
        metadata: {
          imagePath,
          mimeType,
          model: ocrResult.model,
          usage: ocrResult.usage,
          processedAt: new Date().toISOString()
        },
        type: 'image_ocr'
      }
    } catch (error) {
      console.error('图片OCR处理失败:', error)
      throw error
    }
  }

  /**
   * 构建OCR识别提示词
   * @param {Object} options - 选项
   * @returns {string} 提示词
   */
  buildOCRPrompt(options = {}) {
    let prompt = '请仔细识别图片中的所有文字内容，包括：\n'
    
    if (options.includeLayout) {
      prompt += '- 保持原有的文字布局和格式\n'
    }
    
    if (options.includeTables) {
      prompt += '- 识别表格内容，保持表格结构\n'
    }
    
    if (options.includeCode) {
      prompt += '- 识别代码块，保持代码格式\n'
    }
    
    if (options.language) {
      prompt += `- 特别注意识别${options.language}语言的内容\n`
    }
    
    prompt += '\n请将识别结果以清晰的文本格式输出，如果图片中没有文字，请返回"未检测到文字内容"。'
    
    return prompt
  }

  /**
   * 批量处理图片文件
   * @param {Array} imageFiles - 图片文件列表
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 处理结果列表
   */
  async batchProcessImages(imageFiles, options = {}) {
    const results = []
    
    for (const file of imageFiles) {
      try {
        const result = await this.processImage(file.path, file.mimeType, options)
        results.push({
          fileId: file.id,
          fileName: file.name,
          success: true,
          ...result
        })
      } catch (error) {
        results.push({
          fileId: file.id,
          fileName: file.name,
          success: false,
          error: error.message
        })
      }
    }
    
    return results
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      supportedTypes: Object.keys(SUPPORTED_IMAGE_TYPES),
      model: DEEPSEEK_CONFIG.model,
      apiUrl: DEEPSEEK_CONFIG.apiUrl
    }
  }
}

// 创建单例实例
const imageOCRService = new ImageOCRService()

export default imageOCRService
export { SUPPORTED_IMAGE_TYPES }
