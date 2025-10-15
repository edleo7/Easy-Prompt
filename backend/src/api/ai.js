/**
 * AI助手相关API
 * 提供对话、摘要、搜索等功能
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { getAIService } from '../services/aiService.js'

const router = express.Router()
const prisma = new PrismaClient()

// ==================== AI对话接口 ====================

// AI对话
router.post('/kb/:kbId/ai/chat', async (req, res) => {
  const { kbId } = req.params
  const { message, history = [] } = req.body

  try {
    // 验证知识库是否存在
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    // 获取知识库相关文档
    const files = await prisma.file.findMany({
      where: { kbId },
      select: {
        id: true,
        name: true,
        extractedText: true,
        mimeType: true,
        tags: true
      }
    })

    // 构建上下文
    const context = files
      .filter(file => file.extractedText)
      .map(file => ({
        id: file.id,
        name: file.name,
        content: file.extractedText.substring(0, 1000), // 限制长度
        type: file.mimeType
      }))
      .slice(0, 10) // 最多10个文档作为上下文

    // 构建对话消息
    const messages = [
      {
        role: 'system',
        content: `你是一个智能助手，专门帮助用户理解和查找知识库中的内容。当前知识库"${knowledgeBase.name}"包含以下文档：

${context.map(doc => `- ${doc.name}: ${doc.content.substring(0, 200)}...`).join('\n')}

请基于这些文档内容回答用户的问题，并在回答中引用相关的文档。如果问题与知识库内容无关，请礼貌地说明。`
      },
      ...history.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // 调用AI服务
    const aiService = getAIService()
    const response = await aiService.chat(messages, {
      maxTokens: 1000,
      temperature: 0.7
    })

    // 分析回复，提取相关文档引用
    const references = []
    context.forEach(doc => {
      if (response.reply.toLowerCase().includes(doc.name.toLowerCase()) ||
          doc.content.toLowerCase().includes(message.toLowerCase())) {
        references.push({
          fileId: doc.id,
          fileName: doc.name
        })
      }
    })

    res.json({
      code: 200,
      message: '对话成功',
      data: {
        reply: response.reply,
        references: references.slice(0, 3) // 最多3个引用
      }
    })

  } catch (error) {
    console.error('AI对话失败:', error)
    res.status(500).json({
      code: 500,
      message: 'AI对话失败',
      data: null
    })
  }
})

// 快速提问
router.post('/kb/:kbId/ai/quick-ask', async (req, res) => {
  const { kbId } = req.params
  const { question } = req.body

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            extractedText: true,
            mimeType: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    const aiService = getAIService()
    let response = ''

    switch (question) {
      case 'summarize':
        // 生成摘要
        const allText = knowledgeBase.files
          .filter(file => file.extractedText)
          .map(file => file.extractedText)
          .join('\n\n')
          .substring(0, 5000) // 限制长度

        response = await aiService.generateSummary(allText)
        break

      case 'keywords':
        // 提取关键词
        const content = knowledgeBase.files
          .filter(file => file.extractedText)
          .map(file => file.extractedText)
          .join('\n\n')
          .substring(0, 3000)

        const keywords = await aiService.extractKeywords(content)
        response = `主要关键词：${keywords.join('、')}`
        break

      case 'topics':
        // 主要话题
        const topics = knowledgeBase.files
          .filter(file => file.extractedText)
          .map(file => ({
            name: file.name,
            type: file.mimeType,
            content: file.extractedText.substring(0, 500)
          }))

        response = `知识库包含 ${topics.length} 个文档，主要涉及：\n${topics.slice(0, 5).map(topic => `- ${topic.name}`).join('\n')}`
        break

      default:
        response = '请选择具体的快速提问类型'
    }

    res.json({
      code: 200,
      message: '快速提问成功',
      data: {
        reply: response,
        references: []
      }
    })

  } catch (error) {
    console.error('快速提问失败:', error)
    res.status(500).json({
      code: 500,
      message: '快速提问失败',
      data: null
    })
  }
})

// ==================== 知识库摘要接口 ====================

// 获取知识库摘要
router.get('/kb/:kbId/summary', async (req, res) => {
  const { kbId } = req.params

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            extractedText: true,
            mimeType: true,
            size: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    // 这里应该从数据库获取已生成的摘要
    // 暂时返回模拟数据
    const summary = {
      content: `这是知识库"${knowledgeBase.name}"的智能摘要。该知识库包含 ${knowledgeBase.files.length} 个文档，涵盖了多个主题的内容。`,
      keywords: ['知识管理', '文档处理', '智能分析'],
      mainTopics: [
        {
          title: '文档管理',
          description: '包含各种文档的存储和管理'
        },
        {
          title: '内容分析',
          description: '对文档内容的智能分析和提取'
        }
      ],
      generatedAt: new Date(),
      documentCount: knowledgeBase.files.length
    }

    res.json({
      code: 200,
      message: '获取摘要成功',
      data: summary
    })

  } catch (error) {
    console.error('获取摘要失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取摘要失败',
      data: null
    })
  }
})

// 生成知识库摘要
router.post('/kb/:kbId/summary/generate', async (req, res) => {
  const { kbId } = req.params

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        files: {
          where: {
            extractedText: {
              not: null
            }
          },
          select: {
            id: true,
            name: true,
            extractedText: true,
            mimeType: true,
            tags: true
          }
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    // 合并所有文档内容
    const allContent = knowledgeBase.files
      .map(file => `${file.name}:\n${file.extractedText}`)
      .join('\n\n')
      .substring(0, 10000) // 限制长度

    const aiService = getAIService()

    // 生成摘要
    const summary = await aiService.generateSummary(allContent)
    
    // 提取关键词
    const keywords = await aiService.extractKeywords(allContent)

    // 分析主要话题
    const topics = knowledgeBase.files
      .slice(0, 5)
      .map(file => ({
        title: file.name,
        description: file.extractedText?.substring(0, 100) + '...'
      }))

    const result = {
      content: summary,
      keywords: keywords.slice(0, 10),
      mainTopics: topics,
      generatedAt: new Date(),
      documentCount: knowledgeBase.files.length
    }

    // 这里应该保存到数据库
    // await prisma.knowledgeBaseSummary.upsert({...})

    res.json({
      code: 200,
      message: '生成摘要成功',
      data: result
    })

  } catch (error) {
    console.error('生成摘要失败:', error)
    res.status(500).json({
      code: 500,
      message: '生成摘要失败',
      data: null
    })
  }
})

// ==================== 智能搜索接口 ====================

// 智能搜索
router.get('/kb/:kbId/search/smart', async (req, res) => {
  const { kbId } = req.params
  const { q } = req.query

  try {
    if (!q || q.trim().length === 0) {
      return res.json({
        code: 200,
        message: '搜索成功',
        data: []
      })
    }

    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        files: {
          select: {
            id: true,
            name: true,
            extractedText: true,
            mimeType: true,
            size: true,
            tags: true,
            createdAt: true,
            updatedAt: true
          }
        },
        folders: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    // 简单的关键词匹配搜索
    const query = q.toLowerCase()
    const results = []

    // 搜索文件
    knowledgeBase.files.forEach(file => {
      const nameMatch = file.name.toLowerCase().includes(query)
      const contentMatch = file.extractedText?.toLowerCase().includes(query)
      const tagMatch = file.tags?.some(tag => tag.toLowerCase().includes(query))

      if (nameMatch || contentMatch || tagMatch) {
        results.push({
          id: file.id,
          name: file.name,
          type: 'file',
          description: file.extractedText?.substring(0, 200),
          size: file.size,
          tags: file.tags,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        })
      }
    })

    // 搜索文件夹
    knowledgeBase.folders.forEach(folder => {
      if (folder.name.toLowerCase().includes(query)) {
        results.push({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          description: '文件夹',
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        })
      }
    })

    // 按更新时间排序
    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    res.json({
      code: 200,
      message: '搜索成功',
      data: results.slice(0, 20) // 最多返回20个结果
    })

  } catch (error) {
    console.error('智能搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '智能搜索失败',
      data: null
    })
  }
})

// ==================== 统计信息接口 ====================

// 获取知识库统计信息
router.get('/kb/:kbId/stats', async (req, res) => {
  const { kbId } = req.params

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id: kbId },
      include: {
        files: {
          select: {
            size: true,
            updatedAt: true
          }
        },
        folders: true
      }
    })

    if (!knowledgeBase) {
      return res.status(404).json({
        code: 404,
        message: '知识库不存在',
        data: null
      })
    }

    const totalSize = knowledgeBase.files.reduce((sum, file) => sum + (file.size || 0), 0)
    const lastUpdated = knowledgeBase.files.length > 0 
      ? Math.max(...knowledgeBase.files.map(file => new Date(file.updatedAt).getTime()))
      : new Date(knowledgeBase.updatedAt).getTime()

    const stats = {
      fileCount: knowledgeBase.files.length,
      folderCount: knowledgeBase.folders.length,
      totalSize,
      lastUpdated: new Date(lastUpdated)
    }

    res.json({
      code: 200,
      message: '获取统计信息成功',
      data: stats
    })

  } catch (error) {
    console.error('获取统计信息失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取统计信息失败',
      data: null
    })
  }
})

// 获取最近访问文件
router.get('/kb/:kbId/files/recent', async (req, res) => {
  const { kbId } = req.params

  try {
    const files = await prisma.file.findMany({
      where: { kbId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        updatedAt: true,
        createdAt: true
      }
    })

    res.json({
      code: 200,
      message: '获取最近文件成功',
      data: files
    })

  } catch (error) {
    console.error('获取最近文件失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取最近文件失败',
      data: null
    })
  }
})

// 获取热门文件
router.get('/kb/:kbId/files/popular', async (req, res) => {
  const { kbId } = req.params

  try {
    // 这里应该基于访问记录来获取热门文件
    // 暂时返回最近更新的文件
    const files = await prisma.file.findMany({
      where: { kbId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        mimeType: true,
        size: true,
        updatedAt: true,
        createdAt: true
      }
    })

    res.json({
      code: 200,
      message: '获取热门文件成功',
      data: files
    })

  } catch (error) {
    console.error('获取热门文件失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取热门文件失败',
      data: null
    })
  }
})

export default router
