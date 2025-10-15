/**
 * 语义搜索服务
 * 基于AI模型实现语义理解和智能搜索
 */

import { PrismaClient } from '@prisma/client'
import { getAIService } from './aiService.js'

const prisma = new PrismaClient()

class SemanticSearchService {
  constructor() {
    this.aiService = getAIService()
  }

  /**
   * 语义搜索
   */
  async search(query, options = {}) {
    const {
      kbId = null,
      limit = 20,
      offset = 0,
      searchType = 'semantic' // semantic, hybrid
    } = options

    try {
      // 1. 理解查询意图
      const intent = await this.analyzeQueryIntent(query)
      
      // 2. 获取候选文档
      const candidates = await this.getCandidateDocuments(kbId, intent)
      
      // 3. 语义匹配和排序
      const results = await this.semanticMatching(query, candidates, limit, offset)
      
      return results
    } catch (error) {
      console.error('语义搜索失败:', error)
      return []
    }
  }

  /**
   * 分析查询意图
   */
  async analyzeQueryIntent(query) {
    try {
      const prompt = `分析以下搜索查询的意图，返回JSON格式：
{
  "intent": "查找/总结/比较/解释",
  "keywords": ["关键词1", "关键词2"],
  "entity": "实体名称",
  "timeframe": "时间范围",
  "fileType": "文件类型偏好"
}

查询: "${query}"`

      const response = await this.aiService.chat([
        { role: 'user', content: prompt }
      ], {
        maxTokens: 200,
        temperature: 0.3
      })

      // 解析AI返回的JSON
      try {
        const intent = JSON.parse(response.reply)
        return intent
      } catch (parseError) {
        // 如果解析失败，返回默认意图
        return {
          intent: '查找',
          keywords: query.split(/\s+/),
          entity: null,
          timeframe: null,
          fileType: null
        }
      }
    } catch (error) {
      console.error('分析查询意图失败:', error)
      return {
        intent: '查找',
        keywords: query.split(/\s+/),
        entity: null,
        timeframe: null,
        fileType: null
      }
    }
  }

  /**
   * 获取候选文档
   */
  async getCandidateDocuments(kbId, intent) {
    try {
      const whereClause = {
        extractedText: {
          not: null
        }
      }

      if (kbId) {
        whereClause.kbId = kbId
      }

      // 根据文件类型偏好过滤
      if (intent.fileType) {
        const typeMap = {
          '文档': ['pdf', 'docx', 'doc', 'txt', 'md'],
          '表格': ['xlsx', 'xls', 'csv'],
          '演示': ['pptx', 'ppt'],
          '图片': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
          '音频': ['mp3', 'wav', 'm4a', 'aac'],
          '视频': ['mp4', 'mov', 'avi', 'mkv']
        }
        
        if (typeMap[intent.fileType]) {
          whereClause.fileFormat = {
            in: typeMap[intent.fileType]
          }
        }
      }

      // 根据时间范围过滤
      if (intent.timeframe) {
        const now = new Date()
        let startDate = null
        
        switch (intent.timeframe) {
          case '今天':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case '本周':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '本月':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case '今年':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
        }
        
        if (startDate) {
          whereClause.createdAt = {
            gte: startDate
          }
        }
      }

      const files = await prisma.file.findMany({
        where: whereClause,
        select: {
          id: true,
          kbId: true,
          name: true,
          extractedText: true,
          tags: true,
          fileFormat: true,
          createdAt: true,
          updatedAt: true,
          folder: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: 100 // 限制候选文档数量
      })

      return files
    } catch (error) {
      console.error('获取候选文档失败:', error)
      return []
    }
  }

  /**
   * 语义匹配和排序
   */
  async semanticMatching(query, candidates, limit, offset) {
    try {
      if (candidates.length === 0) {
        return []
      }

      // 构建匹配提示
      const documents = candidates.map((doc, index) => 
        `文档${index + 1}: ${doc.name}\n内容: ${doc.extractedText?.substring(0, 500)}...`
      ).join('\n\n')

      const prompt = `根据查询"${query}"，对以下文档进行语义匹配评分（0-100分），返回JSON格式：
{
  "scores": [
    {"index": 0, "score": 85, "reason": "匹配原因"},
    {"index": 1, "score": 72, "reason": "匹配原因"}
  ]
}

文档列表：
${documents}`

      const response = await this.aiService.chat([
        { role: 'user', content: prompt }
      ], {
        maxTokens: 1000,
        temperature: 0.3
      })

      // 解析评分结果
      let scores = []
      try {
        const result = JSON.parse(response.reply)
        scores = result.scores || []
      } catch (parseError) {
        // 如果解析失败，使用简单的关键词匹配
        scores = this.fallbackKeywordMatching(query, candidates)
      }

      // 按评分排序
      scores.sort((a, b) => b.score - a.score)

      // 应用分页
      const paginatedScores = scores.slice(offset, offset + limit)

      // 构建结果
      const results = paginatedScores.map(scoreItem => {
        const candidate = candidates[scoreItem.index]
        return {
          file: candidate,
          score: scoreItem.score / 100, // 转换为0-1范围
          reason: scoreItem.reason,
          snippet: this.generateSemanticSnippet(candidate.extractedText, query),
          highlights: this.generateSemanticHighlights(candidate.extractedText, query)
        }
      })

      return results
    } catch (error) {
      console.error('语义匹配失败:', error)
      return []
    }
  }

  /**
   * 关键词匹配降级方案
   */
  fallbackKeywordMatching(query, candidates) {
    const queryWords = query.toLowerCase().split(/\s+/)
    
    return candidates.map((candidate, index) => {
      const content = (candidate.extractedText || '').toLowerCase()
      const name = candidate.name.toLowerCase()
      
      let score = 0
      
      // 文件名匹配权重更高
      for (const word of queryWords) {
        if (name.includes(word)) {
          score += 30
        }
        if (content.includes(word)) {
          score += 10
        }
      }
      
      return {
        index,
        score: Math.min(score, 100),
        reason: '关键词匹配'
      }
    })
  }

  /**
   * 生成语义摘要
   */
  generateSemanticSnippet(content, query, maxLength = 200) {
    if (!content) return ''
    
    // 简单的摘要生成，实际可以调用AI生成更智能的摘要
    const sentences = content.split(/[。！？.!?]/)
    const queryWords = query.toLowerCase().split(/\s+/)
    
    // 找到包含最多查询词的句子
    let bestSentence = ''
    let bestScore = 0
    
    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase()
      let score = 0
      for (const word of queryWords) {
        if (sentenceLower.includes(word)) {
          score += 1
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestSentence = sentence
      }
    }
    
    if (bestSentence) {
      return bestSentence.length > maxLength 
        ? bestSentence.substring(0, maxLength) + '...'
        : bestSentence
    }
    
    return content.substring(0, maxLength) + '...'
  }

  /**
   * 生成语义高亮
   */
  generateSemanticHighlights(content, query) {
    if (!content) return []
    
    const queryWords = query.toLowerCase().split(/\s+/)
    const highlights = []
    
    for (const word of queryWords) {
      if (word.length < 2) continue
      
      const regex = new RegExp(`(${word})`, 'gi')
      let match
      while ((match = regex.exec(content)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          type: 'semantic'
        })
      }
    }
    
    return highlights
  }

  /**
   * 智能搜索建议
   */
  async getSmartSuggestions(query, kbId = null) {
    try {
      const intent = await this.analyzeQueryIntent(query)
      
      // 基于意图生成建议
      const suggestions = []
      
      if (intent.intent === '查找') {
        suggestions.push(`查找关于"${intent.entity || '相关内容'}"的文档`)
        suggestions.push(`搜索"${query}"相关的最新文档`)
      } else if (intent.intent === '总结') {
        suggestions.push(`总结知识库的主要内容`)
        suggestions.push(`生成"${query}"的摘要`)
      } else if (intent.intent === '比较') {
        suggestions.push(`比较不同文档中的"${query}"`)
        suggestions.push(`分析"${query}"的差异`)
      }
      
      // 添加文件类型建议
      if (intent.fileType) {
        suggestions.push(`查找${intent.fileType}类型的文件`)
      }
      
      return suggestions.slice(0, 5)
    } catch (error) {
      console.error('获取智能建议失败:', error)
      return []
    }
  }

  /**
   * 搜索历史分析
   */
  async analyzeSearchHistory(userId, limit = 10) {
    try {
      // 这里可以存储和分析用户的搜索历史
      // 暂时返回空数组
      return []
    } catch (error) {
      console.error('分析搜索历史失败:', error)
      return []
    }
  }
}

// 创建单例实例
let semanticSearchServiceInstance = null

export function getSemanticSearchService() {
  if (!semanticSearchServiceInstance) {
    semanticSearchServiceInstance = new SemanticSearchService()
  }
  return semanticSearchServiceInstance
}

export default SemanticSearchService
