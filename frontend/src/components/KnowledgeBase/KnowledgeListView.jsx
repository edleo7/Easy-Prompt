/**
 * 知识列表视图组件
 * 以列表形式展示文件和文件夹
 */

import React from 'react'
import { List, Avatar, Typography, Space, Tag, Button, Dropdown, Menu } from '@arco-design/web-react'
import { IconFile, IconFolder, IconMore, IconEdit, IconDelete, IconDownload, IconEye } from '@arco-design/web-react/icon'
import { formatFileSize, formatDate } from '../../utils/format'

const { Text, Title } = Typography

const KnowledgeListView = ({ 
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
      return <IconFolder style={{ fontSize: 20, color: '#1890ff' }} />
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
    
    return <span style={{ fontSize: 20 }}>{iconMap[ext] || '📎'}</span>
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

  return (
    <div className="knowledge-list-view">
      <List
        loading={loading}
        dataSource={items}
        render={(item, index) => (
          <List.Item
            key={item.id || index}
            className={`knowledge-list-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
            onClick={() => onItemClick(item)}
            style={{
              cursor: 'pointer',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: selectedItem?.id === item.id ? '#f7f8fa' : 'transparent',
              transition: 'background-color 0.2s'
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
          >
            <List.Item.Meta
              avatar={
                <Avatar size={40} style={{ backgroundColor: 'transparent' }}>
                  {getFileIcon(item)}
                </Avatar>
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Title level={5} style={{ margin: 0, flex: 1 }}>
                    {item.name}
                  </Title>
                  {getFileTypeTag(item)}
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
                    {item.type !== 'folder' && item.size && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        大小: {formatFileSize(item.size)}
                      </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      修改时间: {formatDate(item.updatedAt || item.createdAt)}
                    </Text>
                    {item.tags && item.tags.length > 0 && (
                      <Space size={4}>
                        {item.tags.slice(0, 3).map(tag => (
                          <Tag key={tag} size="small" color="gray">
                            {tag}
                          </Tag>
                        ))}
                        {item.tags.length > 3 && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            +{item.tags.length - 3}
                          </Text>
                        )}
                      </Space>
                    )}
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </div>
  )
}

export default KnowledgeListView
