import React, { useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import * as d3 from 'd3'
import { Card, Button, Space, Tag, Typography, Modal, Input, Select, Message, Tabs } from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconEye, IconRefresh, IconThunderbolt } from '@arco-design/web-react/icon'
import CanvasThumbnail from './CanvasThumbnail'

const { Title, Text } = Typography

export default function KnowledgeGraph({ 
  memories = [], 
  knowledgeBases = [],
  onUpdateMemory, 
  onDeleteMemory, 
  onAddConnection 
}) {
  const graphRef = useRef()
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [connectionModalVisible, setConnectionModalVisible] = useState(false)
  const [newConnection, setNewConnection] = useState({ from: '', to: '', type: 'related' })
  const [graphSettings, setGraphSettings] = useState({
    nodeSize: 8,
    linkDistance: 100,
    chargeStrength: -300,
    showLabels: true
  })
  const [activeTab, setActiveTab] = useState('auto') // auto, canvas
  const [canvasData, setCanvasData] = useState(null)

  // 生成图谱数据
  useEffect(() => {
    generateGraphData()
  }, [memories])

  const generateGraphData = () => {
    console.log('Generating graph data for memories:', memories)
    
    const nodes = memories.map(memory => {
      // 处理标签数据
      let tags = []
      if (typeof memory.tags === 'string') {
        try {
          tags = JSON.parse(memory.tags)
        } catch (e) {
          tags = memory.tags.split(',').map(tag => tag.trim())
        }
      } else if (Array.isArray(memory.tags)) {
        tags = memory.tags
      }

      return {
        id: memory.id,
        name: memory.title || memory.content?.substring(0, 20) + '...',
        content: memory.content,
        type: memory.type || 'memory',
        importance: memory.importance || 'medium',
        tags: tags,
        group: memory.scope || 'USER',
        size: memory.importance === 'HIGH' ? 12 : memory.importance === 'NORMAL' ? 8 : 6,
        color: getNodeColor(memory.importance, memory.type)
      }
    })

    // 生成连接关系（基于标签相似性）
    const links = generateConnections(nodes)

    console.log('Generated graph data:', { nodes, links })
    setGraphData({ nodes, links })
  }

  const getNodeColor = (importance, type) => {
    const colorMap = {
      HIGH: '#ff4d4f',
      NORMAL: '#faad14', 
      LOW: '#52c41a',
      high: '#ff4d4f',
      medium: '#faad14', 
      low: '#52c41a'
    }
    return colorMap[importance] || '#1890ff'
  }

  const generateConnections = (nodes) => {
    const links = []
    
    // 基于标签相似性生成连接
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]
        
        // 计算标签相似度
        const similarity = calculateTagSimilarity(node1.tags, node2.tags)
        
        if (similarity > 0.2) { // 降低相似度阈值
          links.push({
            source: node1.id,
            target: node2.id,
            type: 'similarity',
            strength: similarity,
            color: similarity > 0.7 ? '#52c41a' : similarity > 0.5 ? '#faad14' : '#d9d9d9'
          })
        }
      }
    }
    
    // 如果没有连接，创建一些随机连接来确保图谱可见
    if (links.length === 0 && nodes.length > 1) {
      for (let i = 0; i < Math.min(3, nodes.length - 1); i++) {
        links.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'default',
          strength: 0.5,
          color: '#1890ff'
        })
      }
    }
    
    return links
  }

  const calculateTagSimilarity = (tags1, tags2) => {
    if (!tags1 || !tags2 || tags1.length === 0 || tags2.length === 0) return 0
    
    const set1 = new Set(tags1)
    const set2 = new Set(tags2)
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    
    return intersection.size / union.size
  }

  const handleNodeClick = (node) => {
    setSelectedNode(node)
  }

  const handleNodeRightClick = (node) => {
    setSelectedNode(node)
    // 可以添加右键菜单
  }

  const handleAddConnection = () => {
    if (!newConnection.from || !newConnection.to) {
      Message.warning('请选择连接的记忆')
      return
    }
    
    // 添加新连接
    const newLink = {
      source: newConnection.from,
      target: newConnection.to,
      type: newConnection.type,
      strength: 1,
      color: '#1890ff'
    }
    
    setGraphData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }))
    
    setConnectionModalVisible(false)
    setNewConnection({ from: '', to: '', type: 'related' })
    Message.success('连接添加成功')
  }

  const handleDeleteConnection = (link) => {
    setGraphData(prev => ({
      ...prev,
      links: prev.links.filter(l => l !== link)
    }))
    Message.success('连接删除成功')
  }

  const handleRefreshGraph = () => {
    generateGraphData()
    Message.success('图谱已刷新')
  }

  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.name
    const fontSize = 12/globalScale
    ctx.font = `${fontSize}px Sans-Serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillText(label, node.x, node.y + node.size + 10)
  }

  const linkCanvasObject = (link, ctx) => {
    const { source, target } = link
    const dx = target.x - source.x
    const dy = target.y - source.y
    const angle = Math.atan2(dy, dx)
    
    // 绘制箭头
    const arrowLength = 10
    const arrowAngle = Math.PI / 6
    
    ctx.strokeStyle = link.color || '#999'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)
    ctx.stroke()
    
    // 绘制箭头头部
    ctx.beginPath()
    ctx.moveTo(target.x, target.y)
    ctx.lineTo(
      target.x - arrowLength * Math.cos(angle - arrowAngle),
      target.y - arrowLength * Math.sin(angle - arrowAngle)
    )
    ctx.moveTo(target.x, target.y)
    ctx.lineTo(
      target.x - arrowLength * Math.cos(angle + arrowAngle),
      target.y - arrowLength * Math.sin(angle + arrowAngle)
    )
    ctx.stroke()
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 模式切换按钮 */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title heading={5} style={{ margin: 0, marginBottom: 8 }}>知识图谱</Title>
            <Text type="secondary">探索记忆之间的关系和连接</Text>
          </div>
          <Space>
            <Button 
              type={activeTab === 'auto' ? 'primary' : 'outline'}
              icon={<IconRefresh />}
              onClick={() => setActiveTab('auto')}
            >
              自动图谱
            </Button>
            <Button 
              type={activeTab === 'canvas' ? 'primary' : 'outline'}
              icon={<IconThunderbolt />}
              onClick={() => setActiveTab('canvas')}
            >
              画布编辑器
            </Button>
          </Space>
        </div>
      </Card>

      {/* 内容区域 */}
      {activeTab === 'auto' ? (
        <Card style={{ flex: 1, borderRadius: 12 }}>
          {/* 图谱统计 */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {graphData.nodes.length}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>记忆节点</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#52c41a' }}>
                  {graphData.links.length}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>连接关系</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#faad14' }}>
                  {Math.round(graphData.links.length / Math.max(graphData.nodes.length, 1) * 100) / 100}
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>平均连接度</div>
              </div>
            </div>
          </div>

          {/* 图谱设置 */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div>
              <Text>节点大小: </Text>
              <Input
                type="number"
                value={graphSettings.nodeSize}
                onChange={(value) => setGraphSettings(prev => ({ ...prev, nodeSize: parseInt(value) || 8 }))}
                style={{ width: 80 }}
              />
            </div>
            <div>
              <Text>连接距离: </Text>
              <Input
                type="number"
                value={graphSettings.linkDistance}
                onChange={(value) => setGraphSettings(prev => ({ ...prev, linkDistance: parseInt(value) || 100 }))}
                style={{ width: 80 }}
              />
            </div>
            <div>
              <Text>排斥力: </Text>
              <Input
                type="number"
                value={graphSettings.chargeStrength}
                onChange={(value) => setGraphSettings(prev => ({ ...prev, chargeStrength: parseInt(value) || -300 }))}
                style={{ width: 80 }}
              />
            </div>
          </div>

          {/* 图谱可视化 */}
          <div style={{ height: '500px', width: '100%' }}>
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeLabel="name"
              nodeColor="color"
              nodeVal="size"
              linkColor="color"
              linkWidth={2}
              linkDirectionalArrowLength={6}
              linkDirectionalArrowRelPos={1}
              onNodeClick={handleNodeClick}
              onNodeRightClick={handleNodeRightClick}
              nodeCanvasObject={nodeCanvasObject}
              linkCanvasObject={linkCanvasObject}
              cooldownTicks={100}
              onEngineStop={() => {
                if (graphRef.current) {
                  graphRef.current.zoomToFit(400)
                }
              }}
              width={800}
              height={500}
              backgroundColor="#fafafa"
              enableNodeDrag={true}
              enableZoomPanInteraction={true}
              d3AlphaDecay={0.01}
              d3VelocityDecay={0.3}
            />
          </div>
        </Card>
      ) : (
        <CanvasThumbnail
          canvasData={canvasData}
          memories={memories}
          knowledgeBases={knowledgeBases}
          onSave={(data) => setCanvasData(data)}
          onDelete={() => setCanvasData(null)}
          onCreate={() => setCanvasData(null)}
        />
      )}

      {/* 节点详情 */}
      {selectedNode && (
        <Card style={{ marginTop: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Title heading={6} style={{ margin: 0, marginBottom: 8 }}>
                {selectedNode.name}
              </Title>
              <Text type="secondary" style={{ marginBottom: 12, display: 'block' }}>
                {selectedNode.content}
              </Text>
              <div style={{ marginBottom: 8 }}>
                <Tag color={selectedNode.color} style={{ marginRight: 8 }}>
                  {selectedNode.importance === 'high' ? '高优先级' : 
                   selectedNode.importance === 'medium' ? '中优先级' : '低优先级'}
                </Tag>
                <Tag color="blue">{selectedNode.group}</Tag>
              </div>
              <div>
                {selectedNode.tags.map(tag => (
                  <Tag key={tag} size="small" style={{ marginRight: 4, marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
            <Space>
              <Button size="small" icon={<IconEdit />}>
                编辑
              </Button>
              <Button size="small" icon={<IconDelete />} status="danger">
                删除
              </Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 添加连接弹窗 */}
      <Modal
        title="添加记忆连接"
        visible={connectionModalVisible}
        onCancel={() => setConnectionModalVisible(false)}
        onOk={handleAddConnection}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>源记忆:</Text>
          <Select
            placeholder="选择源记忆"
            value={newConnection.from}
            onChange={(value) => setNewConnection(prev => ({ ...prev, from: value }))}
            style={{ width: '100%', marginTop: 8 }}
          >
            {memories.map(memory => (
              <Select.Option key={memory.id} value={memory.id}>
                {memory.title || memory.content?.substring(0, 30) + '...'}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text>目标记忆:</Text>
          <Select
            placeholder="选择目标记忆"
            value={newConnection.to}
            onChange={(value) => setNewConnection(prev => ({ ...prev, to: value }))}
            style={{ width: '100%', marginTop: 8 }}
          >
            {memories.map(memory => (
              <Select.Option key={memory.id} value={memory.id}>
                {memory.title || memory.content?.substring(0, 30) + '...'}
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div>
          <Text>连接类型:</Text>
          <Select
            placeholder="选择连接类型"
            value={newConnection.type}
            onChange={(value) => setNewConnection(prev => ({ ...prev, type: value }))}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Select.Option value="related">相关</Select.Option>
            <Select.Option value="similar">相似</Select.Option>
            <Select.Option value="dependent">依赖</Select.Option>
            <Select.Option value="conflict">冲突</Select.Option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
