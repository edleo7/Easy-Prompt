import React, { useRef, useEffect, useState } from 'react'
import { Card, Button, Space, Typography, Modal, Tag, Tooltip } from '@arco-design/web-react'
import { IconEye, IconEdit, IconDelete, IconPlus, IconThunderbolt } from '@arco-design/web-react/icon'
import CanvasEditor from './CanvasEditor'

const { Title, Text } = Typography

export default function CanvasThumbnail({ 
  canvasData = null,
  memories = [],
  knowledgeBases = [],
  onSave,
  onDelete,
  onCreate
}) {
  const [editorVisible, setEditorVisible] = useState(false)
  const [editingData, setEditingData] = useState(null)

  // 渲染缩略图
  const renderThumbnail = () => {
    if (!canvasData) {
      return (
        <div style={{
          height: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          cursor: 'pointer'
        }}
        onClick={() => {
          setEditingData(null)
          setEditorVisible(true)
        }}
        >
          <IconPlus style={{ fontSize: 32, color: '#999', marginBottom: 8 }} />
          <Text type="secondary">点击创建新画布</Text>
        </div>
      )
    }

    return (
      <div style={{
        height: '200px',
        position: 'relative',
        backgroundColor: '#fafafa',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={() => {
        setEditingData(canvasData)
        setEditorVisible(true)
      }}
      >
        {/* 缩略图画布 */}
        <div style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `scale(${200 / 800})`,
          transformOrigin: 'top left'
        }}>
          {/* 背景网格 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '800px',
            height: '600px',
            backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          
          {/* 节点 */}
          {canvasData.nodes?.map(node => {
            const nodeType = getNodeType(node.type)
            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  backgroundColor: nodeType?.color || '#1890ff',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  color: 'white',
                  textAlign: 'center',
                  overflow: 'hidden'
                }}
              >
                {node.label}
              </div>
            )
          })}
          
          {/* 连接线 */}
          {canvasData.connections?.map(connection => {
            const fromNode = canvasData.nodes?.find(n => n.id === connection.from)
            const toNode = canvasData.nodes?.find(n => n.id === connection.to)
            
            if (!fromNode || !toNode) return null

            const startX = fromNode.x + fromNode.width / 2
            const startY = fromNode.y + fromNode.height / 2
            const endX = toNode.x + toNode.width / 2
            const endY = toNode.y + toNode.height / 2

            return (
              <svg
                key={connection.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '800px',
                  height: '600px',
                  pointerEvents: 'none'
                }}
              >
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#666"
                  strokeWidth="1"
                />
              </svg>
            )
          })}
        </div>
        
        {/* 画布信息覆盖层 */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12
        }}>
          {canvasData.nodes?.length || 0} 节点, {canvasData.connections?.length || 0} 连接
        </div>
      </div>
    )
  }

  const getNodeType = (type) => {
    const nodeTypes = {
      memory: { color: '#1890ff', label: '记忆' },
      knowledge: { color: '#52c41a', label: '知识' },
      prompt: { color: '#faad14', label: 'Prompt' },
      variable: { color: '#722ed1', label: '变量' },
      logic: { color: '#f5222d', label: '逻辑' }
    }
    return nodeTypes[type] || { color: '#1890ff', label: '未知' }
  }

  const handleSave = (data) => {
    if (onSave) {
      onSave(data)
    }
    setEditorVisible(false)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    }
  }

  return (
    <>
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <Title heading={6} style={{ margin: 0, marginBottom: 4 }}>
              {canvasData ? '画布编辑器' : '新建画布'}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {canvasData ? `最后更新: ${new Date(canvasData.timestamp).toLocaleString()}` : '点击创建可视化画布'}
            </Text>
          </div>
          <Space>
            <Tooltip content="查看/编辑画布">
              <Button 
                type="primary" 
                icon={<IconEye />}
                onClick={() => {
                  setEditingData(canvasData)
                  setEditorVisible(true)
                }}
              >
                打开画布
              </Button>
            </Tooltip>
            {canvasData && (
              <Tooltip content="删除画布">
                <Button 
                  type="text" 
                  icon={<IconDelete />}
                  onClick={handleDelete}
                  style={{ color: '#f53f3f' }}
                />
              </Tooltip>
            )}
          </Space>
        </div>
        
        {renderThumbnail()}
        
        {/* 画布统计信息 */}
        {canvasData && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Tag color="blue">{canvasData.nodes?.length || 0} 个节点</Tag>
            <Tag color="green">{canvasData.connections?.length || 0} 条连接</Tag>
            <Tag color="orange">缩放: {Math.round((canvasData.zoom || 1) * 100)}%</Tag>
          </div>
        )}
      </Card>

      {/* 画布编辑器模态框 */}
      <Modal
        title="画布编辑器"
        visible={editorVisible}
        onCancel={() => setEditorVisible(false)}
        footer={null}
        style={{ width: '95vw', height: '95vh' }}
        bodyStyle={{ padding: 0, height: 'calc(95vh - 100px)' }}
      >
        <CanvasEditor
          memories={memories}
          knowledgeBases={knowledgeBases}
          onSave={handleSave}
          onClose={() => setEditorVisible(false)}
          initialData={editingData}
        />
      </Modal>
    </>
  )
}
