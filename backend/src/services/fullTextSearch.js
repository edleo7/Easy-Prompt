/**
 * 全文搜索服务
 * 基于SQLite FTS5实现快速全文搜索
 */

import Database from 'better-sqlite3'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class FullTextSearchService {
  constructor() {
    this.db = null
    this.ftsTableName = 'knowledge_fts'
    this.initialized = false
  }

  /**
   * 初始化FTS5虚拟表
   */
  async initialize() {
    try {
      // 获取SQLite数据库路径
      const dbPath = path.join(process.cwd(), 'backend', 'prisma', 'dev.db')
      this.db = new Database(dbPath)
      
      // 创建FTS5虚拟表
      await this.createFTS5Table()
      
      // 同步现有数据
      await this.syncExistingData()
      
      this.initialized = true
      console.log('✅ 全文搜索服务初始化完成')
    } catch (error) {
      console.error('全文搜索服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建FTS5虚拟表
   */
  async createFTS5Table() {
    const createTableSQL = `
      CREATE VIRTUAL TABLE IF NOT EXISTS ${this.ftsTableName} USING fts5(
        fileId UNINDEXED,
        kbId UNINDEXED,
        fileName,
        content,
        tags,
        tokenize='unicode61 remove_diacritics 1'
      )
    `
    
    this.db.exec(createTableSQL)
    console.log('FTS5虚拟表创建完成')
  }

  /**
   * 同步现有数据到FTS5表
   */
  async syncExistingData() {
    try {
      // 清空现有数据
      this.db.exec(`DELETE FROM ${this.ftsTableName}`)
      
      // 获取所有文件数据
      const files = await prisma.file.findMany({
        where: {
          extractedText: {
            not: null
          }
        },
        select: {
          id: true,
          kbId: true,
          name: true,
          extractedText: true,
          tags: true
        }
      })

      // 批量插入到FTS5表
      const insertStmt = this.db.prepare(`
        INSERT INTO ${this.ftsTableName} (fileId, kbId, fileName, content, tags)
        VALUES (?, ?, ?, ?, ?)
      `)

      const insertMany = this.db.transaction((files) => {
        for (const file of files) {
          insertStmt.run(
            file.id,
            file.kbId,
            file.name,
            file.extractedText || '',
            file.tags || ''
          )
        }
      })

      insertMany(files)
      console.log(`同步了 ${files.length} 个文件到FTS5表`)
    } catch (error) {
      console.error('同步数据到FTS5表失败:', error)
    }
  }

  /**
   * 添加文件到搜索索引
   */
  async addFile(file) {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO ${this.ftsTableName} (fileId, kbId, fileName, content, tags)
        VALUES (?, ?, ?, ?, ?)
      `)

      insertStmt.run(
        file.id,
        file.kbId,
        file.name,
        file.extractedText || '',
        file.tags || ''
      )
    } catch (error) {
      console.error('添加文件到搜索索引失败:', error)
    }
  }

  /**
   * 更新文件搜索索引
   */
  async updateFile(file) {
    await this.addFile(file) // FTS5使用INSERT OR REPLACE
  }

  /**
   * 删除文件搜索索引
   */
  async removeFile(fileId) {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const deleteStmt = this.db.prepare(`
        DELETE FROM ${this.ftsTableName} WHERE fileId = ?
      `)
      deleteStmt.run(fileId)
    } catch (error) {
      console.error('删除文件搜索索引失败:', error)
    }
  }

  /**
   * 全文搜索
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize()
    }

    const {
      kbId = null,
      limit = 20,
      offset = 0,
      highlight = true
    } = options

    try {
      // 构建搜索SQL
      let searchSQL = `
        SELECT 
          fileId,
          kbId,
          fileName,
          content,
          tags,
          rank
        FROM ${this.ftsTableName}
        WHERE ${this.ftsTableName} MATCH ?
      `

      const params = [query]

      // 添加知识库过滤
      if (kbId) {
        searchSQL += ' AND kbId = ?'
        params.push(kbId)
      }

      // 添加排序和分页
      searchSQL += ' ORDER BY rank LIMIT ? OFFSET ?'
      params.push(limit, offset)

      const stmt = this.db.prepare(searchSQL)
      const results = stmt.all(...params)

      // 获取文件详细信息
      const fileIds = results.map(r => r.fileId)
      const files = await prisma.file.findMany({
        where: {
          id: {
            in: fileIds
          }
        },
        include: {
          folder: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // 合并搜索结果和文件信息
      const searchResults = results.map(result => {
        const file = files.find(f => f.id === result.fileId)
        return {
          file,
          score: result.rank,
          snippet: this.generateSnippet(result.content, query),
          highlights: highlight ? this.generateHighlights(result.content, query) : []
        }
      })

      return searchResults
    } catch (error) {
      console.error('全文搜索失败:', error)
      return []
    }
  }

  /**
   * 生成内容摘要
   */
  generateSnippet(content, query, maxLength = 200) {
    if (!content) return ''
    
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentLower = content.toLowerCase()
    
    // 查找第一个匹配的位置
    let bestIndex = -1
    let bestScore = 0
    
    for (let i = 0; i < contentLower.length; i++) {
      let score = 0
      for (const word of queryWords) {
        if (contentLower.substring(i, i + word.length) === word) {
          score += word.length
        }
      }
      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }
    
    if (bestIndex === -1) {
      return content.substring(0, maxLength) + '...'
    }
    
    const start = Math.max(0, bestIndex - maxLength / 2)
    const end = Math.min(content.length, start + maxLength)
    
    let snippet = content.substring(start, end)
    if (start > 0) snippet = '...' + snippet
    if (end < content.length) snippet = snippet + '...'
    
    return snippet
  }

  /**
   * 生成高亮标记
   */
  generateHighlights(content, query) {
    if (!content) return []
    
    const queryWords = query.toLowerCase().split(/\s+/)
    const highlights = []
    
    for (const word of queryWords) {
      if (word.length < 2) continue // 忽略太短的词
      
      const regex = new RegExp(`(${word})`, 'gi')
      let match
      while ((match = regex.exec(content)) !== null) {
        highlights.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        })
      }
    }
    
    return highlights
  }

  /**
   * 获取搜索建议
   */
  async getSuggestions(query, limit = 10) {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const suggestionsSQL = `
        SELECT DISTINCT fileName
        FROM ${this.ftsTableName}
        WHERE fileName MATCH ?
        LIMIT ?
      `

      const stmt = this.db.prepare(suggestionsSQL)
      const results = stmt.all(query + '*', limit)
      
      return results.map(r => r.fileName)
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      return []
    }
  }

  /**
   * 获取搜索统计
   */
  async getSearchStats() {
    if (!this.initialized) {
      await this.initialize()
    }

    try {
      const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.ftsTableName}`)
      const result = countStmt.get()
      
      return {
        indexedFiles: result.count,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('获取搜索统计失败:', error)
      return { indexedFiles: 0, lastUpdated: new Date() }
    }
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 创建单例实例
let fullTextSearchServiceInstance = null

export function getFullTextSearchService() {
  if (!fullTextSearchServiceInstance) {
    fullTextSearchServiceInstance = new FullTextSearchService()
  }
  return fullTextSearchServiceInstance
}

export default FullTextSearchService
