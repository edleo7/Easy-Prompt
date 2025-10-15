/**
 * 知识库摘要组件
 * 显示知识库的智能摘要和关键信息
 */

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Spin, 
  Empty, 
  Divider,
  Progress,
  Tooltip,
  Modal
} from '@arco-design/web-react'
import { 
  IconFile, 
  IconClockCircle, 
  IconUser, 
  IconRefresh,
  IconBulb,
  IconUp,
  IconTag,
  IconEye,
  IconDownload
} from '@arco-design/web-react/icon'
import { formatDate, formatFileSize } from '../../utils/format'

const { Text, Title, Paragraph } = Typography

const KnowledgeSummary = ({ 
  kbId, 
  kbName,
  onRefresh,
  className = '' 
}) => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [stats, setStats] = useState(null)

  // 加载摘要数据
  const loadSummary = async () => {
    setLoading(true)
    try {
      // 这里应该调用API获取摘要
      const response = await fetch(`/api/v1/kb/${kbId}/summary`)
      const data = await response.json()
      
      if (data.code === 200) {
        setSummary(data.data)
      }
    } catch (error) {
      console.error('加载摘要失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 生成新摘要
  const generateSummary = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/summary/generate`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.code === 200) {
        setSummary(data.data)
        if (onRefresh) {
          onRefresh()
        }
      }
    } catch (error) {
      console.error('生成摘要失败:', error)
    } finally {
      setGenerating(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/stats`)
      const data = await response.json()
      
      if (data.code === 200) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  }

  useEffect(() => {
    loadSummary()
    loadStats()
  }, [kbId])

  // 渲染统计卡片
  const renderStatCard = (title, value, icon, color = '#1890ff') => (
    <div style={{ 
      textAlign: 'center', 
      padding: '16px 12px',
      backgroundColor: '#fafafa',
      borderRadius: 8,
      border: '1px solid #f0f0f0'
    }}>
      <div style={{ fontSize: 24, color, marginBottom: 8 }}>
        {icon}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        {value}
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {title}
      </Text>
    </div>
  )

  // 渲染关键词
  const renderKeywords = (keywords) => {
    if (!keywords || keywords.length === 0) return null
    
    return (
      <div>
        <Title level={5} style={{ marginBottom: 8 }}>
          <IconTag style={{ marginRight: 8 }} />
          关键词
        </Title>
        <Space wrap>
          {keywords.map((keyword, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
              {keyword}
            </Tag>
          ))}
        </Space>
      </div>
    )
  }

  // 渲染主要话题
  const renderMainTopics = (topics) => {
    if (!topics || topics.length === 0) return null
    
    return (
      <div>
        <Title level={5} style={{ marginBottom: 8 }}>
          <IconUp style={{ marginRight: 8 }} />
          主要话题
        </Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          {topics.map((topic, index) => (
            <div key={index} style={{ 
              padding: '8px 12px',
              backgroundColor: '#f7f8fa',
              borderRadius: 6,
              border: '1px solid #e5e6eb'
            }}>
              <Text style={{ fontWeight: 500 }}>{topic.title}</Text>
              {topic.description && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {topic.description}
                  </Text>
                </div>
              )}
            </div>
          ))}
        </Space>
      </div>
    )
  }

  return (
    <div className={`knowledge-summary ${className}`}>
      {/* 统计信息 */}
      {stats && (
        <Card 
          title="知识库统计" 
          style={{ marginBottom: 16 }}
          extra={
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={loadStats}
            >
              刷新
            </Button>
          }
        >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 16
          }}>
            {renderStatCard('文档数量', stats.fileCount || 0, <IconFile />)}
            {renderStatCard('文件夹', stats.folderCount || 0, <IconTag />)}
            {renderStatCard('总大小', formatFileSize(stats.totalSize || 0), <IconDownload />)}
            {renderStatCard('最后更新', formatDate(stats.lastUpdated), <IconClockCircle />)}
          </div>
        </Card>
      )}

      {/* 智能摘要 */}
      <Card
        title={
          <Space>
            <IconBulb style={{ color: '#faad14' }} />
            <span>智能摘要</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="outline"
              size="small"
              icon={<IconRefresh />}
              onClick={generateSummary}
              loading={generating}
            >
              重新生成
            </Button>
            <Button
              type="text"
              size="small"
              icon={<IconRefresh />}
              onClick={loadSummary}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">加载摘要中...</Text>
            </div>
          </div>
        ) : summary ? (
          <div>
            {/* 摘要内容 */}
            {summary.content && (
              <div style={{ marginBottom: 24 }}>
                <Title level={5} style={{ marginBottom: 12 }}>
                  <IconEye style={{ marginRight: 8 }} />
                  内容摘要
                </Title>
                <Paragraph style={{ 
                  lineHeight: 1.6,
                  backgroundColor: '#f7f8fa',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e5e6eb'
                }}>
                  {summary.content}
                </Paragraph>
              </div>
            )}

            {/* 关键词 */}
            {renderKeywords(summary.keywords)}

            {/* 主要话题 */}
            {summary.mainTopics && summary.mainTopics.length > 0 && (
              <>
                <Divider />
                {renderMainTopics(summary.mainTopics)}
              </>
            )}

            {/* 生成信息 */}
            <Divider />
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#86909c',
              fontSize: 12
            }}>
              <Text type="secondary">
                生成时间: {formatDate(summary.generatedAt)}
              </Text>
              <Text type="secondary">
                基于 {summary.documentCount || 0} 个文档
              </Text>
            </div>
          </div>
        ) : (
          <Empty
            description="暂无摘要信息"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<IconBulb />}
              onClick={generateSummary}
              loading={generating}
            >
              生成摘要
            </Button>
          </Empty>
        )}

        {/* 生成进度 */}
        {generating && (
          <Modal
            title="正在生成摘要"
            visible={generating}
            footer={null}
            closable={false}
            style={{ top: '30%' }}
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Spin size={40} />
              <div style={{ marginTop: 16 }}>
                <Text>AI正在分析知识库内容...</Text>
              </div>
              <div style={{ marginTop: 16, width: '100%' }}>
                <Progress 
                  percent={75} 
                  status="active"
                  showText={false}
                />
              </div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                这可能需要几分钟时间
              </Text>
            </div>
          </Modal>
        )}
      </Card>
    </div>
  )
}

export default KnowledgeSummary
