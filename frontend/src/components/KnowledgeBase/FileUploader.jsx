/**
 * 文件上传组件
 * 支持拖拽上传、多文件选择、进度显示、文件预览
 */

import React, { useState, useCallback } from 'react'
import { Upload, Modal, Message, Progress, Space, Button, Tag } from '@arco-design/web-react'
import { IconUpload, IconFile, IconClose, IconCheck, IconRefresh } from '@arco-design/web-react/icon'

const FileUploader = ({ kbId, folderId, onUploadSuccess, onUploadError }) => {
  const [uploadList, setUploadList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  // 支持的文件类型
  const SUPPORTED_TYPES = {
    document: ['.pdf', '.docx', '.doc', '.txt', '.md'],
    presentation: ['.pptx', '.ppt'],
    spreadsheet: ['.xlsx', '.xls', '.csv'],
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'],
    audio: ['.mp3', '.wav', '.m4a', '.aac'],
    video: ['.mp4', '.mov', '.avi', '.mkv']
  }

  const allSupportedTypes = Object.values(SUPPORTED_TYPES).flat()

  // 文件大小限制（100MB）
  const MAX_FILE_SIZE = 100 * 1024 * 1024

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * 获取文件类型图标
   */
  const getFileIcon = (fileName) => {
    const ext = '.' + fileName.split('.').pop().toLowerCase()
    
    if (SUPPORTED_TYPES.document.includes(ext)) return '📄'
    if (SUPPORTED_TYPES.presentation.includes(ext)) return '📽️'
    if (SUPPORTED_TYPES.spreadsheet.includes(ext)) return '📊'
    if (SUPPORTED_TYPES.image.includes(ext)) return '🖼️'
    if (SUPPORTED_TYPES.audio.includes(ext)) return '🎵'
    if (SUPPORTED_TYPES.video.includes(ext)) return '🎥'
    
    return '📎'
  }

  /**
   * 验证文件
   */
  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    
    // 检查文件类型
    if (!allSupportedTypes.includes(ext)) {
      Message.error(`不支持的文件格式: ${ext}`)
      return false
    }
    
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      Message.error(`文件 ${file.name} 超过大小限制（最大100MB）`)
      return false
    }
    
    return true
  }

  /**
   * 处理文件选择
   */
  const handleFileChange = (fileList) => {
    const validFiles = fileList.filter(item => {
      if (item.originFile) {
        return validateFile(item.originFile)
      }
      return true
    })
    
    setUploadList(validFiles)
  }

  /**
   * 开始上传
   */
  const handleUpload = async () => {
    if (uploadList.length === 0) {
      Message.warning('请先选择文件')
      return
    }

    setUploading(true)
    const formData = new FormData()
    
    // 添加所有文件
    uploadList.forEach(item => {
      if (item.originFile) {
        formData.append('files', item.originFile)
      }
    })
    
    // 添加文件夹ID
    if (folderId) {
      formData.append('folderId', folderId)
    }

    try {
      const response = await fetch(`http://localhost:3001/api/v1/kb/${kbId}/files/upload`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.code === 201) {
        Message.success(result.message || '上传成功')
        setUploadList([])
        
        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      Message.error(error.message || '上传失败')
      
      if (onUploadError) {
        onUploadError(error)
      }
    } finally {
      setUploading(false)
    }
  }

  /**
   * 移除文件
   */
  const handleRemove = (file) => {
    setUploadList(uploadList.filter(item => item.uid !== file.uid))
  }

  /**
   * 清空列表
   */
  const handleClear = () => {
    setUploadList([])
  }

  return (
    <div style={{ width: '100%' }}>
      <Upload.Dragger
        multiple
        fileList={uploadList}
        onChange={handleFileChange}
        onRemove={handleRemove}
        accept={allSupportedTypes.join(',')}
        autoUpload={false}
        tip={
          <div style={{ marginTop: 8, color: '#86909C', fontSize: 12 }}>
            <div>支持的格式：PDF, DOCX, PPTX, XLSX, 图片, 音视频等</div>
            <div>单个文件最大 100MB，可同时上传多个文件</div>
          </div>
        }
        renderUploadItem={(originNode, file) => {
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#F7F8FA',
                borderRadius: 4,
                marginBottom: 8
              }}
            >
              <span style={{ fontSize: 24, marginRight: 12 }}>
                {getFileIcon(file.name)}
              </span>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: '#1D2129',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: '#86909C' }}>
                  {formatFileSize(file.originFile?.size || 0)}
                </div>
              </div>

              <Button
                type="text"
                size="small"
                icon={<IconClose />}
                onClick={() => handleRemove(file)}
                style={{ marginLeft: 8 }}
              />
            </div>
          )
        }}
      >
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: '#165DFF',
              marginBottom: 16
            }}
          >
            <IconUpload />
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#1D2129',
              marginBottom: 8
            }}
          >
            点击或拖拽文件到此处上传
          </div>
        </div>
      </Upload.Dragger>

      {uploadList.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button
              onClick={handleClear}
              disabled={uploading}
            >
              清空列表
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              icon={<IconUpload />}
            >
              {uploading ? '上传中...' : `上传 ${uploadList.length} 个文件`}
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}

export default FileUploader

