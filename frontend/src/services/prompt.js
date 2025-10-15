import { request } from './api'

// ==================== Prompt管理 ====================

// 获取Prompt列表
export const getPrompts = async (params = {}) => {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.status) queryParams.append('status', params.status)
  if (params.search) queryParams.append('search', params.search)
  if (params.projectId) queryParams.append('projectId', params.projectId)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/prompts?${queryString}` : '/prompts'
  
  return request(url, {
    method: 'GET'
  })
}

// 创建Prompt
export const createPrompt = async (promptData) => {
  return request('/prompts', {
    method: 'POST',
    body: JSON.stringify(promptData)
  })
}

// 获取Prompt详情
export const getPromptDetail = async (promptId) => {
  return request(`/prompts/${promptId}`, {
    method: 'GET'
  })
}

// 更新Prompt
export const updatePrompt = async (promptId, promptData) => {
  return request(`/prompts/${promptId}`, {
    method: 'PUT',
    body: JSON.stringify(promptData)
  })
}

// 删除Prompt
export const deletePrompt = async (promptId) => {
  return request(`/prompts/${promptId}`, {
    method: 'DELETE'
  })
}

// 复制Prompt
export const duplicatePrompt = async (promptId, name) => {
  return request(`/prompts/${promptId}/duplicate`, {
    method: 'POST',
    body: JSON.stringify({ name })
  })
}

// 测试Prompt
export const testPrompt = async (promptData) => {
  return request('/prompts/test', {
    method: 'POST',
    body: JSON.stringify(promptData)
  })
}

// 导出Prompt
export const exportPrompt = async (promptId, format = 'json') => {
  return request(`/prompts/${promptId}/export?format=${format}`, {
    method: 'GET'
  })
}

// 导入Prompt
export const importPrompt = async (projectId, promptData) => {
  return request(`/projects/${projectId}/prompts/import`, {
    method: 'POST',
    body: JSON.stringify(promptData)
  })
}

// 批量操作
export const batchUpdatePrompts = async (promptIds, updateData) => {
  return request('/prompts/batch', {
    method: 'PUT',
    body: JSON.stringify({ promptIds, updateData })
  })
}

export const batchDeletePrompts = async (promptIds) => {
  return request('/prompts/batch', {
    method: 'DELETE',
    body: JSON.stringify({ promptIds })
  })
}

export default {
  getPrompts,
  createPrompt,
  getPromptDetail,
  updatePrompt,
  deletePrompt,
  duplicatePrompt,
  testPrompt,
  exportPrompt,
  importPrompt,
  batchUpdatePrompts,
  batchDeletePrompts
}
