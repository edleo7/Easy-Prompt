/**
 * 智能搜索组件
 * 提供全文搜索、语义搜索和混合搜索功能
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  Input, 
  Button, 
  Card, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Avatar,
  Empty,
  Spin,
  Tooltip,
  Dropdown,
  Divider,
  Modal,
  Form,
  Select,
  DatePicker,
  Checkbox
} from '@arco-design/web-react'
import { 
  IconSearch, 
  IconFile, 
  IconFolder, 
  IconClockCircle, 
  IconFilter,
  IconSettings,
  IconRefresh,
  IconHistory,
  IconStar,
  IconDownload,
  IconEye
} from '@arco-design/web-react/icon'
import { formatDate, formatFileSize } from '../../utils/format'

const { Text, Title } = Typography
const { TextArea } = Input
const Option = Select.Option
const FormItem = Form.Item

const SmartSearch = ({ 
  kbId,
  onFileClick,
  onFolderClick,
  className = '' 
}) => {
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchType, setSearchType] = useState('hybrid') // hybrid, fulltext, semantic
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchStats, setSearchStats] = useState(null)
  
  const searchInputRef = useRef(null)
  const [form] = Form.useForm()

  // 加载搜索历史
  useEffect(() => {
    loadSearchHistory()
    loadSearchStats()
  }, [kbId])

  // 加载搜索历史
  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem(`search_history_${kbId}`) || '[]')
    setSearchHistory(history.slice(0, 10)) // 只显示最近10条
  }

  // 保存搜索历史
  const saveSearchHistory = (query) => {
    if (!query.trim()) return
    
    const history = JSON.parse(localStorage.getItem(`search_history_${kbId}`) || '[]')
    const newHistory = [query, ...history.filter(item => item !== query)].slice(0, 20)
    localStorage.setItem(`search_history_${kbId}`, JSON.stringify(newHistory))
    setSearchHistory(newHistory.slice(0, 10))
  }

  // 加载搜索统计
  const loadSearchStats = async () => {
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/search/stats`)
      const data = await response.json()
      if (data.code === 200) {
        setSearchStats(data.data)
      }
    } catch (error) {
      console.error('加载搜索统计失败:', error)
    }
  }

  // 执行搜索
  const performSearch = async (query, type = searchType) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/kb/${kbId}/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`)
      const data = await response.json()
      
      if (data.code === 200) {
        setSearchResults(data.data.results || [])
        saveSearchHistory(query)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  // 获取搜索建议
  const getSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/v1/kb/${kbId}/search/suggestions?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()
      
      if (data.code === 200) {
        setSuggestions(data.data.suggestions || [])
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error)
    }
  }

  // 处理搜索输入
  const handleSearchChange = (value) => {
    setSearchValue(value)
    if (value.trim()) {
      getSuggestions(value)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  // 处理搜索提交
  const handleSearchSubmit = () => {
    if (searchValue.trim()) {
      performSearch(searchValue.trim())
      setShowSuggestions(false)
    }
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion)
    performSearch(suggestion)
    setShowSuggestions(false)
  }

  // 处理历史记录点击
  const handleHistoryClick = (historyItem) => {
    setSearchValue(historyItem)
    performSearch(historyItem)
  }

  // 处理文件点击
  const handleFileClick = (file) => {
    if (onFileClick) {
      onFileClick(file)
    }
  }

  // 处理文件夹点击
  const handleFolderClick = (folder) => {
    if (onFolderClick) {
      onFolderClick(folder)
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

  // 渲染搜索结果
  const renderSearchResult = (result) => {
    const { file, score, snippet, highlights, sources } = result

    return (
      <List.Item
        key={file.id}
        style={{ 
          padding: '12px 16px',
          cursor: 'pointer',
          borderBottom: '1px solid #f0f0f0'
        }}
        onClick={() => handleFileClick(file)}
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
                {sources.includes('fulltext') && <Tag color="green" size="small">全文</Tag>}
                {sources.includes('semantic') && <Tag color="orange" size="small">语义</Tag>}
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

  // 高级搜索
  const handleAdvancedSearch = async () => {
    try {
      const values = await form.validate()
      const { query, fileTypes, dateRange, tags, folders } = values
      
      if (!query.trim()) return

      setLoading(true)
      const response = await fetch(`/api/v1/kb/${kbId}/search/advanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          fileTypes,
          dateRange,
          tags,
          folders,
          searchType: searchType,
          limit: 20
        })
      })

      const data = await response.json()
      if (data.code === 200) {
        setSearchResults(data.data.results || [])
        saveSearchHistory(query)
        setAdvancedSearchVisible(false)
      }
    } catch (error) {
      console.error('高级搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`smart-search ${className}`}>
      {/* 搜索框 */}
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            ref={searchInputRef}
            placeholder="搜索文件、文件夹或输入自然语言描述..."
            prefix={<IconSearch />}
            value={searchValue}
            onChange={handleSearchChange}
            onPressEnter={handleSearchSubmit}
            allowClear
            style={{ flex: 1 }}
          />
          <Dropdown
            droplist={
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>搜索类型</Text>
                </div>
                <div style={{ padding: '4px 0' }}>
                  <div 
                    style={{ 
                      padding: '8px 16px', 
                      cursor: 'pointer',
                      background: searchType === 'hybrid' ? '#f0f8ff' : 'transparent'
                    }}
                    onClick={() => setSearchType('hybrid')}
                  >
                    混合搜索
                  </div>
                  <div 
                    style={{ 
                      padding: '8px 16px', 
                      cursor: 'pointer',
                      background: searchType === 'fulltext' ? '#f0f8ff' : 'transparent'
                    }}
                    onClick={() => setSearchType('fulltext')}
                  >
                    全文搜索
                  </div>
                  <div 
                    style={{ 
                      padding: '8px 16px', 
                      cursor: 'pointer',
                      background: searchType === 'semantic' ? '#f0f8ff' : 'transparent'
                    }}
                    onClick={() => setSearchType('semantic')}
                  >
                    语义搜索
                  </div>
                </div>
              </div>
            }
            trigger="click"
          >
            <Button icon={<IconSettings />} />
          </Dropdown>
          <Button 
            type="primary" 
            icon={<IconSearch />}
            onClick={handleSearchSubmit}
            loading={loading}
          >
            搜索
          </Button>
        </Space.Compact>

        {/* 搜索建议 */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ 
            marginTop: 8, 
            border: '1px solid #e5e6eb', 
            borderRadius: 4,
            background: '#fff',
            maxHeight: 200,
            overflowY: 'auto'
          }}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={(e) => e.target.style.background = '#f7f8fa'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <Text>{suggestion}</Text>
              </div>
            ))}
          </div>
        )}

        {/* 搜索历史 */}
        {searchHistory.length > 0 && !showSuggestions && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              搜索历史
            </Text>
            <Space wrap>
              {searchHistory.map((historyItem, index) => (
                <Tag
                  key={index}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleHistoryClick(historyItem)}
                >
                  {historyItem}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="outline"
              size="small"
              icon={<IconFilter />}
              onClick={() => setAdvancedSearchVisible(true)}
            >
              高级搜索
            </Button>
            {searchStats && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                已索引 {searchStats.totalIndexedFiles} 个文件
              </Text>
            )}
          </Space>
          <Button
            type="text"
            size="small"
            icon={<IconRefresh />}
            onClick={loadSearchStats}
          >
            刷新
          </Button>
        </div>
      </Card>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <Card title={`搜索结果 (${searchResults.length})`} style={{ marginBottom: 16 }}>
          <List
            dataSource={searchResults}
            render={renderSearchResult}
          />
        </Card>
      )}

      {/* 空状态 */}
      {!loading && searchResults.length === 0 && searchValue && (
        <Card>
          <Empty
            description="未找到相关文件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* 加载状态 */}
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">搜索中...</Text>
            </div>
          </div>
        </Card>
      )}

      {/* 高级搜索对话框 */}
      <Modal
        title="高级搜索"
        visible={advancedSearchVisible}
        onOk={handleAdvancedSearch}
        onCancel={() => setAdvancedSearchVisible(false)}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <FormItem label="搜索关键词" field="query" rules={[{ required: true, message: '请输入搜索关键词' }]}>
            <Input placeholder="请输入搜索关键词" />
          </FormItem>
          
          <FormItem label="文件类型" field="fileTypes">
            <Select multiple placeholder="选择文件类型">
              <Option value="pdf">PDF文档</Option>
              <Option value="docx">Word文档</Option>
              <Option value="pptx">PowerPoint</Option>
              <Option value="xlsx">Excel表格</Option>
              <Option value="jpg">图片</Option>
              <Option value="mp4">视频</Option>
              <Option value="mp3">音频</Option>
            </Select>
          </FormItem>
          
          <FormItem label="创建时间" field="dateRange">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </FormItem>
          
          <FormItem label="标签" field="tags">
            <Select multiple placeholder="选择标签" />
          </FormItem>
          
          <FormItem label="文件夹" field="folders">
            <Select multiple placeholder="选择文件夹" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  )
}

export default SmartSearch
