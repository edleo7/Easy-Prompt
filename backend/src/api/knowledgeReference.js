/**
 * 知识库引用相关API
 * 处理Prompt中的知识库引用功能
 */

import express from 'express'
import { getKnowledgeReferenceService } from '../services/knowledgeReference.js'

const router = express.Router()

// ==================== 引用解析接口 ====================

// 解析Prompt中的引用
router.post('/prompt/parse-references', async (req, res) => {
  const { content, options = {} } = req.body

  try {
    if (!content) {
      return res.status(400).json({
        code: 400,
        message: '缺少Prompt内容',
        data: null
      })
    }

    const referenceService = getKnowledgeReferenceService()
    const result = await referenceService.resolveReferences(content, options)

    res.json({
      code: 200,
      message: '引用解析成功',
      data: result
    })

  } catch (error) {
    console.error('解析引用失败:', error)
    res.status(500).json({
      code: 500,
      message: '解析引用失败',
      data: null
    })
  }
})

// 验证引用语法
router.post('/prompt/validate-references', async (req, res) => {
  const { content } = req.body

  try {
    if (!content) {
      return res.status(400).json({
        code: 400,
        message: '缺少Prompt内容',
        data: null
      })
    }

    const referenceService = getKnowledgeReferenceService()
    const references = referenceService.validateReferenceSyntax(content)

    res.json({
      code: 200,
      message: '引用验证成功',
      data: {
        references,
        totalCount: references.length,
        validCount: references.filter(ref => ref.valid).length
      }
    })

  } catch (error) {
    console.error('验证引用失败:', error)
    res.status(500).json({
      code: 500,
      message: '验证引用失败',
      data: null
    })
  }
})

// ==================== 引用预览接口 ====================

// 获取引用预览
router.get('/kb/:kbId/files/:fileId/preview', async (req, res) => {
  const { kbId, fileId } = req.params
  const { length = 200 } = req.query

  try {
    const referenceService = getKnowledgeReferenceService()
    const result = await referenceService.getReferencePreview(kbId, fileId, parseInt(length))

    if (result.success) {
      res.json({
        code: 200,
        message: '获取预览成功',
        data: result
      })
    } else {
      res.status(404).json({
        code: 404,
        message: result.error,
        data: null
      })
    }

  } catch (error) {
    console.error('获取引用预览失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取引用预览失败',
      data: null
    })
  }
})

// ==================== 可引用文件接口 ====================

// 获取知识库中可引用的文件列表
router.get('/kb/:kbId/referenceable-files', async (req, res) => {
  const { kbId } = req.params
  const { 
    limit = 50, 
    offset = 0, 
    fileTypes, 
    search 
  } = req.query

  try {
    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    }

    if (fileTypes) {
      options.fileTypes = fileTypes.split(',')
    }

    if (search) {
      options.searchQuery = search
    }

    const referenceService = getKnowledgeReferenceService()
    const result = await referenceService.getReferenceableFiles(kbId, options)

    if (result.success) {
      res.json({
        code: 200,
        message: '获取可引用文件成功',
        data: {
          files: result.files,
          total: result.files.length,
          hasMore: result.files.length === parseInt(limit)
        }
      })
    } else {
      res.status(500).json({
        code: 500,
        message: result.error,
        data: null
      })
    }

  } catch (error) {
    console.error('获取可引用文件失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取可引用文件失败',
      data: null
    })
  }
})

// ==================== 引用工具接口 ====================

// 生成引用语法
router.post('/reference/generate-syntax', async (req, res) => {
  const { kbId, fileId } = req.body

  try {
    if (!kbId || !fileId) {
      return res.status(400).json({
        code: 400,
        message: '缺少知识库ID或文件ID',
        data: null
      })
    }

    const referenceService = getKnowledgeReferenceService()
    const syntax = referenceService.generateReferenceSyntax(kbId, fileId)

    res.json({
      code: 200,
      message: '生成引用语法成功',
      data: {
        syntax,
        kbId,
        fileId
      }
    })

  } catch (error) {
    console.error('生成引用语法失败:', error)
    res.status(500).json({
      code: 500,
      message: '生成引用语法失败',
      data: null
    })
  }
})

// 批量解析引用
router.post('/reference/batch-parse', async (req, res) => {
  const { references } = req.body

  try {
    if (!references || !Array.isArray(references)) {
      return res.status(400).json({
        code: 400,
        message: '缺少引用列表',
        data: null
      })
    }

    const referenceService = getKnowledgeReferenceService()
    const results = []

    for (const ref of references) {
      const { kbId, fileId, options = {} } = ref
      const result = await referenceService.parseReference(kbId, fileId, options)
      results.push({
        kbId,
        fileId,
        ...result
      })
    }

    res.json({
      code: 200,
      message: '批量解析引用成功',
      data: {
        results,
        totalCount: results.length,
        successCount: results.filter(r => r.success).length
      }
    })

  } catch (error) {
    console.error('批量解析引用失败:', error)
    res.status(500).json({
      code: 500,
      message: '批量解析引用失败',
      data: null
    })
  }
})

// ==================== 智能推荐接口 ====================

// 根据Prompt内容推荐相关知识
router.post('/prompt/recommend-knowledge', async (req, res) => {
  const { content, kbId, limit = 5 } = req.body

  try {
    if (!content) {
      return res.status(400).json({
        code: 400,
        message: '缺少Prompt内容',
        data: null
      })
    }

    // 这里可以实现基于AI的智能推荐逻辑
    // 暂时返回空结果
    res.json({
      code: 200,
      message: '推荐知识成功',
      data: {
        recommendations: [],
        totalCount: 0
      }
    })

  } catch (error) {
    console.error('推荐知识失败:', error)
    res.status(500).json({
      code: 500,
      message: '推荐知识失败',
      data: null
    })
  }
})

// ==================== 引用统计接口 ====================

// 获取引用统计信息
router.get('/kb/:kbId/reference-stats', async (req, res) => {
  const { kbId } = req.params

  try {
    // 这里可以实现引用统计逻辑
    // 暂时返回模拟数据
    res.json({
      code: 200,
      message: '获取引用统计成功',
      data: {
        totalReferences: 0,
        mostReferencedFiles: [],
        referenceTrends: []
      }
    })

  } catch (error) {
    console.error('获取引用统计失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取引用统计失败',
      data: null
    })
  }
})

export default router
