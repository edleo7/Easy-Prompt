/**
 * 批量处理服务
 * 支持文件批量上传、文档批量解析、向量批量索引等
 */

import { PrismaClient } from '@prisma/client'
import professionalFileParser from './professionalFileParser.js'
import vectorDB from './vectorDatabase.js'
import monitoringService from './monitoringService.js'
import cacheService from './cacheService.js'

const prisma = new PrismaClient()

class BatchProcessingService {
  constructor() {
    this.batchSize = parseInt(process.env.BATCH_SIZE) || 10
    this.maxConcurrency = parseInt(process.env.MAX_CONCURRENCY) || 5
    this.processingQueues = new Map()
  }

  /**
   * 批量处理文件上传
   * @param {Array} files - 文件列表
   * @param {string} kbId - 知识库ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object>} 处理结果
   */
  async batchProcessFiles(files, kbId, userId) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // 创建批量处理任务
      const batchTask = await prisma.batchTask.create({
        data: {
          id: batchId,
          type: 'file_processing',
          status: 'pending',
          totalItems: files.length,
          processedItems: 0,
          failedItems: 0,
          metadata: JSON.stringify({ kbId, userId })
        }
      })

      // 开始监控
      monitoringService.startTask(batchId, 'file_processing', {
        kbId,
        userId,
        totalFiles: files.length
      })

      // 分批处理文件
      const results = await this.processInBatches(files, async (file, index) => {
        try {
          // 创建文件记录
          const fileRecord = await prisma.file.create({
            data: {
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              storageUrl: file.path,
              kbId,
              status: 'pending'
            }
          })

          // 异步处理文件
          await this.processFileAsync(fileRecord.id, file.path, file.mimetype)

          // 更新进度
          const progress = Math.round(((index + 1) / files.length) * 100)
          monitoringService.updateTaskProgress(batchId, progress, `处理文件: ${file.originalname}`)

          return { success: true, fileId: fileRecord.id, fileName: file.originalname }
        } catch (error) {
          console.error(`处理文件失败: ${file.originalname}`, error)
          return { success: false, fileName: file.originalname, error: error.message }
        }
      })

      // 更新批量任务状态
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      await prisma.batchTask.update({
        where: { id: batchId },
        data: {
          status: failCount === 0 ? 'completed' : 'partial',
          processedItems: successCount,
          failedItems: failCount,
          completedAt: new Date()
        }
      })

      monitoringService.completeTask(batchId, {
        successCount,
        failCount,
        totalFiles: files.length
      })

      return {
        batchId,
        status: failCount === 0 ? 'completed' : 'partial',
        successCount,
        failCount,
        results
      }
    } catch (error) {
      monitoringService.failTask(batchId, error)
      throw error
    }
  }

  /**
   * 批量创建向量索引
   * @param {Array} documents - 文档列表
   * @param {string} kbId - 知识库ID
   * @returns {Promise<Object>} 处理结果
   */
  async batchCreateVectors(documents, kbId) {
    const batchId = `vector_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      monitoringService.startTask(batchId, 'vector_creation', {
        kbId,
        totalDocuments: documents.length
      })

      // 分批创建向量
      const results = await this.processInBatches(documents, async (doc, index) => {
        try {
          const vectorId = await vectorDB.createVector(doc.id, doc.content, {
            kbId,
            documentId: doc.id,
            title: doc.title
          })

          // 更新进度
          const progress = Math.round(((index + 1) / documents.length) * 100)
          monitoringService.updateTaskProgress(batchId, progress, `创建向量: ${doc.title}`)

          return { success: true, documentId: doc.id, vectorId }
        } catch (error) {
          console.error(`创建向量失败: ${doc.title}`, error)
          return { success: false, documentId: doc.id, error: error.message }
        }
      })

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      monitoringService.completeTask(batchId, {
        successCount,
        failCount,
        totalDocuments: documents.length
      })

      return {
        batchId,
        status: failCount === 0 ? 'completed' : 'partial',
        successCount,
        failCount,
        results
      }
    } catch (error) {
      monitoringService.failTask(batchId, error)
      throw error
    }
  }

  /**
   * 批量搜索
   * @param {Array} queries - 查询列表
   * @param {Array} kbIds - 知识库ID列表
   * @returns {Promise<Object>} 搜索结果
   */
  async batchSearch(queries, kbIds) {
    const batchId = `search_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      monitoringService.startTask(batchId, 'batch_search', {
        totalQueries: queries.length,
        kbIds
      })

      // 并行执行搜索
      const results = await Promise.all(
        queries.map(async (query, index) => {
          try {
            // 检查缓存
            const cacheKey = `search_${query}_${kbIds.join(',')}`
            let searchResults = await cacheService.get(cacheKey)

            if (!searchResults) {
              // 执行搜索
              searchResults = await vectorDB.searchVectors(
                await vectorDB.generateEmbedding(query),
                5,
                { kbId: { in: kbIds } }
              )

              // 缓存结果
              await cacheService.set(cacheKey, searchResults, 3600) // 1小时缓存
            }

            const progress = Math.round(((index + 1) / queries.length) * 100)
            monitoringService.updateTaskProgress(batchId, progress, `搜索: ${query}`)

            return { success: true, query, results: searchResults }
          } catch (error) {
            console.error(`搜索失败: ${query}`, error)
            return { success: false, query, error: error.message }
          }
        })
      )

      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      monitoringService.completeTask(batchId, {
        successCount,
        failCount,
        totalQueries: queries.length
      })

      return {
        batchId,
        status: failCount === 0 ? 'completed' : 'partial',
        successCount,
        failCount,
        results
      }
    } catch (error) {
      monitoringService.failTask(batchId, error)
      throw error
    }
  }

  /**
   * 分批处理数据
   * @param {Array} items - 数据项列表
   * @param {Function} processor - 处理函数
   * @returns {Promise<Array>} 处理结果
   */
  async processInBatches(items, processor) {
    const results = []
    const batches = this.createBatches(items, this.batchSize)

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchResults = await Promise.all(
        batch.map((item, index) => processor(item, i * this.batchSize + index))
      )
      results.push(...batchResults)

      // 控制并发
      if (i < batches.length - 1) {
        await this.delay(100) // 100ms延迟
      }
    }

    return results
  }

  /**
   * 创建批次
   * @param {Array} items - 数据项列表
   * @param {number} batchSize - 批次大小
   * @returns {Array} 批次数组
   */
  createBatches(items, batchSize) {
    const batches = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 异步处理单个文件
   * @param {string} fileId - 文件ID
   * @param {string} filePath - 文件路径
   * @param {string} mimeType - MIME类型
   * @returns {Promise<void>}
   */
  async processFileAsync(fileId, filePath, mimeType) {
    try {
      // 更新文件状态为处理中
      await prisma.file.update({
        where: { id: fileId },
        data: { status: 'processing' }
      })

      // 使用专业解析器解析文件
      const parseResult = await professionalFileParser.parseFile(filePath, mimeType)

      // 创建文档记录
      const document = await prisma.document.create({
        data: {
          name: parseResult.title || `Document_${fileId}`,
          content: parseResult.content,
          kbId: (await prisma.file.findUnique({ where: { id: fileId } })).kbId,
          fileId: fileId,
          status: 'processed'
        }
      })

      // 创建向量索引
      await vectorDB.createVector(document.id, parseResult.content, {
        fileId,
        documentId: document.id,
        type: parseResult.type
      })

      // 更新文件状态为已完成
      await prisma.file.update({
        where: { id: fileId },
        data: { 
          status: 'completed',
          processedAt: new Date()
        }
      })

      console.log(`文件 ${fileId} 处理完成`)
    } catch (error) {
      // 更新文件状态为失败
      await prisma.file.update({
        where: { id: fileId },
        data: { 
          status: 'failed',
          errorMessage: error.message
        }
      })
      
      console.error(`文件 ${fileId} 处理失败:`, error)
      throw error
    }
  }

  /**
   * 获取批量任务状态
   * @param {string} batchId - 批次ID
   * @returns {Promise<Object>} 任务状态
   */
  async getBatchTaskStatus(batchId) {
    try {
      const task = await prisma.batchTask.findUnique({
        where: { id: batchId }
      })

      if (!task) {
        throw new Error('批量任务不存在')
      }

      return {
        id: task.id,
        type: task.type,
        status: task.status,
        totalItems: task.totalItems,
        processedItems: task.processedItems,
        failedItems: task.failedItems,
        progress: Math.round((task.processedItems / task.totalItems) * 100),
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        metadata: JSON.parse(task.metadata || '{}')
      }
    } catch (error) {
      console.error('获取批量任务状态失败:', error)
      throw error
    }
  }

  /**
   * 清理过期的批量任务
   * @param {number} days - 保留天数
   * @returns {Promise<number>} 清理的任务数
   */
  async cleanupBatchTasks(days = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const result = await prisma.batchTask.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          status: {
            in: ['completed', 'failed']
          }
        }
      })

      console.log(`清理了 ${result.count} 个过期的批量任务`)
      return result.count
    } catch (error) {
      console.error('清理批量任务失败:', error)
      return 0
    }
  }
}

// 创建单例实例
const batchProcessingService = new BatchProcessingService()

// 定期清理过期任务
setInterval(() => {
  batchProcessingService.cleanupBatchTasks()
}, 24 * 60 * 60 * 1000) // 每天清理一次

export default batchProcessingService






