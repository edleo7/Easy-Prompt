import React, { useRef, useEffect, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Card, Button, Space, Tag, Typography, Message } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'

const { Title, Text } = Typography

export default function KnowledgeGraphSimple({ 
  memories = [], 
  onUpdateMemory, 
  onDeleteMemory, 
  onAddConnection 
}) {
  const graphRef = useRef()
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })

  // 生成图谱数据
  useEffect(() => {
    generateGraphData()
  }, [memories])

  const generateGraphData = () => {
    console.log('Generating simple graph data for memories:', memories)
    
    const nodes = memories.map((memory, index) => ({
      id: memory.id || `memory-${index}`,
      name: memory.title || memory.content?.substring(0, 15) + '...' || `记忆 ${index + 1}`,
      content: memory.content || '',
      type: memory.type || 'memory',
      importance: memory.importance || 'medium',
      tags: Array.isArray(memory.tags) ? memory.tags : (memory.tags || '').split(',').map(t => t.trim()),
      group: memory.scope || 'USER',
      size: 8,
      color: getNodeColor(memory.importance)
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

    console.log('Generated simple graph data:', { nodes, links })
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
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title heading={5} style={{ margin: 0, marginBottom: 8 }}>知识图谱</Title>
            <Text type="secondary">探索记忆之间的关系和连接</Text>
          </div>
          <Space>
            <Button 
              icon={<IconRefresh />} 
              onClick={handleRefreshGraph}
            >
              刷新图谱
            </Button>
          </Space>
        </div>
        
        {/* 图谱统计 */}
        <div style={{ marginTop: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
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
          </div>
        </div>
      </Card>

      {/* 图谱可视化 */}
      <Card style={{ flex: 1, borderRadius: 12, padding: 0 }}>
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
    </div>
  )
}
