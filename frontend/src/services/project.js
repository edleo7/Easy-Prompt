import { request } from './api'

// ==================== 项目管理 ====================

// 获取项目列表
export const getProjects = async (params = {}) => {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.type) queryParams.append('type', params.type)
  if (params.workspaceId) queryParams.append('workspaceId', params.workspaceId)
  if (params.status) queryParams.append('status', params.status)
  if (params.search) queryParams.append('search', params.search)
  if (params.tags) queryParams.append('tags', params.tags)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/projects?${queryString}` : '/projects'
  
  return request(url, {
    method: 'GET'
  })
}

// 创建项目
export const createProject = async (projectData) => {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData)
  })
}

// 获取项目详情
export const getProjectDetail = async (projectId) => {
  return request(`/projects/${projectId}`, {
    method: 'GET'
  })
}

// 更新项目
export const updateProject = async (projectId, projectData) => {
  return request(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(projectData)
  })
}

// 删除项目
export const deleteProject = async (projectId) => {
  return request(`/projects/${projectId}`, {
    method: 'DELETE'
  })
}

// 获取项目统计信息
export const getProjectStats = async (projectId) => {
  return request(`/projects/${projectId}/stats`, {
    method: 'GET'
  })
}

// ==================== Prompt管理 ====================

// 获取项目下的Prompt列表
export const getProjectPrompts = async (projectId, params = {}) => {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page)
  if (params.limit) queryParams.append('limit', params.limit)
  if (params.status) queryParams.append('status', params.status)
  if (params.search) queryParams.append('search', params.search)
  
  const queryString = queryParams.toString()
  const url = queryString ? `/projects/${projectId}/prompts?${queryString}` : `/projects/${projectId}/prompts`
  
  return request(url, {
    method: 'GET'
  })
}

// 创建Prompt
export const createPrompt = async (projectId, promptData) => {
  return request(`/projects/${projectId}/prompts`, {
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

export default {
  // 项目管理
  getProjects,
  createProject,
  getProjectDetail,
  updateProject,
  deleteProject,
  getProjectStats,
  
  // Prompt管理
  getProjectPrompts,
  createPrompt,
  getPromptDetail,
  updatePrompt,
  deletePrompt,
  duplicatePrompt
}
