/**
 * 智能定位组件
 * 提供快速定位和跳转功能
 */

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Avatar,
  Empty,
  Spin,
  Tooltip,
  Divider
} from '@arco-design/web-react'
import { 
  IconSearch, 
  IconFile, 
  IconFolder, 
  IconClockCircle, 
  IconUser,
  IconStar,
  IconHistory,
  IconUp,
  IconEye,
  IconDownload
} from '@arco-design/web-react/icon'
import { formatDate, formatFileSize } from '../../utils/format'

const { Text, Title } = Typography

const SmartLocator = ({ 
  kbId,
  onFileClick,
  onFolderClick,
  className = '' 
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentFiles, setRecentFiles] = useState([])
  const [popularFiles, setPopularFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // 加载最近访问文件
  const loadRecentFiles = async () => {
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/files/recent`)
      const data = await response.json()
      
      if (data.code === 200) {
        setRecentFiles(data.data || [])
      }
    } catch (error) {
      console.error('加载最近文件失败:', error)
    }
  }

  // 加载热门文件
  const loadPopularFiles = async () => {
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/files/popular`)
      const data = await response.json()
      
      if (data.code === 200) {
        setPopularFiles(data.data || [])
      }
    } catch (error) {
      console.error('加载热门文件失败:', error)
    }
  }

  // 智能搜索
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/search/smart?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.code === 200) {
        setSearchResults(data.data || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('智能搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索输入
  const handleSearchChange = (value) => {
    setSearchValue(value)
    if (value.trim()) {
      handleSearch(value)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }

  // 处理文件点击
  const handleFileClick = (file) => {
    if (onFileClick) {
      onFileClick(file)
    }
  }

  // 处理文件夹点击
  const handleFolderClick = (folder) => {
    if (onFolderClick) {
      onFolderClick(folder)
    }
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

  // 渲染搜索结果
  const renderSearchResults = () => {
    if (!showResults) return null

    return (
      <Card
        title="搜索结果"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">搜索中...</Text>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <List
            dataSource={searchResults}
            render={(item) => (
              <List.Item
                key={item.id}
                style={{ 
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => item.type === 'file' ? handleFileClick(item) : handleFolderClick(item)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar size={32} style={{ backgroundColor: 'transparent' }}>
                      {item.type === 'folder' ? <IconFolder /> : getFileIcon(item)}
                    </Avatar>
                  }
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ flex: 1 }}>{item.name}</Text>
                      <Tag color={item.type === 'folder' ? 'blue' : 'green'}>
                        {item.type === 'folder' ? '文件夹' : '文件'}
                      </Tag>
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      {item.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.description}
                        </Text>
                      )}
                      <Space size={16}>
                        {item.type === 'file' && item.size && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            大小: {formatFileSize(item.size)}
                          </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          修改: {formatDate(item.updatedAt || item.createdAt)}
                        </Text>
                        {item.tags && item.tags.length > 0 && (
                          <Space size={4}>
                            {item.tags.slice(0, 2).map(tag => (
                              <Tag key={tag} size="small" color="gray">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description="未找到相关文件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    )
  }

  // 渲染文件列表
  const renderFileList = (files, title, icon) => {
    if (!files || files.length === 0) return null

    return (
      <Card
        title={
          <Space>
            {icon}
            <span>{title}</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <List
          dataSource={files.slice(0, 5)} // 只显示前5个
          render={(file) => (
            <List.Item
              key={file.id}
              style={{ 
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0'
              }}
              onClick={() => handleFileClick(file)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar size={24} style={{ backgroundColor: 'transparent' }}>
                    {getFileIcon(file)}
                  </Avatar>
                }
                title={
                  <Text style={{ fontSize: 14 }}>{file.name}</Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(file.updatedAt || file.createdAt)}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
        {files.length > 5 && (
          <div style={{ 
            padding: '8px 16px', 
            textAlign: 'center',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#fafafa'
          }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              还有 {files.length - 5} 个文件...
            </Text>
          </div>
        )}
      </Card>
    )
  }

  useEffect(() => {
    loadRecentFiles()
    loadPopularFiles()
  }, [kbId])

  return (
    <div className={`smart-locator ${className}`}>
      {/* 搜索框 */}
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索文件、文件夹或输入自然语言描述..."
          prefix={<IconSearch />}
          value={searchValue}
          onChange={handleSearchChange}
          allowClear
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            <Button
              type="text"
              size="small"
              onClick={() => handleSearchChange('最新的文档')}
            >
              最新文档
            </Button>
            <Button
              type="text"
              size="small"
              onClick={() => handleSearchChange('图片文件')}
            >
              图片文件
            </Button>
            <Button
              type="text"
              size="small"
              onClick={() => handleSearchChange('PPT演示文稿')}
            >
              PPT文件
            </Button>
            <Button
              type="text"
              size="small"
              onClick={() => handleSearchChange('Excel表格')}
            >
              表格文件
            </Button>
          </Space>
        </div>
      </Card>

      {/* 搜索结果 */}
      {renderSearchResults()}

      {/* 最近访问 */}
      {renderFileList(recentFiles, '最近访问', <IconHistory />)}

      {/* 热门文件 */}
      {renderFileList(popularFiles, '热门文件', <IconUp />)}

      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="outline"
            icon={<IconFile />}
            onClick={() => handleSearchChange('PDF文档')}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            查看所有PDF文档
          </Button>
          <Button
            type="outline"
            icon={<IconFolder />}
            onClick={() => handleSearchChange('文件夹')}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            浏览文件夹结构
          </Button>
          <Button
            type="outline"
            icon={<IconClockCircle />}
            onClick={() => handleSearchChange('今天修改的')}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            今天修改的文件
          </Button>
          <Button
            type="outline"
            icon={<IconStar />}
            onClick={() => handleSearchChange('重要文档')}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            重要文档
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default SmartLocator
