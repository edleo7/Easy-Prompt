/**
 * 混合搜索服务
 * 结合全文搜索和语义搜索，提供最优的搜索结果
 */

import { getFullTextSearchService } from './fullTextSearch.js'
import { getSemanticSearchService } from './semanticSearch.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class HybridSearchService {
  constructor() {
    this.fullTextSearch = getFullTextSearchService()
    this.semanticSearch = getSemanticSearchService()
  }

  /**
   * 混合搜索
   */
  async search(query, options = {}) {
    const {
      kbId = null,
      limit = 20,
      offset = 0,
      searchType = 'hybrid', // hybrid, fulltext, semantic
      weights = {
        fulltext: 0.6,
        semantic: 0.4
      }
    } = options

    try {
      let results = []

      if (searchType === 'fulltext') {
        // 仅全文搜索
        results = await this.fullTextSearch.search(query, { kbId, limit, offset })
      } else if (searchType === 'semantic') {
        // 仅语义搜索
        results = await this.semanticSearch.search(query, { kbId, limit, offset })
      } else {
        // 混合搜索
        results = await this.performHybridSearch(query, { kbId, limit, offset, weights })
      }

      // 后处理结果
      results = await this.postProcessResults(results, query, options)

      return results
    } catch (error) {
      console.error('混合搜索失败:', error)
      return []
    }
  }

  /**
   * 执行混合搜索
   */
  async performHybridSearch(query, options) {
    const { kbId, limit, offset, weights } = options

    try {
      // 并行执行全文搜索和语义搜索
      const [fullTextResults, semanticResults] = await Promise.all([
        this.fullTextSearch.search(query, { kbId, limit: limit * 2, offset: 0 }),
        this.semanticSearch.search(query, { kbId, limit: limit * 2, offset: 0 })
      ])

      // 合并和去重结果
      const mergedResults = this.mergeSearchResults(fullTextResults, semanticResults, weights)

      // 重新排序
      const sortedResults = this.rerankResults(mergedResults, query)

      // 应用分页
      return sortedResults.slice(offset, offset + limit)
    } catch (error) {
      console.error('混合搜索执行失败:', error)
      return []
    }
  }

  /**
   * 合并搜索结果
   */
  mergeSearchResults(fullTextResults, semanticResults, weights) {
    const resultMap = new Map()

    // 处理全文搜索结果
    fullTextResults.forEach(result => {
      const fileId = result.file.id
      resultMap.set(fileId, {
        file: result.file,
        fullTextScore: result.score,
        semanticScore: 0,
        snippet: result.snippet,
        highlights: result.highlights || [],
        sources: ['fulltext']
      })
    })

    // 处理语义搜索结果
    semanticResults.forEach(result => {
      const fileId = result.file.id
      if (resultMap.has(fileId)) {
        // 合并现有结果
        const existing = resultMap.get(fileId)
        existing.semanticScore = result.score
        existing.sources.push('semantic')
        
        // 合并摘要（选择更长的）
        if (result.snippet && result.snippet.length > existing.snippet.length) {
          existing.snippet = result.snippet
        }
        
        // 合并高亮
        existing.highlights = [...existing.highlights, ...(result.highlights || [])]
      } else {
        // 添加新结果
        resultMap.set(fileId, {
          file: result.file,
          fullTextScore: 0,
          semanticScore: result.score,
          snippet: result.snippet,
          highlights: result.highlights || [],
          sources: ['semantic']
        })
      }
    })

    // 计算综合分数
    const mergedResults = Array.from(resultMap.values()).map(result => {
      const hybridScore = 
        result.fullTextScore * weights.fulltext + 
        result.semanticScore * weights.semantic

      return {
        ...result,
        hybridScore,
        // 保留原始分数用于调试
        scores: {
          fulltext: result.fullTextScore,
          semantic: result.semanticScore,
          hybrid: hybridScore
        }
      }
    })

    return mergedResults
  }

  /**
   * 重新排序结果
   */
  rerankResults(results, query) {
    return results.sort((a, b) => {
      // 主要按混合分数排序
      if (b.hybridScore !== a.hybridScore) {
        return b.hybridScore - a.hybridScore
      }

      // 次要按文件类型偏好排序
      const typePreference = this.getTypePreference(query)
      const aTypeScore = this.getTypeScore(a.file.fileFormat, typePreference)
      const bTypeScore = this.getTypeScore(b.file.fileFormat, typePreference)
      
      if (bTypeScore !== aTypeScore) {
        return bTypeScore - aTypeScore
      }

      // 最后按更新时间排序
      return new Date(b.file.updatedAt) - new Date(a.file.updatedAt)
    })
  }

  /**
   * 获取类型偏好
   */
  getTypePreference(query) {
    const queryLower = query.toLowerCase()
    
    if (queryLower.includes('表格') || queryLower.includes('excel') || queryLower.includes('数据')) {
      return ['xlsx', 'xls', 'csv']
    } else if (queryLower.includes('演示') || queryLower.includes('ppt') || queryLower.includes('幻灯片')) {
      return ['pptx', 'ppt']
    } else if (queryLower.includes('图片') || queryLower.includes('照片') || queryLower.includes('图像')) {
      return ['jpg', 'jpeg', 'png', 'gif', 'webp']
    } else if (queryLower.includes('视频') || queryLower.includes('录像')) {
      return ['mp4', 'mov', 'avi', 'mkv']
    } else if (queryLower.includes('音频') || queryLower.includes('声音') || queryLower.includes('录音')) {
      return ['mp3', 'wav', 'm4a', 'aac']
    }
    
    return ['pdf', 'docx', 'doc', 'txt', 'md'] // 默认偏好文档
  }

  /**
   * 获取类型分数
   */
  getTypeScore(fileFormat, preferredTypes) {
    if (!fileFormat) return 0
    return preferredTypes.includes(fileFormat.toLowerCase()) ? 1 : 0
  }

  /**
   * 后处理结果
   */
  async postProcessResults(results, query, options) {
    const { includeMetadata = true, includeRelated = false } = options

    return results.map(result => {
      const processedResult = {
        file: result.file,
        score: result.hybridScore,
        snippet: result.snippet,
        highlights: this.deduplicateHighlights(result.highlights),
        sources: result.sources,
        scores: result.scores
      }

      // 添加元数据
      if (includeMetadata) {
        processedResult.metadata = {
          fileSize: result.file.size,
          fileFormat: result.file.fileFormat,
          lastModified: result.file.updatedAt,
          folder: result.file.folder?.name || '根目录'
        }
      }

      // 添加相关文档（可选）
      if (includeRelated) {
        // 这里可以实现相关文档推荐逻辑
        processedResult.related = []
      }

      return processedResult
    })
  }

  /**
   * 去重高亮标记
   */
  deduplicateHighlights(highlights) {
    if (!highlights || highlights.length === 0) return []

    // 按位置排序
    highlights.sort((a, b) => a.start - b.start)

    const deduplicated = []
    let lastEnd = -1

    for (const highlight of highlights) {
      if (highlight.start >= lastEnd) {
        deduplicated.push(highlight)
        lastEnd = highlight.end
      } else if (highlight.end > lastEnd) {
        // 扩展最后一个高亮
        deduplicated[deduplicated.length - 1].end = highlight.end
        lastEnd = highlight.end
      }
    }

    return deduplicated
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query, kbId = null, limit = 10) {
    try {
      // 获取全文搜索建议
      const fullTextSuggestions = await this.fullTextSearch.getSuggestions(query, limit)
      
      // 获取语义搜索建议
      const semanticSuggestions = await this.semanticSearch.getSmartSuggestions(query, kbId)
      
      // 合并建议
      const allSuggestions = [...fullTextSuggestions, ...semanticSuggestions]
      
      // 去重和排序
      const uniqueSuggestions = [...new Set(allSuggestions)]
      
      return uniqueSuggestions.slice(0, limit)
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      return []
    }
  }

  /**
   * 获取搜索统计
   */
  async getSearchStats() {
    try {
      const [fullTextStats, semanticStats] = await Promise.all([
        this.fullTextSearch.getSearchStats(),
        { indexedFiles: 0, lastUpdated: new Date() } // 语义搜索暂时没有统计
      ])

      return {
        fullText: fullTextStats,
        semantic: semanticStats,
        totalIndexedFiles: fullTextStats.indexedFiles
      }
    } catch (error) {
      console.error('获取搜索统计失败:', error)
      return {
        fullText: { indexedFiles: 0, lastUpdated: new Date() },
        semantic: { indexedFiles: 0, lastUpdated: new Date() },
        totalIndexedFiles: 0
      }
    }
  }

  /**
   * 初始化搜索服务
   */
  async initialize() {
    try {
      await this.fullTextSearch.initialize()
      console.log('✅ 混合搜索服务初始化完成')
    } catch (error) {
      console.error('混合搜索服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 添加文件到搜索索引
   */
  async addFile(file) {
    try {
      await this.fullTextSearch.addFile(file)
    } catch (error) {
      console.error('添加文件到搜索索引失败:', error)
    }
  }

  /**
   * 更新文件搜索索引
   */
  async updateFile(file) {
    try {
      await this.fullTextSearch.updateFile(file)
    } catch (error) {
      console.error('更新文件搜索索引失败:', error)
    }
  }

  /**
   * 删除文件搜索索引
   */
  async removeFile(fileId) {
    try {
      await this.fullTextSearch.removeFile(fileId)
    } catch (error) {
      console.error('删除文件搜索索引失败:', error)
    }
  }
}

// 创建单例实例
let hybridSearchServiceInstance = null

export function getHybridSearchService() {
  if (!hybridSearchServiceInstance) {
    hybridSearchServiceInstance = new HybridSearchService()
  }
  return hybridSearchServiceInstance
}

export default HybridSearchService
