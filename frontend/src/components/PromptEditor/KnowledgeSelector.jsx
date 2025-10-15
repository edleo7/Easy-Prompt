/**
 * 知识库引用选择器组件
 * 用于在Prompt编辑器中引用知识库内容
 */

import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Input, 
  Button, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Avatar,
  Empty,
  Spin,
  Tabs,
  Card,
  Divider,
  Tooltip,
  Select
} from '@arco-design/web-react'
import { 
  IconSearch, 
  IconFile, 
  IconFolder, 
  IconClockCircle, 
  IconPlus,
  IconEye,
  IconCopy,
  IconBook,
  IconStorage
} from '@arco-design/web-react/icon'
import { formatDate, formatFileSize } from '../../utils/format'
import { getKnowledgeBases, getKnowledgeBaseDetail } from '../../services/knowledgeBase'

const { Text, Title } = Typography
const TabPane = Tabs.TabPane
const Option = Select.Option

const KnowledgeSelector = ({ 
  visible, 
  onClose, 
  onSelect,
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState('search')
  const [searchValue, setSearchValue] = useState('')
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [selectedKb, setSelectedKb] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const response = await getKnowledgeBases()
      if (response.code === 200) {
        setKnowledgeBases(response.data.knowledgeBases || [])
      }
    } catch (error) {
      console.error('加载知识库失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索知识库内容
  const searchKnowledge = async (query, kbId = null) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/kb/${kbId || 'all'}/search?q=${encodeURIComponent(query)}&type=hybrid&limit=20`)
      const data = await response.json()
      
      if (data.code === 200) {
        setSearchResults(data.data.results || [])
      }
    } catch (error) {
      console.error('搜索知识库失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索输入
  const handleSearchChange = (value) => {
    setSearchValue(value)
    if (value.trim()) {
      searchKnowledge(value, selectedKb)
    } else {
      setSearchResults([])
    }
  }

  // 处理知识库选择
  const handleKbChange = (kbId) => {
    setSelectedKb(kbId)
    if (searchValue.trim()) {
      searchKnowledge(searchValue, kbId)
    }
  }

  // 处理项目选择
  const handleItemSelect = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id)
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id))
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }

  // 处理确认选择
  const handleConfirm = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems)
      onClose()
    }
  }

  // 获取文件图标
  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
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
    return iconMap[ext] || '📎'
  }

  // 生成引用语法
  const generateReferenceSyntax = (item) => {
    return `{{kb:${item.kbId}:${item.id}}}`
  }

  // 渲染搜索结果
  const renderSearchResult = (result) => {
    const { file, score, snippet } = result
    const isSelected = selectedItems.some(item => item.id === file.id)

    return (
      <List.Item
        key={file.id}
        style={{ 
          padding: '12px 16px',
          cursor: 'pointer',
          borderBottom: '1px solid #f0f0f0',
          background: isSelected ? '#f0f8ff' : 'transparent'
        }}
        onClick={() => handleItemSelect(file)}
      >
        <List.Item.Meta
          avatar={
            <Avatar size={32} style={{ backgroundColor: 'transparent' }}>
              {getFileIcon(file)}
            </Avatar>
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontWeight: 500 }}>{file.name}</Text>
              <Space size={4}>
                <Tag color="blue" size="small">
                  {Math.round(score * 100)}%
                </Tag>
                {isSelected && <Tag color="green" size="small">已选</Tag>}
              </Space>
            </div>
          }
          description={
            <Space direction="vertical" size={4}>
              {snippet && (
                <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4 }}>
                  {snippet}
                </Text>
              )}
              <Space size={16}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  修改: {formatDate(file.updatedAt || file.createdAt)}
                </Text>
                {file.size && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    大小: {formatFileSize(file.size)}
                  </Text>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  类型: {file.fileFormat || '文档'}
                </Text>
              </Space>
            </Space>
          }
        />
      </List.Item>
    )
  }

  // 渲染知识库列表
  const renderKnowledgeBase = (kb) => {
    const isSelected = selectedItems.some(item => item.kbId === kb.id)

    return (
      <Card
        key={kb.id}
        hoverable
        style={{ 
          marginBottom: 12,
          cursor: 'pointer',
          border: isSelected ? '1px solid #1890ff' : '1px solid #e5e6eb'
        }}
        onClick={() => handleItemSelect({ ...kb, type: 'knowledgeBase' })}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            <IconStorage />
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
              {kb.name}
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {kb.description || '暂无描述'}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Space size={16}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {kb.fileCount || 0} 个文件
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  创建: {formatDate(kb.createdAt)}
                </Text>
              </Space>
            </div>
          </div>
          {isSelected && (
            <Tag color="green" size="small">已选</Tag>
          )}
        </div>
      </Card>
    )
  }

  useEffect(() => {
    if (visible) {
      loadKnowledgeBases()
      setSelectedItems([])
      setSearchValue('')
      setSearchResults([])
    }
  }, [visible])

  return (
    <Modal
      title="选择知识库内容"
      visible={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText={`确认选择 (${selectedItems.length})`}
      cancelText="取消"
      style={{ width: 800, top: 50 }}
      bodyStyle={{ padding: 0 }}
    >
      <div className={`knowledge-selector ${className}`}>
        <Tabs 
          activeTab={activeTab} 
          onChange={setActiveTab}
          style={{ marginBottom: 16 }}
        >
          <TabPane key="search" title="搜索内容">
            <div style={{ padding: '16px 24px' }}>
              <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                <Select
                  placeholder="选择知识库"
                  style={{ width: 200 }}
                  value={selectedKb}
                  onChange={handleKbChange}
                  allowClear
                >
                  {knowledgeBases.map(kb => (
                    <Option key={kb.id} value={kb.id}>
                      {kb.name}
                    </Option>
                  ))}
                </Select>
                <Input
                  placeholder="搜索文档内容..."
                  prefix={<IconSearch />}
                  value={searchValue}
                  onChange={handleSearchChange}
                  style={{ flex: 1 }}
                />
              </Space.Compact>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">搜索中...</Text>
                  </div>
                </div>
              ) : searchResults.length > 0 ? (
                <List
                  dataSource={searchResults}
                  render={renderSearchResult}
                  style={{ maxHeight: 400, overflowY: 'auto' }}
                />
              ) : searchValue ? (
                <Empty
                  description="未找到相关内容"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#86909c' }}>
                  <IconSearch style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Text>输入关键词搜索知识库内容</Text>
                </div>
              )}
            </div>
          </TabPane>

          <TabPane key="knowledgeBases" title="知识库">
            <div style={{ padding: '16px 24px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">加载中...</Text>
                  </div>
                </div>
              ) : knowledgeBases.length > 0 ? (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {knowledgeBases.map(renderKnowledgeBase)}
                </div>
              ) : (
                <Empty
                  description="暂无知识库"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </TabPane>
        </Tabs>

        {/* 已选择项目 */}
        {selectedItems.length > 0 && (
          <>
            <Divider />
            <div style={{ padding: '16px 24px', background: '#f7f8fa' }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                已选择项目 ({selectedItems.length})
              </Title>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {selectedItems.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#fff',
                      borderRadius: 4,
                      marginBottom: 8,
                      border: '1px solid #e5e6eb'
                    }}
                  >
                    <Space>
                      <Avatar size={24} style={{ backgroundColor: 'transparent' }}>
                        {item.type === 'knowledgeBase' ? <IconStorage /> : getFileIcon(item)}
                      </Avatar>
                      <div>
                        <Text style={{ fontWeight: 500 }}>{item.name}</Text>
                        <div style={{ marginTop: 2 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.type === 'knowledgeBase' ? '知识库' : '文档'}
                          </Text>
                        </div>
                      </div>
                    </Space>
                    <Space>
                      <Tooltip content="复制引用语法">
                        <Button
                          type="text"
                          size="small"
                          icon={<IconCopy />}
                          onClick={() => {
                            const syntax = generateReferenceSyntax(item)
                            navigator.clipboard.writeText(syntax)
                          }}
                        />
                      </Tooltip>
                      <Button
                        type="text"
                        size="small"
                        icon={<IconPlus />}
                        onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== index))}
                        style={{ color: '#f53f3f' }}
                      />
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default KnowledgeSelector
