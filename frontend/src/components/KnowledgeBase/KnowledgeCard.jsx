import React, { useState } from 'react'
import { Card, Tag, Typography, Space, Dropdown, Menu, Avatar, Modal } from '@arco-design/web-react'
import { IconFolder, IconFile, IconMoreVertical, IconEdit, IconSettings, IconDelete, IconUser } from '@arco-design/web-react/icon'

const { Text, Paragraph } = Typography

export default function KnowledgeCard({ 
  knowledgeBase, 
  onEdit, 
  onSettings, 
  onDelete, 
  onClick 
}) {
  const [hovered, setHovered] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const {
    id,
    name,
    description,
    coverImage,
    tags = [],
    fileCount = 0,
    collaborators = [],
    updatedAt,
    workspace
  } = knowledgeBase

  // 生成默认封面色
  const getDefaultCoverColor = (id) => {
    const colors = ['#165dff', '#00b42a', '#ff7d00', '#f53f3f', '#722ed1', '#14c9c9']
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const defaultCoverColor = getDefaultCoverColor(id)

  // 操作菜单
  const dropList = (
    <Menu>
      <Menu.Item key="edit" onClick={() => onEdit?.(knowledgeBase)}>
        <Space>
          <IconEdit />
          编辑
        </Space>
      </Menu.Item>
      <Menu.Item key="settings" onClick={() => onSettings?.(knowledgeBase)}>
        <Space>
          <IconSettings />
          设置
        </Space>
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => setDeleteModalVisible(true)}>
        <Space>
          <IconDelete />
          删除
        </Space>
      </Menu.Item>
    </Menu>
  )

  const handleDelete = () => {
    onDelete?.(knowledgeBase)
    setDeleteModalVisible(false)
  }

  return (
    <>
      <Card
        hoverable
        style={{
          height: '100%',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.3s',
          position: 'relative'
        }}
        bodyStyle={{ padding: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onClick?.(knowledgeBase)}
      >
        {/* 封面图 */}
        <div 
          style={{
            height: '140px',
            background: coverImage 
              ? `url(${coverImage}) center/cover` 
              : `linear-gradient(135deg, ${defaultCoverColor}, ${defaultCoverColor}dd)`,
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* 分类标签 */}
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Tag color="blue" size="small">
              {workspace?.name || '企业公开'}
            </Tag>
          </div>

          {/* 操作按钮 */}
          {hovered && (
            <div 
              style={{ position: 'absolute', top: 12, right: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Dropdown droplist={dropList} position="br" trigger="click">
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <IconMoreVertical style={{ fontSize: 16, color: '#4e5969' }} />
                </div>
              </Dropdown>
            </div>
          )}

          {/* 如果没有封面图，显示图标 */}
          {!coverImage && (
            <IconFolder style={{ fontSize: 48, color: 'white', opacity: 0.6 }} />
          )}
        </div>

        {/* 内容区 */}
        <div style={{ padding: '16px' }}>
          {/* 标题 */}
          <Typography.Title heading={6} style={{ margin: '0 0 8px 0', fontSize: 16 }}>
            {name}
          </Typography.Title>

          {/* 描述 */}
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ 
              margin: '0 0 12px 0', 
              color: '#86909c',
              fontSize: 13,
              minHeight: 36
            }}
          >
            {description || '暂无描述'}
          </Paragraph>

          {/* 标签 */}
          {tags.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Space size="mini" wrap>
                {tags.slice(0, 3).map((tag, index) => (
                  <Tag key={index} size="small" color="arcoblue">
                    {tag}
                  </Tag>
                ))}
                {tags.length > 3 && (
                  <Tag size="small">+{tags.length - 3}</Tag>
                )}
              </Space>
            </div>
          )}

          {/* 底部统计信息 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: 12,
            borderTop: '1px solid #f2f3f5'
          }}>
            <Space size="large">
              <Space size={4}>
                <IconFile style={{ fontSize: 14, color: '#86909c' }} />
                <Text style={{ fontSize: 12, color: '#86909c' }}>
                  {fileCount} 篇
                </Text>
              </Space>
              {collaborators.length > 0 && (
                <Space size={4}>
                  <IconUser style={{ fontSize: 14, color: '#86909c' }} />
                  <Text style={{ fontSize: 12, color: '#86909c' }}>
                    {collaborators.length} 人
                  </Text>
                </Space>
              )}
            </Space>
            <Text style={{ fontSize: 11, color: '#c9cdd4' }}>
              {new Date(updatedAt).toLocaleDateString()}
            </Text>
          </div>
        </div>
      </Card>

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        visible={deleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ status: 'danger' }}
      >
        <p>确定要删除知识库 <strong>{name}</strong> 吗？</p>
        <p style={{ color: '#f53f3f', fontSize: 13 }}>
          此操作将永久删除该知识库及其所有文档，且无法恢复！
        </p>
      </Modal>
    </>
  )
}

