import { request } from './api'

// ==================== 知识库管理 ====================

// 获取知识库列表
export const getKnowledgeBases = async (params = {}) => {
  const { page = 1, pageSize = 20, search = '', workspaceId } = params
  
  const queryParams = new URLSearchParams({
    page,
    pageSize,
    ...(search && { search }),
    ...(workspaceId && { workspaceId })
  })

  return request(`/kb?${queryParams}`, {
    method: 'GET'
  })
}

// 创建知识库
export const createKnowledgeBase = async (data) => {
  return request('/kb', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 获取知识库详情
export const getKnowledgeBaseDetail = async (id) => {
  return request(`/kb/${id}`, {
    method: 'GET'
  })
}

// 更新知识库
export const updateKnowledgeBase = async (id, data) => {
  return request(`/kb/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 删除知识库
export const deleteKnowledgeBase = async (id) => {
  return request(`/kb/${id}`, {
    method: 'DELETE'
  })
}

// ==================== 文件夹管理 ====================

// 获取文件夹树
export const getFolderTree = async (kbId) => {
  return request(`/kb/${kbId}/folders`, {
    method: 'GET'
  })
}

// 创建文件夹
export const createFolder = async (kbId, data) => {
  return request(`/kb/${kbId}/folders`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 更新文件夹
export const updateFolder = async (kbId, folderId, data) => {
  return request(`/kb/${kbId}/folders/${folderId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 删除文件夹
export const deleteFolder = async (kbId, folderId) => {
  return request(`/kb/${kbId}/folders/${folderId}`, {
    method: 'DELETE'
  })
}

// ==================== 文档管理 ====================

// 获取文档列表
export const getDocuments = async (kbId, params = {}) => {
  const { folderId } = params
  const queryParams = new URLSearchParams({
    ...(folderId && { folderId })
  })

  return request(`/kb/${kbId}/files?${queryParams}`, {
    method: 'GET'
  })
}

// 创建文档
export const createDocument = async (kbId, data) => {
  return request(`/kb/${kbId}/files`, {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 获取文档详情
export const getDocumentDetail = async (kbId, fileId) => {
  return request(`/kb/${kbId}/files/${fileId}`, {
    method: 'GET'
  })
}

// 更新文档内容
export const updateDocument = async (kbId, fileId, data) => {
  return request(`/kb/${kbId}/files/${fileId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

// 移动文档到文件夹
export const moveDocument = async (kbId, fileId, folderId) => {
  return request(`/kb/${kbId}/files/${fileId}/move`, {
    method: 'POST',
    body: JSON.stringify({ folderId })
  })
}

// 删除文档
export const deleteDocument = async (kbId, fileId) => {
  return request(`/kb/${kbId}/files/${fileId}`, {
    method: 'DELETE'
  })
}

// ==================== 文件上传相关 ====================

// 上传文件（支持多文件）
export const uploadFiles = async (kbId, files, folderId = null) => {
  const formData = new FormData()
  
  // 添加所有文件
  Array.from(files).forEach(file => {
    formData.append('files', file)
  })
  
  // 添加文件夹ID
  if (folderId) {
    formData.append('folderId', folderId)
  }

  return request(`/kb/${kbId}/files/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
    }
  })
}

// 上传知识库封面
export const uploadCover = async (kbId, file) => {
  const formData = new FormData()
  formData.append('cover', file)

  return request(`/kb/${kbId}/cover`, {
    method: 'POST',
    body: formData,
    headers: {
      // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
    }
  })
}

// 获取文件详情（包含解析结果和知识块）
export const getFileDetail = async (kbId, fileId) => {
  return request(`/kb/${kbId}/files/${fileId}/detail`, {
    method: 'GET'
  })
}

// 重新解析文件
export const reparseFile = async (kbId, fileId) => {
  return request(`/kb/${kbId}/files/${fileId}/reparse`, {
    method: 'POST'
  })
}

