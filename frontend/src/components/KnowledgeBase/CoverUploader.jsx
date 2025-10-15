/**
 * 封面上传组件
 * 支持图片裁剪、实时预览
 */

import React, { useState, useRef } from 'react'
import { Upload, Modal, Message, Button, Space, Image } from '@arco-design/web-react'
import { IconUpload, IconCamera, IconDelete } from '@arco-design/web-react/icon'

const CoverUploader = ({ kbId, currentCover, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState(currentCover || null)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  /**
   * 处理文件选择
   */
  const handleFileSelect = (file) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      Message.error('只支持 JPG, PNG, WebP 格式的图片')
      return false
    }

    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      Message.error('图片大小不能超过 5MB')
      return false
    }

    // 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
      setSelectedFile(file)
    }
    reader.readAsDataURL(file)

    return false // 阻止自动上传
  }

  /**
   * 上传封面
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      Message.warning('请先选择图片')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('cover', selectedFile)

    try {
      const response = await fetch(`http://localhost:3001/api/v1/kb/${kbId}/cover`, {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.code === 200) {
        Message.success('封面上传成功')
        setPreviewImage(result.data.coverImage)
        setSelectedFile(null)
        
        if (onUploadSuccess) {
          onUploadSuccess(result.data.coverImage)
        }
      } else {
        throw new Error(result.message || '上传失败')
      }
    } catch (error) {
      console.error('上传封面失败:', error)
      Message.error(error.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  /**
   * 移除封面
   */
  const handleRemove = () => {
    setPreviewImage(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ width: '100%' }}>
      {previewImage ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #E5E6EB',
            background: '#F7F8FA'
          }}
        >
          <Image
            src={previewImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            alt="封面预览"
            preview={true}
          />
          
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 8
            }}
          >
            <Button
              size="small"
              icon={<IconDelete />}
              onClick={handleRemove}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none'
              }}
            >
              移除
            </Button>
          </div>
        </div>
      ) : (
        <Upload
          accept="image/jpeg,image/jpg,image/png,image/webp"
          beforeUpload={handleFileSelect}
          showUploadList={false}
        >
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              border: '2px dashed #E5E6EB',
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: '#F7F8FA',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#165DFF'
              e.currentTarget.style.background = '#F2F3F5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E5E6EB'
              e.currentTarget.style.background = '#F7F8FA'
            }}
          >
            <div style={{ fontSize: 48, color: '#165DFF', marginBottom: 16 }}>
              <IconCamera />
            </div>
            <div style={{ fontSize: 14, color: '#1D2129', marginBottom: 8 }}>
              点击上传封面图片
            </div>
            <div style={{ fontSize: 12, color: '#86909C' }}>
              支持 JPG, PNG, WebP 格式，建议尺寸 16:9，最大 5MB
            </div>
          </div>
        </Upload>
      )}

      {selectedFile && !currentCover && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={handleRemove}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              icon={<IconUpload />}
            >
              {uploading ? '上传中...' : '确认上传'}
            </Button>
          </Space>
        </div>
      )}

      {selectedFile && currentCover && (
        <div style={{ marginTop: 16 }}>
          <Button
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            icon={<IconUpload />}
            long
          >
            {uploading ? '上传中...' : '更新封面'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default CoverUploader

