/**
 * 向量搜索服务
 * 使用简单的文本相似度算法实现语义搜索
 * 在实际生产环境中，应该使用专业的向量数据库如 Pinecone、Weaviate 等
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 计算文本相似度（使用简单的余弦相似度）
 * @param {string} text1 
 * @param {string} text2 
 * @returns {number} 相似度分数 (0-1)
 */
function calculateSimilarity(text1, text2) {
  if (!text1 || !text2) return 0
  
  // 简单的词频向量计算
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  const allWords = [...new Set([...words1, ...words2])]
  
  const vector1 = allWords.map(word => words1.filter(w => w === word).length)
  const vector2 = allWords.map(word => words2.filter(w => w === word).length)
  
  // 计算余弦相似度
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0)
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0))
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0))
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0
  
  return dotProduct / (magnitude1 * magnitude2)
}

/**
 * 搜索知识库内容
 * @param {string[]} kbIds - 知识库ID列表
 * @param {string} query - 搜索查询
 * @param {number} topK - 返回结果数量
 * @param {number} userId - 用户ID
 * @returns {Promise<Array>} 搜索结果
 */
export async function searchKnowledgeBase(kbIds, query, topK = 5, userId) {
  try {
    // 验证用户权限
    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where: {
        id: { in: kbIds },
        workspace: {
          OR: [
            { ownerId: userId },
            { memberships: { some: { userId } } }
          ]
        }
      }
    })

    if (knowledgeBases.length !== kbIds.length) {
      throw new Error('无权限访问某些知识库')
    }

    // 获取知识库中的所有文档块
    const chunks = await prisma.documentChunk.findMany({
      where: {
        document: {
          kbId: { in: kbIds }
        }
      },
      include: {
        document: {
          include: {
            knowledgeBase: true
          }
        }
      }
    })

    // 计算相似度并排序
    const results = chunks
      .map(chunk => ({
        docId: chunk.documentId,
        chunkId: chunk.id,
        text: chunk.content,
        score: calculateSimilarity(query, chunk.content),
        metadata: {
          fileId: chunk.documentId,
          fileName: chunk.document.name,
          chunkIndex: chunk.chunkIndex,
          kbId: chunk.document.kbId,
          kbName: chunk.document.knowledgeBase.name
        }
      }))
      .filter(result => result.score > 0.1) // 过滤低相似度结果
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return results
  } catch (error) {
    console.error('向量搜索错误:', error)
    throw error
  }
}

/**
 * 创建文档向量索引
 * @param {string} documentId - 文档ID
 * @param {string} content - 文档内容
 * @returns {Promise<void>}
 */
export async function createDocumentIndex(documentId, content) {
  try {
    // 将文档分块
    const chunks = splitDocumentIntoChunks(content)
    
    // 删除旧的块
    await prisma.documentChunk.deleteMany({
      where: { documentId }
    })
    
    // 创建新的块
    const chunkData = chunks.map((chunk, index) => ({
      documentId,
      content: chunk,
      chunkIndex: index,
      vector: null // 在实际应用中，这里应该存储向量
    }))
    
    await prisma.documentChunk.createMany({
      data: chunkData
    })
    
    console.log(`为文档 ${documentId} 创建了 ${chunks.length} 个块`)
  } catch (error) {
    console.error('创建文档索引错误:', error)
    throw error
  }
}

/**
 * 将文档分割成块
 * @param {string} content - 文档内容
 * @param {number} chunkSize - 块大小
 * @param {number} overlap - 重叠大小
 * @returns {Array<string>} 文档块数组
 */
function splitDocumentIntoChunks(content, chunkSize = 1000, overlap = 200) {
  if (!content) return []
  
  const chunks = []
  let start = 0
  
  while (start < content.length) {
    let end = start + chunkSize
    
    // 尝试在句号、问号、感叹号处分割
    if (end < content.length) {
      const lastSentenceEnd = content.lastIndexOf('.', end)
      const lastQuestionEnd = content.lastIndexOf('?', end)
      const lastExclamationEnd = content.lastIndexOf('!', end)
      
      const lastEnd = Math.max(lastSentenceEnd, lastQuestionEnd, lastExclamationEnd)
      
      if (lastEnd > start + chunkSize / 2) {
        end = lastEnd + 1
      }
    }
    
    const chunk = content.slice(start, end).trim()
    if (chunk) {
      chunks.push(chunk)
    }
    
    start = end - overlap
    if (start >= content.length) break
  }
  
  return chunks
}

/**
 * 删除文档索引
 * @param {string} documentId - 文档ID
 * @returns {Promise<void>}
 */
export async function deleteDocumentIndex(documentId) {
  try {
    await prisma.documentChunk.deleteMany({
      where: { documentId }
    })
    
    console.log(`删除了文档 ${documentId} 的索引`)
  } catch (error) {
    console.error('删除文档索引错误:', error)
    throw error
  }
}






