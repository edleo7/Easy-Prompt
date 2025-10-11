import React, { useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import * as d3 from 'd3'
import { Card, Button, Space, Tag, Typography, Message, Modal } from '@arco-design/web-react'
import { IconRefresh, IconThunderbolt } from '@arco-design/web-react/icon'
import CanvasEditor from './CanvasEditor'

const { Title, Text } = Typography

export default function KnowledgeGraphFixed({ 
  memories = [], 
  knowledgeBases = [],
  onUpdateMemory, 
  onDeleteMemory, 
  onAddConnection 
}) {
  const graphRef = useRef()
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeTab, setActiveTab] = useState('auto') // auto, canvas
  const [canvasData, setCanvasData] = useState(null)
  const [canvasEditorVisible, setCanvasEditorVisible] = useState(false)
  const [graphSettings, setGraphSettings] = useState({
    nodeSize: 8,
    linkDistance: 100,
    chargeStrength: -300,
    showLabels: true
  })

  // 生成图谱数据
  useEffect(() => {
    generateGraphData()
  }, [memories])

  const generateGraphData = () => {
    console.log('Generating graph data for memories:', memories)
    
    const nodes = memories.map((memory, index) => ({
      id: memory.id || `memory-${index}`,
      name: memory.title || memory.content?.substring(0, 15) + '...' || `记忆 ${index + 1}`,
      content: memory.content || '',
      type: memory.type || 'memory',
      importance: memory.weight || 'medium', // 使用weight字段
      tags: Array.isArray(memory.tags) ? memory.tags : (typeof memory.tags === 'string' ? JSON.parse(memory.tags || '[]') : []),
      group: memory.scope || 'USER',
      size: 8,
      color: getNodeColor(memory.weight) // 使用weight字段
    }))

    // 生成简单的连接关系
    const links = []
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'sequence',
        color: '#1890ff'
      })
    }

    console.log('Generated graph data:', { nodes, links })
    setGraphData({ nodes, links })
  }

  const getNodeColor = (importance) => {
    const colorMap = {
      'HIGH': '#ff4d4f',
      'NORMAL': '#faad14', 
      'LOW': '#52c41a',
      'high': '#ff4d4f',
      'medium': '#faad14', 
      'low': '#52c41a'
    }
    return colorMap[importance] || '#1890ff'
  }

  const handleRefreshGraph = () => {
    generateGraphData()
    Message.success('图谱已刷新')
  }

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node)
    setSelectedNode(node)
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

          {/* 图谱可视化 */}
          <div style={{ height: '500px', width: '100%' }}>
            {graphData.nodes.length > 0 ? (
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
            ) : (
              <div style={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#999'
              }}>
                <div style={{ fontSize: 16, marginBottom: 8 }}>暂无记忆数据</div>
                <div style={{ fontSize: 14 }}>请先添加一些记忆内容</div>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card style={{ flex: 1, borderRadius: 12, padding: 24 }}>
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#999'
          }}>
            <IconThunderbolt style={{ fontSize: 48, marginBottom: 16, color: '#1890ff' }} />
            <div style={{ fontSize: 18, marginBottom: 8 }}>画布编辑器</div>
            <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 400, marginBottom: 24 }}>
              可视化画布编辑器，支持类似扣子/Dify/Figma的拖拽式节点编辑
            </div>
            <Button 
              type="primary" 
              size="large"
              icon={<IconThunderbolt />}
              onClick={() => setCanvasEditorVisible(true)}
            >
              打开画布编辑器
            </Button>
          </div>
        </Card>
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
          </div>
        </Card>
      )}

      {/* 画布编辑器模态框 */}
      <Modal
        title="画布编辑器"
        visible={canvasEditorVisible}
        onCancel={() => setCanvasEditorVisible(false)}
        footer={null}
        style={{ width: '95vw', height: '95vh' }}
        bodyStyle={{ padding: 0, height: 'calc(95vh - 100px)' }}
      >
        <CanvasEditor
          memories={memories}
          knowledgeBases={knowledgeBases}
          onSave={(data) => {
            setCanvasData(data)
            setCanvasEditorVisible(false)
            Message.success('画布已保存')
          }}
          onClose={() => setCanvasEditorVisible(false)}
          initialData={canvasData}
        />
      </Modal>
    </div>
  )
}
