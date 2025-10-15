/**
 * 搜索相关API
 * 提供全文搜索、语义搜索和混合搜索功能
 */

import express from 'express'
import { PrismaClient } from '@prisma/client'
import { getHybridSearchService } from '../services/hybridSearch.js'

const router = express.Router()
const prisma = new PrismaClient()

// ==================== 混合搜索接口 ====================

// 混合搜索
router.get('/kb/:kbId/search', async (req, res) => {
  const { kbId } = req.params
  const { 
    q: query, 
    type = 'hybrid', 
    limit = 20, 
    offset = 0,
    weights = '0.6,0.4' // fulltext,semantic
  } = req.query

  try {
    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        message: '搜索成功',
        data: {
          results: [],
          total: 0,
          query: query,
          searchType: type
        }
      })
    }

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

    // 解析权重
    const weightParts = weights.split(',')
    const searchWeights = {
      fulltext: parseFloat(weightParts[0]) || 0.6,
      semantic: parseFloat(weightParts[1]) || 0.4
    }

    // 执行搜索
    const hybridSearch = getHybridSearchService()
    const results = await hybridSearch.search(query, {
      kbId,
      searchType: type,
      limit: parseInt(limit),
      offset: parseInt(offset),
      weights: searchWeights,
      includeMetadata: true
    })

    res.json({
      code: 200,
      message: '搜索成功',
      data: {
        results,
        total: results.length,
        query,
        searchType: type,
        weights: searchWeights
      }
    })

  } catch (error) {
    console.error('混合搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '搜索失败',
      data: null
    })
  }
})

// 全文搜索
router.get('/kb/:kbId/search/fulltext', async (req, res) => {
  const { kbId } = req.params
  const { q: query, limit = 20, offset = 0 } = req.query

  try {
    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        message: '搜索成功',
        data: { results: [], total: 0 }
      })
    }

    const hybridSearch = getHybridSearchService()
    const results = await hybridSearch.search(query, {
      kbId,
      searchType: 'fulltext',
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      code: 200,
      message: '全文搜索成功',
      data: {
        results,
        total: results.length,
        query,
        searchType: 'fulltext'
      }
    })

  } catch (error) {
    console.error('全文搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '全文搜索失败',
      data: null
    })
  }
})

// 语义搜索
router.get('/kb/:kbId/search/semantic', async (req, res) => {
  const { kbId } = req.params
  const { q: query, limit = 20, offset = 0 } = req.query

  try {
    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        message: '搜索成功',
        data: { results: [], total: 0 }
      })
    }

    const hybridSearch = getHybridSearchService()
    const results = await hybridSearch.search(query, {
      kbId,
      searchType: 'semantic',
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      code: 200,
      message: '语义搜索成功',
      data: {
        results,
        total: results.length,
        query,
        searchType: 'semantic'
      }
    })

  } catch (error) {
    console.error('语义搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '语义搜索失败',
      data: null
    })
  }
})

// ==================== 搜索建议接口 ====================

// 获取搜索建议
router.get('/kb/:kbId/search/suggestions', async (req, res) => {
  const { kbId } = req.params
  const { q: query, limit = 10 } = req.query

  try {
    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        message: '获取建议成功',
        data: { suggestions: [] }
      })
    }

    const hybridSearch = getHybridSearchService()
    const suggestions = await hybridSearch.getSuggestions(query, kbId, parseInt(limit))

    res.json({
      code: 200,
      message: '获取搜索建议成功',
      data: {
        suggestions,
        query
      }
    })

  } catch (error) {
    console.error('获取搜索建议失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取搜索建议失败',
      data: null
    })
  }
})

// ==================== 搜索统计接口 ====================

// 获取搜索统计
router.get('/kb/:kbId/search/stats', async (req, res) => {
  const { kbId } = req.params

  try {
    const hybridSearch = getHybridSearchService()
    const stats = await hybridSearch.getSearchStats()

    // 获取知识库特定统计
    const kbStats = await prisma.file.count({
      where: {
        kbId,
        extractedText: {
          not: null
        }
      }
    })

    res.json({
      code: 200,
      message: '获取搜索统计成功',
      data: {
        ...stats,
        kbIndexedFiles: kbStats
      }
    })

  } catch (error) {
    console.error('获取搜索统计失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取搜索统计失败',
      data: null
    })
  }
})

// ==================== 搜索索引管理接口 ====================

// 重建搜索索引
router.post('/kb/:kbId/search/rebuild', async (req, res) => {
  const { kbId } = req.params

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

    // 获取知识库所有文件
    const files = await prisma.file.findMany({
      where: {
        kbId,
        extractedText: {
          not: null
        }
      }
    })

    // 重建索引
    const hybridSearch = getHybridSearchService()
    await hybridSearch.initialize()

    // 重新添加所有文件
    for (const file of files) {
      await hybridSearch.addFile(file)
    }

    res.json({
      code: 200,
      message: '搜索索引重建成功',
      data: {
        indexedFiles: files.length,
        kbId
      }
    })

  } catch (error) {
    console.error('重建搜索索引失败:', error)
    res.status(500).json({
      code: 500,
      message: '重建搜索索引失败',
      data: null
    })
  }
})

// 更新文件搜索索引
router.post('/kb/:kbId/files/:fileId/index', async (req, res) => {
  const { kbId, fileId } = req.params

  try {
    // 获取文件信息
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        kbId
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        data: null
      })
    }

    // 更新搜索索引
    const hybridSearch = getHybridSearchService()
    await hybridSearch.updateFile(file)

    res.json({
      code: 200,
      message: '文件搜索索引更新成功',
      data: {
        fileId,
        fileName: file.name
      }
    })

  } catch (error) {
    console.error('更新文件搜索索引失败:', error)
    res.status(500).json({
      code: 500,
      message: '更新文件搜索索引失败',
      data: null
    })
  }
})

// 删除文件搜索索引
router.delete('/kb/:kbId/files/:fileId/index', async (req, res) => {
  const { kbId, fileId } = req.params

  try {
    // 验证文件是否存在
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        kbId
      }
    })

    if (!file) {
      return res.status(404).json({
        code: 404,
        message: '文件不存在',
        data: null
      })
    }

    // 删除搜索索引
    const hybridSearch = getHybridSearchService()
    await hybridSearch.removeFile(fileId)

    res.json({
      code: 200,
      message: '文件搜索索引删除成功',
      data: {
        fileId,
        fileName: file.name
      }
    })

  } catch (error) {
    console.error('删除文件搜索索引失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除文件搜索索引失败',
      data: null
    })
  }
})

// ==================== 高级搜索接口 ====================

// 高级搜索（支持多条件）
router.post('/kb/:kbId/search/advanced', async (req, res) => {
  const { kbId } = req.params
  const {
    query,
    fileTypes = [],
    dateRange = {},
    tags = [],
    folders = [],
    searchType = 'hybrid',
    limit = 20,
    offset = 0
  } = req.body

  try {
    if (!query || query.trim().length === 0) {
      return res.json({
        code: 200,
        message: '搜索成功',
        data: { results: [], total: 0 }
      })
    }

    // 构建过滤条件
    const whereClause = {
      kbId,
      extractedText: {
        not: null
      }
    }

    // 文件类型过滤
    if (fileTypes.length > 0) {
      whereClause.fileFormat = {
        in: fileTypes
      }
    }

    // 日期范围过滤
    if (dateRange.start || dateRange.end) {
      whereClause.createdAt = {}
      if (dateRange.start) {
        whereClause.createdAt.gte = new Date(dateRange.start)
      }
      if (dateRange.end) {
        whereClause.createdAt.lte = new Date(dateRange.end)
      }
    }

    // 标签过滤
    if (tags.length > 0) {
      whereClause.tags = {
        contains: JSON.stringify(tags)
      }
    }

    // 文件夹过滤
    if (folders.length > 0) {
      whereClause.folderId = {
        in: folders
      }
    }

    // 获取符合条件的文件
    const files = await prisma.file.findMany({
      where: whereClause,
      include: {
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // 执行搜索
    const hybridSearch = getHybridSearchService()
    const results = await hybridSearch.search(query, {
      kbId,
      searchType,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeMetadata: true
    })

    // 过滤结果（只返回符合条件的文件）
    const filteredResults = results.filter(result => 
      files.some(file => file.id === result.file.id)
    )

    res.json({
      code: 200,
      message: '高级搜索成功',
      data: {
        results: filteredResults,
        total: filteredResults.length,
        query,
        filters: {
          fileTypes,
          dateRange,
          tags,
          folders
        }
      }
    })

  } catch (error) {
    console.error('高级搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '高级搜索失败',
      data: null
    })
  }
})

export default router
