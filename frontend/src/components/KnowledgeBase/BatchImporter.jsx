/**
 * 批量导入组件
 * 支持文件夹上传和批量文件处理
 */

import React, { useState, useCallback } from 'react'
import { 
  Modal, 
  Upload, 
  Progress, 
  Button, 
  Space, 
  Typography, 
  List, 
  Tag,
  Message,
  Divider
} from '@arco-design/web-react'
import { IconUpload, IconFolder, IconFile, IconDelete, IconCheck, IconClose } from '@arco-design/web-react/icon'
import { formatFileSize } from '../../utils/format'

const { Text, Title } = Typography

const BatchImporter = ({ 
  visible, 
  onClose, 
  kbId, 
  folderId,
  onImportSuccess,
  onImportError 
}) => {
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [importResults, setImportResults] = useState([])

  // 处理文件选择
  const handleFileChange = (fileList) => {
    const validFiles = fileList.filter(file => {
      // 文件大小限制（100MB）
      if (file.size > 100 * 1024 * 1024) {
        Message.error(`文件 ${file.name} 超过100MB限制`)
        return false
      }
      return true
    })
    
    setFileList(validFiles)
  }

  // 移除文件
  const handleRemoveFile = (file) => {
    setFileList(prev => prev.filter(f => f.uid !== file.uid))
  }

  // 开始批量导入
  const handleStartImport = async () => {
    if (fileList.length === 0) {
      Message.warning('请先选择要导入的文件')
      return
    }

    setUploading(true)
    setImportResults([])
    
    const results = []
    let successCount = 0
    let failCount = 0

    try {
      // 分批处理文件（每批5个）
      const batchSize = 5
      for (let i = 0; i < fileList.length; i += batchSize) {
        const batch = fileList.slice(i, i + batchSize)
        
        // 并行处理当前批次
        const batchPromises = batch.map(async (file, index) => {
          const globalIndex = i + index
          try {
            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: { status: 'uploading', progress: 0 }
            }))

            // 模拟上传进度
            for (let progress = 0; progress <= 100; progress += 10) {
              setUploadProgress(prev => ({
                ...prev,
                [file.uid]: { status: 'uploading', progress }
              }))
              await new Promise(resolve => setTimeout(resolve, 100))
            }

            // 这里应该调用实际的上传API
            // const response = await uploadFiles(kbId, [file.originFile], folderId)
            
            // 模拟成功响应
            const mockResponse = {
              success: true,
              file: {
                id: `file_${Date.now()}_${globalIndex}`,
                name: file.name,
                size: file.size,
                type: file.type
              }
            }

            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: { status: 'success', progress: 100 }
            }))

            results.push({
              file,
              success: true,
              result: mockResponse,
              message: '导入成功'
            })
            successCount++

          } catch (error) {
            setUploadProgress(prev => ({
              ...prev,
              [file.uid]: { status: 'error', progress: 0 }
            }))

            results.push({
              file,
              success: false,
              error: error.message,
              message: '导入失败'
            })
            failCount++
          }
        })

        await Promise.all(batchPromises)
      }

      setImportResults(results)
      
      if (successCount > 0) {
        Message.success(`成功导入 ${successCount} 个文件${failCount > 0 ? `，${failCount} 个失败` : ''}`)
        if (onImportSuccess) {
          onImportSuccess({ successCount, failCount, results })
        }
      } else {
        Message.error('所有文件导入失败')
        if (onImportError) {
          onImportError(new Error('所有文件导入失败'))
        }
      }

    } catch (error) {
      console.error('批量导入失败:', error)
      Message.error('批量导入失败: ' + error.message)
      if (onImportError) {
        onImportError(error)
      }
    } finally {
      setUploading(false)
    }
  }

  // 清空列表
  const handleClear = () => {
    setFileList([])
    setUploadProgress({})
    setImportResults([])
  }

  // 获取文件图标
  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    const iconMap = {
      pdf: '📄',
      docx: '📄',
      doc: '📄',
      pptx: '📽️',
      ppt: '📽️',
      xlsx: '📊',
      xls: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      mp3: '🎵',
      wav: '🎵',
      mp4: '🎥',
      mov: '🎥',
      txt: '📝',
      md: '📝'
    }
    return iconMap[ext] || '📎'
  }

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <IconCheck style={{ color: '#00b42a' }} />
      case 'error':
        return <IconClose style={{ color: '#f53f3f' }} />
      case 'uploading':
        return <IconUpload style={{ color: '#1890ff' }} />
      default:
        return <IconFile />
    }
  }

  return (
    <Modal
      title="批量导入文件"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
    >
      <div className="batch-importer">
        {/* 上传区域 */}
        <div style={{ marginBottom: 24 }}>
          <Upload.Dragger
            multiple
            fileList={fileList}
            onChange={handleFileChange}
            onRemove={handleRemoveFile}
            autoUpload={false}
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md,.jpg,.jpeg,.png,.gif,.mp3,.wav,.mp4,.mov"
            tip={
              <div style={{ marginTop: 8, color: '#86909C', fontSize: 12 }}>
                <div>支持拖拽上传或点击选择文件</div>
                <div>支持文档、图片、音视频等多种格式，单个文件最大100MB</div>
              </div>
            }
          >
            <div
              style={{
                backgroundColor: 'var(--color-fill-2)',
                border: '1px dashed var(--color-fill-4)',
                borderRadius: '2px',
                height: 120,
                width: '100%',
                color: 'var(--color-text-3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IconUpload style={{ fontSize: 24, color: 'var(--color-text-3)' }} />
              <Text style={{ marginTop: 8 }}>点击或拖拽文件到此处</Text>
            </div>
          </Upload.Dragger>
        </div>

        {/* 文件列表 */}
        {fileList.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Title level={5}>待导入文件 ({fileList.length})</Title>
            <List
              dataSource={fileList}
              render={(file) => (
                <List.Item
                  key={file.uid}
                  style={{ padding: '8px 0' }}
                  actions={[
                    <Button
                      type="text"
                      icon={<IconDelete />}
                      onClick={() => handleRemoveFile(file)}
                      disabled={uploading}
                    />
                  ]}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>{getFileIcon(file)}</span>}
                    title={file.name}
                    description={
                      <Space>
                        <Text type="secondary">{formatFileSize(file.size)}</Text>
                        {uploadProgress[file.uid] && (
                          <>
                            {getStatusIcon(uploadProgress[file.uid].status)}
                            {uploadProgress[file.uid].status === 'uploading' && (
                              <Progress
                                percent={uploadProgress[file.uid].progress}
                                size="mini"
                                style={{ width: 100 }}
                              />
                            )}
                          </>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {/* 导入结果 */}
        {importResults.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Divider />
            <Title level={5}>导入结果</Title>
            <List
              dataSource={importResults}
              render={(result) => (
                <List.Item
                  key={result.file.uid}
                  style={{ padding: '8px 0' }}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 20 }}>{getFileIcon(result.file)}</span>}
                    title={
                      <Space>
                        {result.file.name}
                        {getStatusIcon(result.success ? 'success' : 'error')}
                        <Tag color={result.success ? 'green' : 'red'}>
                          {result.message}
                        </Tag>
                      </Space>
                    }
                    description={result.error || result.result?.message}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClear} disabled={uploading || fileList.length === 0}>
              清空列表
            </Button>
            <Button onClick={onClose} disabled={uploading}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleStartImport}
              loading={uploading}
              disabled={fileList.length === 0}
            >
              {uploading ? '导入中...' : `开始导入 (${fileList.length})`}
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  )
}

export default BatchImporter
