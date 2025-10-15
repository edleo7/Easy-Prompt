/**
 * 知识库引用解析服务
 * 处理Prompt中的知识库引用语法
 */

import { PrismaClient } from '@prisma/client'
import { getAIService } from './aiService.js'

const prisma = new PrismaClient()

class KnowledgeReferenceService {
  constructor() {
    this.aiService = getAIService()
    this.referencePattern = /\{\{kb:([^:]+):([^}]+)\}\}/g
  }

  /**
   * 解析Prompt中的知识库引用
   */
  async parseReferences(promptContent) {
    const references = []
    let match

    // 查找所有引用语法
    while ((match = this.referencePattern.exec(promptContent)) !== null) {
      const [fullMatch, kbId, fileId] = match
      references.push({
        fullMatch,
        kbId,
        fileId,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length
      })
    }

    return references
  }

  /**
   * 解析单个引用
   */
  async parseReference(kbId, fileId, options = {}) {
    const {
      includeContent = true,
      maxLength = 2000,
      includeSummary = false,
      includeMetadata = true
    } = options

    try {
      // 获取文件信息
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          kbId: kbId
        },
        include: {
          folder: {
            select: {
              id: true,
              name: true
            }
          },
          kb: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      if (!file) {
        return {
          success: false,
          error: '文件不存在',
          content: `[引用错误: 文件 ${fileId} 不存在]`
        }
      }

      const result = {
        success: true,
        fileId: file.id,
        fileName: file.name,
        kbId: file.kbId,
        kbName: file.kb.name,
        content: '',
        metadata: {},
        summary: ''
      }

      // 包含元数据
      if (includeMetadata) {
        result.metadata = {
          fileFormat: file.fileFormat,
          fileSize: file.size,
          lastModified: file.updatedAt,
          folder: file.folder?.name || '根目录',
          tags: file.tags ? JSON.parse(file.tags) : []
        }
      }

      // 包含内容
      if (includeContent) {
        let content = file.extractedText || file.content || ''
        
        // 限制内容长度
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...'
        }

        result.content = content
      }

      // 包含摘要
      if (includeSummary && file.extractedText) {
        try {
          const summary = await this.aiService.generateSummary(
            file.extractedText.substring(0, 1000)
          )
          result.summary = summary
        } catch (error) {
          console.error('生成摘要失败:', error)
          result.summary = '摘要生成失败'
        }
      }

      return result
    } catch (error) {
      console.error('解析引用失败:', error)
      return {
        success: false,
        error: error.message,
        content: `[引用错误: ${error.message}]`
      }
    }
  }

  /**
   * 解析所有引用并替换内容
   */
  async resolveReferences(promptContent, options = {}) {
    const {
      replaceMode = 'content', // 'content', 'summary', 'metadata', 'all'
      maxLength = 2000,
      includeHeader = true
    } = options

    try {
      const references = await this.parseReferences(promptContent)
      
      if (references.length === 0) {
        return {
          success: true,
          content: promptContent,
          references: []
        }
      }

      let resolvedContent = promptContent
      const resolvedReferences = []

      // 从后往前替换，避免索引偏移
      for (let i = references.length - 1; i >= 0; i--) {
        const ref = references[i]
        const parsedRef = await this.parseReference(ref.kbId, ref.fileId, {
          includeContent: replaceMode === 'content' || replaceMode === 'all',
          includeSummary: replaceMode === 'summary' || replaceMode === 'all',
          includeMetadata: replaceMode === 'metadata' || replaceMode === 'all',
          maxLength
        })

        resolvedReferences.push(parsedRef)

        if (parsedRef.success) {
          let replacement = ''

          if (includeHeader) {
            replacement += `\n\n--- 引用: ${parsedRef.fileName} (来自知识库: ${parsedRef.kbName}) ---\n`
          }

          switch (replaceMode) {
            case 'content':
              replacement += parsedRef.content
              break
            case 'summary':
              replacement += parsedRef.summary || parsedRef.content
              break
            case 'metadata':
              replacement += `文件: ${parsedRef.fileName}\n`
              replacement += `知识库: ${parsedRef.kbName}\n`
              replacement += `类型: ${parsedRef.metadata.fileFormat}\n`
              replacement += `大小: ${parsedRef.metadata.fileSize} 字节\n`
              replacement += `修改时间: ${parsedRef.metadata.lastModified}\n`
              if (parsedRef.metadata.tags.length > 0) {
                replacement += `标签: ${parsedRef.metadata.tags.join(', ')}\n`
              }
              break
            case 'all':
              replacement += `文件: ${parsedRef.fileName}\n`
              replacement += `知识库: ${parsedRef.kbName}\n`
              if (parsedRef.summary) {
                replacement += `摘要: ${parsedRef.summary}\n`
              }
              replacement += `内容: ${parsedRef.content}\n`
              break
          }

          if (includeHeader) {
            replacement += '\n--- 引用结束 ---\n'
          }

          // 替换引用语法
          resolvedContent = 
            resolvedContent.substring(0, ref.startIndex) +
            replacement +
            resolvedContent.substring(ref.endIndex)
        } else {
          // 替换为错误信息
          const errorReplacement = `[引用错误: ${parsedRef.error}]`
          resolvedContent = 
            resolvedContent.substring(0, ref.startIndex) +
            errorReplacement +
            resolvedContent.substring(ref.endIndex)
        }
      }

      return {
        success: true,
        content: resolvedContent,
        references: resolvedReferences
      }
    } catch (error) {
      console.error('解析引用失败:', error)
      return {
        success: false,
        error: error.message,
        content: promptContent,
        references: []
      }
    }
  }

  /**
   * 获取引用的预览内容
   */
  async getReferencePreview(kbId, fileId, previewLength = 200) {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          kbId: kbId
        },
        select: {
          id: true,
          name: true,
          extractedText: true,
          content: true,
          fileFormat: true,
          size: true,
          updatedAt: true
        }
      })

      if (!file) {
        return {
          success: false,
          error: '文件不存在'
        }
      }

      const content = file.extractedText || file.content || ''
      const preview = content.length > previewLength 
        ? content.substring(0, previewLength) + '...'
        : content

      return {
        success: true,
        fileName: file.name,
        fileFormat: file.fileFormat,
        fileSize: file.size,
        lastModified: file.updatedAt,
        preview: preview,
        fullLength: content.length
      }
    } catch (error) {
      console.error('获取引用预览失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 验证引用语法
   */
  validateReferenceSyntax(promptContent) {
    const references = []
    let match

    while ((match = this.referencePattern.exec(promptContent)) !== null) {
      const [fullMatch, kbId, fileId] = match
      references.push({
        fullMatch,
        kbId,
        fileId,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        valid: this.isValidReference(kbId, fileId)
      })
    }

    return references
  }

  /**
   * 检查引用是否有效
   */
  isValidReference(kbId, fileId) {
    // 基本格式验证
    if (!kbId || !fileId) {
      return false
    }

    // 可以添加更多验证逻辑
    return true
  }

  /**
   * 生成引用语法
   */
  generateReferenceSyntax(kbId, fileId) {
    return `{{kb:${kbId}:${fileId}}}`
  }

  /**
   * 获取知识库中可引用的文件列表
   */
  async getReferenceableFiles(kbId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      fileTypes = [],
      searchQuery = ''
    } = options

    try {
      const whereClause = {
        kbId: kbId,
        OR: [
          { extractedText: { not: null } },
          { content: { not: null } }
        ]
      }

      // 文件类型过滤
      if (fileTypes.length > 0) {
        whereClause.fileFormat = {
          in: fileTypes
        }
      }

      // 搜索查询
      if (searchQuery) {
        whereClause.name = {
          contains: searchQuery
        }
      }

      const files = await prisma.file.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          fileFormat: true,
          size: true,
          updatedAt: true,
          extractedText: true,
          content: true
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: limit,
        skip: offset
      })

      return {
        success: true,
        files: files.map(file => ({
          id: file.id,
          name: file.name,
          fileFormat: file.fileFormat,
          fileSize: file.size,
          lastModified: file.updatedAt,
          hasContent: !!(file.extractedText || file.content),
          contentLength: (file.extractedText || file.content || '').length
        }))
      }
    } catch (error) {
      console.error('获取可引用文件失败:', error)
      return {
        success: false,
        error: error.message,
        files: []
      }
    }
  }
}

// 创建单例实例
let knowledgeReferenceServiceInstance = null

export function getKnowledgeReferenceService() {
  if (!knowledgeReferenceServiceInstance) {
    knowledgeReferenceServiceInstance = new KnowledgeReferenceService()
  }
  return knowledgeReferenceServiceInstance
}

export default KnowledgeReferenceService
