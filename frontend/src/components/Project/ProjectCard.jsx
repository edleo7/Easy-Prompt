import React from 'react'
import { Card, Typography, Tag, Space, Button, Dropdown, Menu, Avatar } from '@arco-design/web-react'
import { IconMore, IconEdit, IconDelete, IconEye, IconCopy, IconCalendar, IconUser } from '@arco-design/web-react/icon'
import { formatDateTime } from '../../utils/format'

const { Text, Paragraph } = Typography

export default function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  loading = false 
}) {
  const { 
    id, 
    name, 
    description, 
    status, 
    tags, 
    coverImage, 
    promptCount = 0,
    lastAccessedAt,
    createdAt,
    updatedAt,
    workspace
  } = project

  // 解析标签
  const projectTags = tags ? JSON.parse(tags) : []
  
  // 状态颜色映射
  const statusColorMap = {
    draft: 'gray',
    active: 'green',
    completed: 'blue',
    archived: 'orange'
  }

  // 状态文本映射
  const statusTextMap = {
    draft: '草稿',
    active: '进行中',
    completed: '已完成',
    archived: '已归档'
  }

  // 操作菜单
  const handleMenuClick = (key) => {
    switch (key) {
      case 'edit':
        onEdit?.(project)
        break
      case 'duplicate':
        onDuplicate?.(project)
        break
      case 'delete':
        onDelete?.(project)
        break
      case 'view':
        onView?.(project)
        break
    }
  }

  const menu = (
    <Menu onClickMenuItem={handleMenuClick}>
      <Menu.Item key="view">
        <IconEye />
        查看详情
      </Menu.Item>
      <Menu.Item key="edit">
        <IconEdit />
        编辑项目
      </Menu.Item>
      <Menu.Item key="duplicate">
        <IconCopy />
        复制项目
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="delete" style={{ color: 'var(--color-danger-6)' }}>
        <IconDelete />
        删除项目
      </Menu.Item>
    </Menu>
  )

  return (
    <Card
      hoverable
      loading={loading}
      style={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out'
      }}
      onClick={() => onView?.(project)}
      cover={
        coverImage ? (
          <div style={{ height: 160, overflow: 'hidden' }}>
            <img
              src={coverImage}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ) : (
          <div style={{ 
            height: 160, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold'
          }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )
      }
      actions={[
        <Dropdown droplist={menu} trigger="click" position="br">
          <Button 
            type="text" 
            icon={<IconMore />}
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text ellipsis={{ showTooltip: true }} style={{ fontWeight: 600, fontSize: 16 }}>
              {name}
            </Text>
            <Tag color={statusColorMap[status] || 'gray'} size="small">
              {statusTextMap[status] || status}
            </Tag>
          </div>
        }
        description={
          <div style={{ marginTop: 8 }}>
            {description && (
              <Paragraph 
                ellipsis={{ rows: 2, showTooltip: true }} 
                style={{ marginBottom: 12, color: 'var(--color-text-2)' }}
              >
                {description}
              </Paragraph>
            )}
            
            {/* 标签 */}
            {projectTags.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Space wrap>
                  {projectTags.slice(0, 3).map((tag, index) => (
                    <Tag key={index} size="small" color="blue">
                      {tag}
                    </Tag>
                  ))}
                  {projectTags.length > 3 && (
                    <Tag size="small" color="gray">
                      +{projectTags.length - 3}
                    </Tag>
                  )}
                </Space>
              </div>
            )}

            {/* 统计信息 */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--color-text-3)'
            }}>
              <Space>
                <IconUser />
                <Text>{promptCount} 个Prompt</Text>
              </Space>
              {workspace && (
                <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 100 }}>
                  {workspace.name}
                </Text>
              )}
            </div>

            {/* 时间信息 */}
            <div style={{ 
              marginTop: 8,
              fontSize: 12,
              color: 'var(--color-text-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Space>
                <IconCalendar />
                <Text>创建于 {formatDateTime(createdAt)}</Text>
              </Space>
              {lastAccessedAt && (
                <Text>最后访问 {formatDateTime(lastAccessedAt)}</Text>
              )}
            </div>
          </div>
        }
      />
    </Card>
  )
}
