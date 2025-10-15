/**
 * 知识库引用服务
 * 处理前端与后端知识库引用相关的API调用
 */

import { request } from './api'

// ==================== 引用解析相关 ====================

/**
 * 解析Prompt中的引用
 */
export const parseReferences = async (content, options = {}) => {
  return request('/prompt/parse-references', {
    method: 'POST',
    body: JSON.stringify({
      content,
      options
    })
  })
}

/**
 * 验证引用语法
 */
export const validateReferences = async (content) => {
  return request('/prompt/validate-references', {
    method: 'POST',
    body: JSON.stringify({ content })
  })
}

// ==================== 引用预览相关 ====================

/**
 * 获取引用预览
 */
export const getReferencePreview = async (kbId, fileId, length = 200) => {
  return request(`/kb/${kbId}/files/${fileId}/preview?length=${length}`, {
    method: 'GET'
  })
}

// ==================== 可引用文件相关 ====================

/**
 * 获取知识库中可引用的文件列表
 */
export const getReferenceableFiles = async (kbId, options = {}) => {
  const { limit = 50, offset = 0, fileTypes, search } = options
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  })
  
  if (fileTypes) {
    params.append('fileTypes', Array.isArray(fileTypes) ? fileTypes.join(',') : fileTypes)
  }
  
  if (search) {
    params.append('search', search)
  }

  return request(`/kb/${kbId}/referenceable-files?${params.toString()}`, {
    method: 'GET'
  })
}

// ==================== 引用工具相关 ====================

/**
 * 生成引用语法
 */
export const generateReferenceSyntax = async (kbId, fileId) => {
  return request('/reference/generate-syntax', {
    method: 'POST',
    body: JSON.stringify({ kbId, fileId })
  })
}

/**
 * 批量解析引用
 */
export const batchParseReferences = async (references) => {
  return request('/reference/batch-parse', {
    method: 'POST',
    body: JSON.stringify({ references })
  })
}

// ==================== 智能推荐相关 ====================

/**
 * 根据Prompt内容推荐相关知识
 */
export const recommendKnowledge = async (content, kbId, limit = 5) => {
  return request('/prompt/recommend-knowledge', {
    method: 'POST',
    body: JSON.stringify({ content, kbId, limit })
  })
}

// ==================== 引用统计相关 ====================

/**
 * 获取引用统计信息
 */
export const getReferenceStats = async (kbId) => {
  return request(`/kb/${kbId}/reference-stats`, {
    method: 'GET'
  })
}

// ==================== 工具函数 ====================

/**
 * 提取文本中的引用语法
 */
export const extractReferences = (text) => {
  const referencePattern = /\{\{kb:([^:]+):([^}]+)\}\}/g
  const references = []
  let match

  while ((match = referencePattern.exec(text)) !== null) {
    references.push({
      fullMatch: match[0],
      kbId: match[1],
      fileId: match[2],
      startIndex: match.index,
      endIndex: match.index + match[0].length
    })
  }

  return references
}

/**
 * 生成引用语法
 */
export const createReferenceSyntax = (kbId, fileId) => {
  return `{{kb:${kbId}:${fileId}}}`
}

/**
 * 验证引用语法格式
 */
export const isValidReferenceSyntax = (syntax) => {
  const referencePattern = /^\{\{kb:([^:]+):([^}]+)\}\}$/
  return referencePattern.test(syntax)
}

/**
 * 解析引用语法
 */
export const parseReferenceSyntax = (syntax) => {
  const referencePattern = /^\{\{kb:([^:]+):([^}]+)\}\}$/
  const match = syntax.match(referencePattern)
  
  if (match) {
    return {
      kbId: match[1],
      fileId: match[2]
    }
  }
  
  return null
}

export default {
  parseReferences,
  validateReferences,
  getReferencePreview,
  getReferenceableFiles,
  generateReferenceSyntax,
  batchParseReferences,
  recommendKnowledge,
  getReferenceStats,
  extractReferences,
  createReferenceSyntax,
  isValidReferenceSyntax,
  parseReferenceSyntax
}
