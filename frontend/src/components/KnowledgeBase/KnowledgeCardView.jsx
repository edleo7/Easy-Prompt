/**
 * 知识卡片视图组件
 * 以卡片网格形式展示文件和文件夹
 */

import React from 'react'
import { Card, Grid, Typography, Space, Tag, Button, Dropdown, Menu, Image } from '@arco-design/web-react'
import { IconFile, IconFolder, IconMore, IconEdit, IconDelete, IconDownload, IconEye } from '@arco-design/web-react/icon'
import { formatFileSize, formatDate } from '../../utils/format'

const { Text, Title } = Typography
const { Row, Col } = Grid

const KnowledgeCardView = ({ 
  items = [], 
  onItemClick, 
  onEdit, 
  onDelete, 
  onDownload,
  selectedItem,
  loading = false 
}) => {
  
  // 获取文件图标
  const getFileIcon = (item) => {
    if (item.type === 'folder') {
      return <IconFolder style={{ fontSize: 32, color: '#1890ff' }} />
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase()
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
    
    return <span style={{ fontSize: 32 }}>{iconMap[ext] || '📎'}</span>
  }

  // 获取文件类型标签
  const getFileTypeTag = (item) => {
    if (item.type === 'folder') {
      return <Tag color="blue">文件夹</Tag>
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase()
    const typeMap = {
      pdf: { color: 'red', text: 'PDF' },
      docx: { color: 'blue', text: 'Word' },
      doc: { color: 'blue', text: 'Word' },
      pptx: { color: 'orange', text: 'PPT' },
      ppt: { color: 'orange', text: 'PPT' },
      xlsx: { color: 'green', text: 'Excel' },
      xls: { color: 'green', text: 'Excel' },
      jpg: { color: 'purple', text: '图片' },
      jpeg: { color: 'purple', text: '图片' },
      png: { color: 'purple', text: '图片' },
      gif: { color: 'purple', text: '图片' },
      mp3: { color: 'cyan', text: '音频' },
      wav: { color: 'cyan', text: '音频' },
      mp4: { color: 'magenta', text: '视频' },
      mov: { color: 'magenta', text: '视频' },
      txt: { color: 'gray', text: '文本' },
      md: { color: 'gray', text: 'Markdown' }
    }
    
    const type = typeMap[ext] || { color: 'default', text: '文件' }
    return <Tag color={type.color}>{type.text}</Tag>
  }

  // 操作菜单
  const getActionMenu = (item) => (
    <Menu>
      <Menu.Item key="view" icon={<IconEye />} onClick={() => onItemClick(item)}>
        查看
      </Menu.Item>
      <Menu.Item key="edit" icon={<IconEdit />} onClick={() => onEdit(item)}>
        编辑
      </Menu.Item>
      {item.type !== 'folder' && (
        <Menu.Item key="download" icon={<IconDownload />} onClick={() => onDownload(item)}>
          下载
        </Menu.Item>
      )}
      <Menu.Item key="delete" icon={<IconDelete />} onClick={() => onDelete(item)}>
        删除
      </Menu.Item>
    </Menu>
  )

  // 渲染卡片内容
  const renderCard = (item, index) => (
    <Col key={item.id || index} xs={24} sm={12} md={8} lg={6} xl={4}>
      <Card
        className={`knowledge-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
        hoverable
        style={{
          height: '100%',
          border: selectedItem?.id === item.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
          transition: 'all 0.2s'
        }}
        bodyStyle={{
          padding: '16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        actions={[
          <Dropdown
            key="actions"
            droplist={getActionMenu(item)}
            trigger="click"
            position="br"
          >
            <Button
              type="text"
              icon={<IconMore />}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ]}
        onClick={() => onItemClick(item)}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          {getFileIcon(item)}
        </div>
        
        <div style={{ flex: 1, minHeight: 0 }}>
          <Title 
            level={5} 
            style={{ 
              margin: '0 0 8px 0', 
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={item.name}
          >
            {item.name}
          </Title>
          
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            {getFileTypeTag(item)}
          </div>
          
          {item.description && (
            <Text 
              type="secondary" 
              style={{ 
                fontSize: 12, 
                display: 'block',
                textAlign: 'center',
                marginBottom: 8,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={item.description}
            >
              {item.description}
            </Text>
          )}
          
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {item.type !== 'folder' && item.size && (
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                大小: {formatFileSize(item.size)}
              </Text>
            )}
            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
              {formatDate(item.updatedAt || item.createdAt)}
            </Text>
          </Space>
          
          {item.tags && item.tags.length > 0 && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <Space size={4} wrap>
                {item.tags.slice(0, 2).map(tag => (
                  <Tag key={tag} size="small" color="gray">
                    {tag}
                  </Tag>
                ))}
                {item.tags.length > 2 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    +{item.tags.length - 2}
                  </Text>
                )}
              </Space>
            </div>
          )}
        </div>
      </Card>
    </Col>
  )

  return (
    <div className="knowledge-card-view">
      <Row gutter={[16, 16]}>
        {items.map((item, index) => renderCard(item, index))}
      </Row>
    </div>
  )
}

export default KnowledgeCardView
