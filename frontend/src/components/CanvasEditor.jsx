import React, { useRef, useEffect, useState } from 'react'
import { Card, Button, Space, Typography, Modal, Input, Select, Message, Tooltip, Divider, Tag } from '@arco-design/web-react'
import { 
  IconPlus, 
  IconDelete, 
  IconEdit, 
  IconEye, 
  IconRefresh, 
  IconSave, 
  IconUndo, 
  IconRedo,
  IconZoomIn,
  IconZoomOut,
  IconDragDotVertical,
  IconLink,
  IconThunderbolt,
  IconBook,
  IconFile
} from '@arco-design/web-react/icon'

const { Title, Text } = Typography

export default function CanvasEditor({ 
  memories = [], 
  knowledgeBases = [],
  onSave,
  onClose,
  initialData = null
}) {
  const canvasRef = useRef()
  const [nodes, setNodes] = useState([])
  const [connections, setConnections] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStart, setConnectionStart] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [tool, setTool] = useState('select') // select, add, connect, pan
  const [nodeModalVisible, setNodeModalVisible] = useState(false)
  const [editingNode, setEditingNode] = useState(null)

  // 节点类型定义
  const nodeTypes = {
    memory: { label: '记忆节点', icon: IconBook, color: '#1890ff' },
    knowledge: { label: '知识节点', icon: IconFile, color: '#52c41a' },
    prompt: { label: 'Prompt节点', icon: IconThunderbolt, color: '#faad14' },
    variable: { label: '变量节点', icon: IconEdit, color: '#722ed1' },
    logic: { label: '逻辑节点', icon: IconLink, color: '#f5222d' }
  }

  // 初始化画布数据
  useEffect(() => {
    if (initialData) {
      setNodes(initialData.nodes || [])
      setConnections(initialData.connections || [])
    } else {
      // 从记忆和知识库创建初始节点
      const initialNodes = []
      
      memories.forEach((memory, index) => {
        initialNodes.push({
          id: `memory-${memory.id}`,
          type: 'memory',
          label: memory.title || memory.content?.substring(0, 20) + '...',
          content: memory.content,
          x: 100 + (index % 3) * 200,
          y: 100 + Math.floor(index / 3) * 150,
          width: 120,
          height: 80,
          data: memory
        })
      })

      knowledgeBases.forEach((kb, index) => {
        initialNodes.push({
          id: `knowledge-${kb.id}`,
          type: 'knowledge',
          label: kb.title || kb.name,
          content: kb.content,
          x: 100 + (index % 3) * 200,
          y: 300 + Math.floor(index / 3) * 150,
          width: 120,
          height: 80,
          data: kb
        })
      })

      setNodes(initialNodes)
    }
  }, [memories, knowledgeBases, initialData])

  // 画布鼠标事件处理
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom

    if (tool === 'add') {
      // 添加新节点
      const newNode = {
        id: `node-${Date.now()}`,
        type: 'prompt',
        label: '新节点',
        content: '',
        x: x - 60,
        y: y - 40,
        width: 120,
        height: 80,
        data: null
      }
      setNodes(prev => [...prev, newNode])
      setEditingNode(newNode)
      setNodeModalVisible(true)
    } else if (tool === 'connect') {
      // 开始连接
      const clickedNode = getNodeAtPosition(x, y)
      if (clickedNode) {
        setIsConnecting(true)
        setConnectionStart(clickedNode.id)
      }
    } else if (tool === 'select') {
      // 选择节点
      const clickedNode = getNodeAtPosition(x, y)
      if (clickedNode) {
        setSelectedNode(clickedNode)
        setIsDragging(true)
        setDragStart({ x: x - clickedNode.x, y: y - clickedNode.y })
      } else {
        setSelectedNode(null)
      }
    }
  }

  const handleCanvasMouseMove = (e) => {
    if (isDragging && selectedNode) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom

      setNodes(prev => prev.map(node => 
        node.id === selectedNode.id 
          ? { ...node, x: x - dragStart.x, y: y - dragStart.y }
          : node
      ))
    }
  }

  const handleCanvasMouseUp = (e) => {
    if (isConnecting && connectionStart) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / zoom
      const y = (e.clientY - rect.top - pan.y) / zoom
      const targetNode = getNodeAtPosition(x, y)

      if (targetNode && targetNode.id !== connectionStart) {
        const newConnection = {
          id: `conn-${Date.now()}`,
          from: connectionStart,
          to: targetNode.id,
          type: 'default',
          label: ''
        }
        setConnections(prev => [...prev, newConnection])
      }
    }

    setIsDragging(false)
    setIsConnecting(false)
    setConnectionStart(null)
  }

  // 获取指定位置的节点
  const getNodeAtPosition = (x, y) => {
    return nodes.find(node => 
      x >= node.x && x <= node.x + node.width &&
      y >= node.y && y <= node.y + node.height
    )
  }

  // 渲染节点
  const renderNode = (node) => {
    const nodeType = nodeTypes[node.type] || nodeTypes.prompt
    const IconComponent = nodeType.icon || IconThunderbolt
    const isSelected = selectedNode?.id === node.id

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
          border: isSelected ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
          borderRadius: 8,
          padding: 8,
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left'
        }}
        onClick={() => setSelectedNode(node)}
        onDoubleClick={() => {
          setEditingNode(node)
          setNodeModalVisible(true)
        }}
      >
        <IconComponent style={{ fontSize: 16, color: 'white', marginBottom: 4 }} />
        <div style={{ 
          color: 'white', 
          fontSize: 12, 
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%'
        }}>
          {node.label}
        </div>
      </div>
    )
  }

  // 渲染连接线
  const renderConnection = (connection) => {
    const fromNode = nodes.find(n => n.id === connection.from)
    const toNode = nodes.find(n => n.id === connection.to)
    
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
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        <defs>
          <marker
            id={`arrow-${connection.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#666" />
          </marker>
        </defs>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#666"
          strokeWidth="2"
          markerEnd={`url(#arrow-${connection.id})`}
        />
      </svg>
    )
  }

  // 保存画布
  const handleSave = () => {
    const canvasData = {
      nodes,
      connections,
      zoom,
      pan,
      timestamp: new Date().toISOString()
    }
    
    if (onSave) {
      onSave(canvasData)
    }
    
    Message.success('画布已保存')
  }

  // 节点编辑
  const handleNodeEdit = (values) => {
    if (editingNode) {
      setNodes(prev => prev.map(node => 
        node.id === editingNode.id 
          ? { ...node, ...values }
          : node
      ))
    }
    setNodeModalVisible(false)
    setEditingNode(null)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title heading={5} style={{ margin: 0, marginBottom: 8 }}>画布编辑器</Title>
            <Text type="secondary">自由编辑节点和逻辑链条</Text>
          </div>
          <Space>
            <Button icon={<IconSave />} onClick={handleSave}>
              保存
            </Button>
            <Button onClick={onClose}>
              关闭
            </Button>
          </Space>
        </div>
        
        <Divider style={{ margin: '16px 0' }} />
        
        {/* 工具选择 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Text>工具:</Text>
          <Space>
            <Tooltip content="选择工具">
              <Button 
                type={tool === 'select' ? 'primary' : 'outline'}
                icon={<IconDragDotVertical />}
                onClick={() => setTool('select')}
              />
            </Tooltip>
            <Tooltip content="添加节点">
              <Button 
                type={tool === 'add' ? 'primary' : 'outline'}
                icon={<IconPlus />}
                onClick={() => setTool('add')}
              />
            </Tooltip>
            <Tooltip content="连接节点">
              <Button 
                type={tool === 'connect' ? 'primary' : 'outline'}
                icon={<IconLink />}
                onClick={() => setTool('connect')}
              />
            </Tooltip>
            <Tooltip content="平移画布">
              <Button 
                type={tool === 'pan' ? 'primary' : 'outline'}
                icon={<IconDragDotVertical />}
                onClick={() => setTool('pan')}
              />
            </Tooltip>
          </Space>
          
          <Divider type="vertical" />
          
          {/* 缩放控制 */}
          <Space>
            <Button icon={<IconZoomOut />} onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} />
            <Text>{Math.round(zoom * 100)}%</Text>
            <Button icon={<IconZoomIn />} onClick={() => setZoom(Math.min(2, zoom + 0.1))} />
          </Space>
        </div>
      </Card>

      {/* 画布区域 */}
      <Card style={{ flex: 1, borderRadius: 12, padding: 0, position: 'relative' }}>
        <div
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#fafafa',
            backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            cursor: tool === 'add' ? 'crosshair' : tool === 'connect' ? 'pointer' : 'default'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* 连接线 */}
          {connections.map(renderConnection)}
          
          {/* 节点 */}
          {nodes.map(renderNode)}
          
          {/* 连接预览 */}
          {isConnecting && connectionStart && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <svg style={{ width: '100%', height: '100%' }}>
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={0}
                  stroke="#1890ff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            </div>
          )}
        </div>
      </Card>

      {/* 节点编辑模态框 */}
      <Modal
        title="编辑节点"
        visible={nodeModalVisible}
        onCancel={() => setNodeModalVisible(false)}
        footer={null}
        style={{ width: 600 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>节点类型: </Text>
          <Select
            value={editingNode?.type}
            onChange={(value) => setEditingNode(prev => ({ ...prev, type: value }))}
            style={{ width: 200 }}
          >
            {Object.entries(nodeTypes).map(([type, config]) => (
              <Select.Option key={type} value={type}>
                {config.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text>节点标签: </Text>
          <Input
            value={editingNode?.label}
            onChange={(value) => setEditingNode(prev => ({ ...prev, label: value }))}
            placeholder="输入节点标签"
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text>节点内容: </Text>
          <Input.TextArea
            value={editingNode?.content}
            onChange={(value) => setEditingNode(prev => ({ ...prev, content: value }))}
            placeholder="输入节点内容"
            rows={4}
          />
        </div>
        
        <Space>
          <Button type="primary" onClick={() => handleNodeEdit(editingNode)}>
            保存
          </Button>
          <Button onClick={() => setNodeModalVisible(false)}>
            取消
          </Button>
        </Space>
      </Modal>
    </div>
  )
}
