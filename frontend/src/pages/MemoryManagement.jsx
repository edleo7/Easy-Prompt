import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Badge, Modal, Form, Message, Table, Switch, Divider, Tooltip, Upload, Tabs, Spin } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconDelete, IconEdit, IconUpload, IconImage, IconFile, IconShareAlt } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'
import Pagination from '../components/Pagination'
import KnowledgeGraph from '../components/KnowledgeGraphFixed'
import { memoryAPI } from '../services/api'
import { cache } from '../services/cache'
import aiService from '../services/aiService'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function MemoryManagement({ currentPage, setCurrentPage }) {
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [newMemoryVisible, setNewMemoryVisible] = useState(false)
  const [editMemoryVisible, setEditMemoryVisible] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [activeTab, setActiveTab] = useState('text')
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState('list') // list, graph
  const pageSize = 10
  
  // 新建记忆表单状态
  const [newMemoryForm, setNewMemoryForm] = useState({
    title: '',
    content: '',
    type: '用户偏好',
    importance: 'normal',
    tags: ''
  })

  // 加载记忆数据
  useEffect(() => {
    loadMemories()
  }, [page, searchValue, filterStatus, filterType])

  const loadMemories = async () => {
    setLoading(true)
    try {
      // 清除缓存，强制从服务器获取最新数据
      cache.clear()
      console.log('强制刷新记忆列表，清除缓存')
      
      const response = await memoryAPI.getMemories({
        page,
        limit: pageSize,
        search: searchValue,
        scope: filterStatus === 'all' ? undefined : filterStatus,
        weight: filterType === 'all' ? undefined : filterType
      })
      if (response.code === 200) {
        setMemories(response.data.memories || [])
        setTotal(response.data.pagination?.total || 0)
        console.log('记忆列表已更新:', response.data.memories.length, '条记录')
      }
    } catch (error) {
      console.error('加载记忆失败:', error)
      Message.warning('使用模拟数据，后端服务未启动')
      // 使用模拟数据作为fallback
      setMemories(memoryData)
      setTotal(memoryData.length)
    } finally {
      setLoading(false)
    }
  }

  // 创建记忆
  const handleCreateMemory = async (values) => {
    try {
      console.log('创建记忆数据:', values) // 调试日志
      // 映射importance到weight
      const weightMap = {
        'high': 'HIGH',
        'medium': 'NORMAL', 
        'low': 'LOW',
        'normal': 'NORMAL'
      }
      
      const response = await memoryAPI.createMemory({
        content: values.content,
        scope: values.scope || 'USER',
        weight: weightMap[values.importance] || 'NORMAL',
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      })
      
      if (response.code === 201) {
        Message.success('记忆创建成功')
        setNewMemoryVisible(false)
        setNewMemoryForm({
          title: '',
          content: '',
          type: '用户偏好',
          importance: 'normal',
          tags: ''
        })
        loadMemories()
      }
    } catch (error) {
      console.error('创建记忆失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 模拟创建成功
      const newMemory = {
        id: Date.now(),
        title: values.title || '新建记忆',
        type: values.type || '用户偏好',
        content: values.content,
        status: 'active',
        importance: values.importance || 'normal',
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      setMemories(prev => [newMemory, ...prev])
      setTotal(prev => prev + 1)
      setNewMemoryVisible(false)
      Message.success('记忆创建成功（模拟数据）')
    }
  }

  // 更新记忆
  const handleUpdateMemory = async (id, values) => {
    try {
      const response = await memoryAPI.updateMemory(id, {
        content: values.content,
        weight: values.importance || 'NORMAL',
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      })
      
      if (response.code === 200) {
        Message.success('记忆更新成功')
        setEditMemoryVisible(false)
        setSelectedMemory(null)
        loadMemories()
      }
    } catch (error) {
      console.error('更新记忆失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 模拟更新成功
      setMemories(prev => prev.map(memory => 
        memory.id === id 
          ? { 
              ...memory, 
              content: values.content,
              importance: values.importance || 'normal',
              tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : memory
      ))
      setEditMemoryVisible(false)
      setSelectedMemory(null)
      Message.success('记忆更新成功（模拟数据）')
    }
  }

  // 删除记忆
  const handleDeleteMemory = async (id) => {
    try {
      console.log('删除记忆ID:', id) // 调试日志
      const response = await memoryAPI.deleteMemory(id)
      console.log('删除响应:', response) // 调试日志
      
      if (response.code === 200) {
        Message.success('记忆删除成功')
        // 强制刷新列表，清除缓存
        setMemories([])
        setTotal(0)
        await loadMemories()
      } else if (response.code === 404) {
        Message.error('记忆不存在，可能已被删除')
        // 强制刷新列表
        setMemories([])
        setTotal(0)
        await loadMemories()
      } else {
        Message.error(`删除失败: ${response.message}`)
      }
    } catch (error) {
      console.error('删除记忆失败:', error)
      console.error('错误详情:', error.message, error.stack)
      Message.error(`删除失败: ${error.message}`)
      // 不进行模拟删除，让用户知道真实情况
    }
  }

  // 模拟记忆数据（作为备用）
  const memoryData = [
    {
      id: 1,
      title: '用户偏好设置',
      type: '用户偏好',
      content: '用户喜欢简洁的界面设计，偏好深色主题',
      status: 'active',
      importance: 'high',
      tags: ['UI', '偏好'],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: 2,
      title: '工作流程习惯',
      type: '工作习惯',
      content: '用户通常在上午处理重要任务，下午进行创意工作',
      status: 'active',
      importance: 'medium',
      tags: ['工作', '时间管理'],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18'
    },
    {
      id: 3,
      title: '技术栈偏好',
      type: '技术偏好',
      content: '用户熟悉React、Node.js，偏好使用TypeScript',
      status: 'inactive',
      importance: 'high',
      tags: ['技术', '开发'],
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12'
    }
  ]

  // AI多模态识别功能
  const handleImageUpload = async (file) => {
    setUploading(true)
    try {
      // 将图片转换为base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const base64Image = e.target.result
          
          // 使用AI服务进行多模态识别
          const prompt = '请识别这张图片中的文字内容，特别是对话记录。如果图片中包含与AI助手的对话，请完整提取出来。'
          const aiResult = await aiService.generateMultimodal(prompt, base64Image)
          
          if (aiResult.success) {
            setRecognizedText(aiResult.content)
            Message.success(`图像识别成功 (使用${aiResult.model})`)
          } else {
            throw new Error(aiResult.error || 'AI识别失败')
          }
        } catch (error) {
          console.error('AI识别错误:', error)
          Message.error('图像识别失败，请重试')
          // 模拟识别结果（开发阶段）
          setRecognizedText('这是从截图中识别出的对话内容：\n\n用户：请帮我分析这个数据\nAI：好的，我来帮您分析这个数据...')
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('文件读取错误:', error)
      Message.error('文件读取失败')
      setUploading(false)
    }
  }

  // 支持的图片格式
  const acceptedFormats = [
    'image/png',
    'image/jpeg', 
    'image/jpg',
    'image/bmp',
    'image/gif',
    'image/tiff',
    'image/tif',
    'image/webp',
    'image/heif',
    'image/heic'
  ]

  // 搜索和筛选功能现在通过服务端API处理
  const handleSearchChange = (value) => {
    setSearchValue(value)
    setPage(1) // 重置到第一页
  }

  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setFilterStatus(value)
    } else if (type === 'type') {
      setFilterType(value)
    }
    setPage(1) // 重置到第一页
  }

  const columns = [
    {
      title: '记忆内容',
      dataIndex: 'content',
      key: 'content',
      render: (text, record) => (
        <div>
          <div style={{ 
            maxWidth: 300, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
            marginBottom: 4
          }}>
            {text}
          </div>
          <Tag color="blue" size="small">{record.scope === 'USER' ? '用户记忆' : '工作空间记忆'}</Tag>
        </div>
      )
    },
    {
      title: '重要性',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => {
        const weightMap = {
          'HIGH': { color: 'red', text: '高' },
          'NORMAL': { color: 'green', text: '普通' },
          'normal': { color: 'green', text: '普通' },
          'LOW': { color: 'blue', text: '低' },
          'low': { color: 'blue', text: '低' }
        }
        const config = weightMap[weight] || { color: 'green', text: '普通' }
        return (
          <Tag color={config.color}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch 
          checked={record.status !== 'inactive'} // 根据记录状态设置
          size="small"
          onChange={async (checked) => {
            try {
              // 更新记忆状态
              const response = await memoryAPI.updateMemory(record.id, {
                status: checked ? 'active' : 'inactive'
              })
              
              if (response.code === 200) {
                Message.success(checked ? '记忆已激活' : '记忆已停用')
                loadMemories() // 重新加载列表
              } else {
                Message.error('状态更新失败')
              }
            } catch (error) {
              console.error('更新状态失败:', error)
              Message.warning('后端服务未启动，使用模拟数据')
              // 模拟更新成功
              Message.success(checked ? '记忆已激活' : '记忆已停用')
            }
          }}
        />
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => {
        const tagList = typeof tags === 'string' ? JSON.parse(tags || '[]') : tags || []
        return (
          <Space wrap>
            {tagList.map(tag => (
              <Tag key={tag} size="small" color="blue">{tag}</Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
            <Button 
              type="text" 
              size="small" 
              icon={<IconEdit />}
              onClick={() => {
                setSelectedMemory(record)
                setEditMemoryVisible(true)
              }}
            />
            <Button 
              type="text" 
              size="small" 
              icon={<IconDelete />}
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '确定要删除这条记忆吗？',
                  onOk: async () => {
                    console.log('开始删除记忆:', record.id)
                    await handleDeleteMemory(record.id)
                  }
                })
              }}
            />
        </Space>
      )
    }
  ]

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="记忆管理"
      pageSubtitle="管理您与LLM沟通过的信息，建立知识图谱，实现上下文迁移"
      >
        <div style={{ 
        height: '100%', 
          display: 'flex', 
        flexDirection: 'column'
        }}>
          {/* 操作栏 */}
        <Card style={{ marginBottom: 24, borderRadius: 12, flexShrink: 0 }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <Input
              placeholder="搜索记忆..."
                  value={searchValue}
                  onChange={handleSearchChange}
              prefix={<IconSearch />}
                />
              </Col>
              <Col span={4}>
                <Select
              placeholder="状态"
              value={filterStatus}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
            </Select>
              </Col>
              <Col span={4}>
                <Select
              placeholder="类型"
              value={filterType}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="用户偏好">用户偏好</Select.Option>
              <Select.Option value="工作习惯">工作习惯</Select.Option>
              <Select.Option value="技术偏好">技术偏好</Select.Option>
            </Select>
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'outline'}
                    icon={<IconFile />}
                    onClick={() => setViewMode('list')}
                  >
                    列表视图
                  </Button>
                  <Button
                    type={viewMode === 'graph' ? 'primary' : 'outline'}
                    icon={<IconShareAlt />}
                    onClick={() => setViewMode('graph')}
                  >
                    知识图谱
                  </Button>
                  <Button
                    type="primary"
                    icon={<IconPlus />}
                    onClick={() => setNewMemoryVisible(true)}
                  >
                    新建记忆
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

        {/* 记忆内容区域 */}
        {viewMode === 'list' ? (
          <Card style={{ borderRadius: 12 }}>
            <Table
              columns={columns}
              data={memories}
              loading={loading}
              pagination={false}
              rowKey="id"
            />
            <Pagination
              total={total}
              current={page}
              pageSize={pageSize}
              onChange={(newPage) => setPage(newPage)}
            />
          </Card>
        ) : (
          <KnowledgeGraph
            memories={memories}
            knowledgeBases={[]} // 这里可以传入知识库数据
            onUpdateMemory={handleUpdateMemory}
            onDeleteMemory={handleDeleteMemory}
            onAddConnection={(connection) => {
              // 处理添加连接逻辑
              console.log('添加连接:', connection)
            }}
          />
        )}
      </div>

      {/* 新建记忆弹窗 */}
      <Modal
        title="新建记忆"
        visible={newMemoryVisible}
        onCancel={() => {
          setNewMemoryVisible(false)
          setRecognizedText('')
          setActiveTab('text')
          setNewMemoryForm({
            title: '',
            content: '',
            type: '用户偏好',
            importance: 'normal',
            tags: ''
          })
        }}
        onOk={() => {
          // 验证必填字段
          if (!newMemoryForm.content.trim()) {
            Message.error('请填写记忆内容')
            return
          }
          
          // 使用状态数据创建记忆
          const values = {
            ...newMemoryForm,
            scope: 'USER' // 添加必需的scope字段
          }
          
          handleCreateMemory(values)
        }}
        style={{ width: 600 }}
      >
        <Tabs 
          activeTab={activeTab} 
          onChange={setActiveTab}
          type="line"
        >
          <Tabs.TabPane 
            key="text" 
            title={
              <span>
                <IconFile style={{ marginRight: 4 }} />
                文本输入
              </span>
            }
      >
        <Form layout="vertical">
          <Form.Item label="记忆标题" required>
            <Input 
              value={newMemoryForm.title}
              onChange={(value) => setNewMemoryForm(prev => ({ ...prev, title: value }))}
              placeholder="请输入记忆标题" 
            />
          </Form.Item>
          <Form.Item label="记忆类型" required>
                <Select 
                  value={newMemoryForm.type}
                  onChange={(value) => setNewMemoryForm(prev => ({ ...prev, type: value }))}
                  placeholder="请选择记忆类型"
                >
                  <Select.Option value="用户偏好">用户偏好</Select.Option>
                  <Select.Option value="工作习惯">工作习惯</Select.Option>
                  <Select.Option value="技术偏好">技术偏好</Select.Option>
                  <Select.Option value="对话记录">对话记录</Select.Option>
                </Select>
          </Form.Item>
          <Form.Item label="记忆内容" required>
            <Input.TextArea 
              value={newMemoryForm.content}
              onChange={(value) => setNewMemoryForm(prev => ({ ...prev, content: value }))}
              placeholder="请输入记忆内容"
              autoSize={{ minRows: 4 }}
            />
          </Form.Item>
              <Form.Item label="重要性">
                <Select 
                  value={newMemoryForm.importance}
                  onChange={(value) => setNewMemoryForm(prev => ({ ...prev, importance: value }))}
                  placeholder="请选择重要性"
                >
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="标签">
                <Input 
                  value={newMemoryForm.tags}
                  onChange={(value) => setNewMemoryForm(prev => ({ ...prev, tags: value }))}
                  placeholder="请输入标签，用逗号分隔" 
                />
              </Form.Item>
            </Form>
          </Tabs.TabPane>
          
          <Tabs.TabPane 
            key="image" 
            title={
              <span>
                <IconImage style={{ marginRight: 4 }} />
                截图识别
              </span>
            }
          >
            <Form layout="vertical">
              <Form.Item label="上传对话截图">
                <Upload
                  accept={acceptedFormats.join(',')}
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  disabled={uploading}
                >
                  <Button 
                    type="outline" 
                    icon={<IconUpload />}
                    loading={uploading}
              style={{ width: '100%' }}
                  >
                    {uploading ? '正在识别...' : '点击上传截图'}
                  </Button>
                </Upload>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  支持格式：PNG, JPEG, BMP, GIF, TIFF, WebP, HEIF/HEIC
                </div>
              </Form.Item>
              
              {recognizedText && (
                <Form.Item label="识别结果">
                  <Input.TextArea 
                    value={recognizedText}
                    onChange={setRecognizedText}
                    autoSize={{ minRows: 4 }}
                    placeholder="识别结果将显示在这里，您可以编辑内容"
                  />
                </Form.Item>
              )}
              
              <Form.Item label="记忆标题" required>
                <Input placeholder="请输入记忆标题" />
              </Form.Item>
              <Form.Item label="记忆类型" required>
                <Select placeholder="请选择记忆类型">
                  <Select.Option value="对话记录">对话记录</Select.Option>
                  <Select.Option value="用户偏好">用户偏好</Select.Option>
                  <Select.Option value="工作习惯">工作习惯</Select.Option>
                  <Select.Option value="技术偏好">技术偏好</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="重要性">
                <Select placeholder="请选择重要性">
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
          </Form.Item>
        </Form>
          </Tabs.TabPane>
        </Tabs>
      </Modal>

      {/* 编辑记忆弹窗 */}
      <Modal
        title="编辑记忆"
        visible={editMemoryVisible}
        onCancel={() => {
          setEditMemoryVisible(false)
          setSelectedMemory(null)
        }}
        onOk={() => {
          // 获取表单数据并更新
          const form = document.querySelector('#editMemoryForm')
          if (form) {
            const formData = new FormData(form)
            const values = {
              title: formData.get('title') || selectedMemory?.title || '',
              content: formData.get('content') || selectedMemory?.content || '',
              type: formData.get('type') || selectedMemory?.type || '用户偏好',
              importance: formData.get('importance') || selectedMemory?.weight || 'normal',
              tags: formData.get('tags') || selectedMemory?.tags || ''
            }
            
            // 验证必填字段
            if (!values.content.trim()) {
              Message.error('请填写记忆内容')
              return
            }
            
            handleUpdateMemory(selectedMemory.id, values)
          } else {
            Message.error('请填写必要信息')
          }
        }}
        style={{ width: 600 }}
      >
        <Form 
          layout="vertical"
          id="editMemoryForm"
          initialValues={selectedMemory}
        >
          <Form.Item label="记忆标题" required>
              <Input 
                name="title"
                placeholder="请输入记忆标题" 
                defaultValue={selectedMemory?.title || ''}
              />
            </Form.Item>
          <Form.Item label="记忆类型" required>
            <Select 
              name="type"
              placeholder="请选择记忆类型"
              defaultValue={selectedMemory?.type || '用户偏好'}
            >
              <Select.Option value="用户偏好">用户偏好</Select.Option>
              <Select.Option value="工作习惯">工作习惯</Select.Option>
              <Select.Option value="技术偏好">技术偏好</Select.Option>
              <Select.Option value="对话记录">对话记录</Select.Option>
            </Select>
            </Form.Item>
          <Form.Item label="记忆内容" required>
              <Input.TextArea 
                name="content"
                placeholder="请输入记忆内容"
                autoSize={{ minRows: 4 }}
                defaultValue={selectedMemory?.content || ''}
              />
            </Form.Item>
          <Form.Item label="重要性">
            <Select 
              name="importance"
              placeholder="请选择重要性"
              defaultValue={selectedMemory?.weight || 'normal'}
            >
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
            </Form.Item>
          <Form.Item label="标签">
            <Input 
              name="tags"
              placeholder="请输入标签，用逗号分隔" 
              defaultValue={selectedMemory?.tags ? JSON.parse(selectedMemory.tags).join(', ') : ''}
            />
          </Form.Item>
          </Form>
      </Modal>
    </AppLayout>
  )
}
