/**
 * 专业向量数据库集成服务
 * 支持 Pinecone 和 Weaviate
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 向量数据库配置
const VECTOR_DB_CONFIG = {
  provider: process.env.VECTOR_DB_PROVIDER || 'pinecone', // pinecone, weaviate
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
    indexName: process.env.PINECONE_INDEX_NAME || 'easyprompt'
  },
  weaviate: {
    url: process.env.WEAVIATE_URL || 'http://localhost:8080',
    apiKey: process.env.WEAVIATE_API_KEY,
    className: process.env.WEAVIATE_CLASS_NAME || 'Document'
  }
}

class VectorDatabaseService {
  constructor() {
    this.provider = VECTOR_DB_CONFIG.provider
    this.client = null
    this.initialize()
  }

  async initialize() {
    try {
      if (this.provider === 'pinecone') {
        await this.initializePinecone()
      } else if (this.provider === 'weaviate') {
        await this.initializeWeaviate()
      } else {
        console.warn('未配置向量数据库，使用本地搜索')
      }
    } catch (error) {
      console.error('向量数据库初始化失败:', error)
    }
  }

  async initializePinecone() {
    try {
      // 动态导入 Pinecone 客户端
      const { Pinecone } = await import('@pinecone-database/pinecone')
      
      this.client = new Pinecone({
        apiKey: VECTOR_DB_CONFIG.pinecone.apiKey,
        environment: VECTOR_DB_CONFIG.pinecone.environment
      })
      
      console.log('✅ Pinecone 向量数据库初始化成功')
    } catch (error) {
      console.error('Pinecone 初始化失败:', error)
      throw error
    }
  }

  async initializeWeaviate() {
    try {
      // 动态导入 Weaviate 客户端
      const weaviate = await import('weaviate-ts-client')
      
      this.client = weaviate.client({
        scheme: 'http',
        host: VECTOR_DB_CONFIG.weaviate.url.replace('http://', '').replace('https://', ''),
        apiKey: new weaviate.ApiKey(VECTOR_DB_CONFIG.weaviate.apiKey)
      })
      
      console.log('✅ Weaviate 向量数据库初始化成功')
    } catch (error) {
      console.error('Weaviate 初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建文档向量
   * @param {string} documentId - 文档ID
   * @param {string} content - 文档内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<string>} 向量ID
   */
  async createVector(documentId, content, metadata = {}) {
    if (!this.client) {
      throw new Error('向量数据库未初始化')
    }

    try {
      // 生成向量嵌入（这里使用模拟向量，实际应该调用嵌入模型）
      const vector = await this.generateEmbedding(content)
      
      if (this.provider === 'pinecone') {
        return await this.createPineconeVector(documentId, vector, metadata)
      } else if (this.provider === 'weaviate') {
        return await this.createWeaviateVector(documentId, vector, content, metadata)
      }
    } catch (error) {
      console.error('创建向量失败:', error)
      throw error
    }
  }

  /**
   * 搜索相似向量
   * @param {number[]} queryVector - 查询向量
   * @param {number} topK - 返回结果数量
   * @param {Object} filter - 过滤条件
   * @returns {Promise<Array>} 搜索结果
   */
  async searchVectors(queryVector, topK = 5, filter = {}) {
    if (!this.client) {
      throw new Error('向量数据库未初始化')
    }

    try {
      if (this.provider === 'pinecone') {
        return await this.searchPineconeVectors(queryVector, topK, filter)
      } else if (this.provider === 'weaviate') {
        return await this.searchWeaviateVectors(queryVector, topK, filter)
      }
    } catch (error) {
      console.error('搜索向量失败:', error)
      throw error
    }
  }

  /**
   * 删除向量
   * @param {string} vectorId - 向量ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteVector(vectorId) {
    if (!this.client) {
      throw new Error('向量数据库未初始化')
    }

    try {
      if (this.provider === 'pinecone') {
        return await this.deletePineconeVector(vectorId)
      } else if (this.provider === 'weaviate') {
        return await this.deleteWeaviateVector(vectorId)
      }
    } catch (error) {
      console.error('删除向量失败:', error)
      throw error
    }
  }

  // Pinecone 相关方法
  async createPineconeVector(documentId, vector, metadata) {
    const index = this.client.index(VECTOR_DB_CONFIG.pinecone.indexName)
    
    await index.upsert([{
      id: documentId,
      values: vector,
      metadata: {
        ...metadata,
        documentId,
        createdAt: new Date().toISOString()
      }
    }])
    
    return documentId
  }

  async searchPineconeVectors(queryVector, topK, filter) {
    const index = this.client.index(VECTOR_DB_CONFIG.pinecone.indexName)
    
    const searchResponse = await index.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter: filter
    })
    
    return searchResponse.matches.map(match => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata
    }))
  }

  async deletePineconeVector(vectorId) {
    const index = this.client.index(VECTOR_DB_CONFIG.pinecone.indexName)
    await index.deleteOne(vectorId)
    return true
  }

  // Weaviate 相关方法
  async createWeaviateVector(documentId, vector, content, metadata) {
    const result = await this.client.data
      .creator()
      .withClassName(VECTOR_DB_CONFIG.weaviate.className)
      .withProperties({
        documentId,
        content,
        ...metadata
      })
      .withVector(vector)
      .do()
    
    return result.id
  }

  async searchWeaviateVectors(queryVector, topK, filter) {
    const result = await this.client.graphql
      .get()
      .withClassName(VECTOR_DB_CONFIG.weaviate.className)
      .withFields('documentId content _additional { id distance }')
      .withNearVector({
        vector: queryVector,
        distance: 0.8
      })
      .withLimit(topK)
      .do()
    
    return result.data.Get[VECTOR_DB_CONFIG.weaviate.className].map(item => ({
      id: item._additional.id,
      score: 1 - item._additional.distance,
      metadata: {
        documentId: item.documentId,
        content: item.content
      }
    }))
  }

  async deleteWeaviateVector(vectorId) {
    await this.client.data
      .deleter()
      .withClassName(VECTOR_DB_CONFIG.weaviate.className)
      .withId(vectorId)
      .do()
    
    return true
  }

  /**
   * 生成文本嵌入向量
   * @param {string} text - 输入文本
   * @returns {Promise<number[]>} 向量数组
   */
  async generateEmbedding(text) {
    try {
      // 这里应该调用真实的嵌入模型API
      // 例如 OpenAI Embeddings, Cohere, 或本地模型
      
      // 模拟生成 1536 维向量（OpenAI text-embedding-ada-002 的维度）
      const vector = Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
      
      // 归一化向量
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
      return vector.map(val => val / magnitude)
    } catch (error) {
      console.error('生成嵌入向量失败:', error)
      throw error
    }
  }

  /**
   * 批量创建向量
   * @param {Array} documents - 文档数组
   * @returns {Promise<Array>} 创建结果
   */
  async batchCreateVectors(documents) {
    if (!this.client) {
      throw new Error('向量数据库未初始化')
    }

    try {
      const results = []
      
      for (const doc of documents) {
        const vector = await this.generateEmbedding(doc.content)
        const vectorId = await this.createVector(doc.id, doc.content, doc.metadata)
        results.push({ id: doc.id, vectorId })
      }
      
      return results
    } catch (error) {
      console.error('批量创建向量失败:', error)
      throw error
    }
  }

  /**
   * 获取数据库状态
   * @returns {Promise<Object>} 状态信息
   */
  async getStatus() {
    if (!this.client) {
      return {
        provider: this.provider,
        status: 'not_initialized',
        message: '向量数据库未初始化'
      }
    }

    try {
      if (this.provider === 'pinecone') {
        const index = this.client.index(VECTOR_DB_CONFIG.pinecone.indexName)
        const stats = await index.describeIndexStats()
        return {
          provider: this.provider,
          status: 'connected',
          stats: stats
        }
      } else if (this.provider === 'weaviate') {
        const schema = await this.client.schema.getter().do()
        return {
          provider: this.provider,
          status: 'connected',
          schema: schema
        }
      }
    } catch (error) {
      return {
        provider: this.provider,
        status: 'error',
        message: error.message
      }
    }
  }
}

// 创建单例实例
const vectorDB = new VectorDatabaseService()

export default vectorDB






