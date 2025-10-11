/**
 * 文件解析服务
 * 支持多种文件格式的解析和分块处理
 */

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { createDocumentIndex } from './vectorSearch.js'

const prisma = new PrismaClient()

/**
 * 支持的文件类型
 */
const SUPPORTED_TYPES = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/csv': 'csv',
  'application/json': 'json',
  'text/html': 'html'
}

/**
 * 解析文件内容
 * @param {string} filePath - 文件路径
 * @param {string} mimeType - MIME类型
 * @returns {Promise<string>} 解析后的文本内容
 */
export async function parseFile(filePath, mimeType) {
  try {
    const fileExtension = SUPPORTED_TYPES[mimeType]
    
    if (!fileExtension) {
      throw new Error(`不支持的文件类型: ${mimeType}`)
    }

    switch (fileExtension) {
      case 'txt':
      case 'md':
      case 'csv':
      case 'json':
      case 'html':
        return await parseTextFile(filePath)
      
      case 'pdf':
        return await parsePdfFile(filePath)
      
      case 'doc':
      case 'docx':
        return await parseWordFile(filePath)
      
      default:
        throw new Error(`暂不支持解析 ${fileExtension} 文件`)
    }
  } catch (error) {
    console.error('文件解析错误:', error)
    throw error
  }
}

/**
 * 解析文本文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 文件内容
 */
async function parseTextFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('读取文本文件错误:', error)
    throw error
  }
}

/**
 * 解析PDF文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 提取的文本内容
 */
async function parsePdfFile(filePath) {
  try {
    // 这里应该使用 pdf-parse 或类似的库
    // 为了演示，我们返回一个模拟的文本内容
    const content = `PDF文件内容提取示例
    
这是一个PDF文档的示例内容。在实际应用中，应该使用专业的PDF解析库来提取文本内容。

PDF解析需要考虑：
1. 文本提取
2. 格式保持
3. 图片OCR识别
4. 表格处理

由于PDF格式复杂，建议使用成熟的库如pdf-parse、pdf2pic等。`
    
    return content
  } catch (error) {
    console.error('PDF解析错误:', error)
    throw error
  }
}

/**
 * 解析Word文件
 * @param {string} filePath - 文件路径
 * @returns {Promise<string>} 提取的文本内容
 */
async function parseWordFile(filePath) {
  try {
    // 这里应该使用 mammoth 或类似的库
    // 为了演示，我们返回一个模拟的文本内容
    const content = `Word文档内容提取示例
    
这是一个Word文档的示例内容。在实际应用中，应该使用专业的Word解析库来提取文本内容。

Word解析需要考虑：
1. 文本提取
2. 格式保持
3. 图片处理
4. 表格处理
5. 样式信息

建议使用成熟的库如mammoth、docx-parser等。`
    
    return content
  } catch (error) {
    console.error('Word解析错误:', error)
    throw error
  }
}

/**
 * 异步处理文件上传
 * @param {string} fileId - 文件ID
 * @returns {Promise<void>}
 */
export async function processFileAsync(fileId) {
  try {
    console.log(`开始处理文件 ${fileId}`)
    
    // 获取文件信息
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        document: {
          include: {
            knowledgeBase: true
          }
        }
      }
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    // 更新文件状态为处理中
    await prisma.file.update({
      where: { id: fileId },
      data: { status: 'processing' }
    })

    try {
      // 解析文件内容
      const content = await parseFile(file.storageUrl, file.mimeType)
      
      // 创建文档记录
      const document = await prisma.document.create({
        data: {
          name: file.name,
          content: content,
          kbId: file.kbId,
          fileId: file.id,
          status: 'processed'
        }
      })

      // 创建向量索引
      await createDocumentIndex(document.id, content)
      
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
  } catch (error) {
    console.error('异步文件处理错误:', error)
    throw error
  }
}

/**
 * 获取文件处理状态
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件状态信息
 */
export async function getFileProcessingStatus(fileId) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        status: true,
        errorMessage: true,
        processedAt: true,
        document: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!file) {
      throw new Error('文件不存在')
    }

    return {
      fileId: file.id,
      fileName: file.name,
      status: file.status,
      errorMessage: file.errorMessage,
      processedAt: file.processedAt,
      document: file.document
    }
  } catch (error) {
    console.error('获取文件状态错误:', error)
    throw error
  }
}

/**
 * 重新处理失败的文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<void>}
 */
export async function reprocessFile(fileId) {
  try {
    // 重置文件状态
    await prisma.file.update({
      where: { id: fileId },
      data: { 
        status: 'pending',
        errorMessage: null
      }
    })

    // 重新处理文件
    await processFileAsync(fileId)
  } catch (error) {
    console.error('重新处理文件错误:', error)
    throw error
  }
}


