import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Badge, Modal, Form, Message, Table, Switch, Divider, Tooltip, Upload, Progress, Tabs, Spin, Tree, List, Drawer } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconEye, IconDelete, IconEdit, IconEye as IconView, IconDownload, IconUpload, IconFile, IconFolder, IconRefresh, IconSettings, IconCloud, IconThunderbolt } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'
import Pagination from '../components/Pagination'
import { knowledgeAPI } from '../services/api'
import aiService from '../services/aiService'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function KnowledgeBaseManagement({ currentPage, setCurrentPage }) {
  const [searchValue, setSearchValue] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('list') // list, tree, grid
  const [uploadVisible, setUploadVisible] = useState(false)
  const [processingVisible, setProcessingVisible] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [directoryVisible, setDirectoryVisible] = useState(false)
  const [currentDirectory, setCurrentDirectory] = useState('root')
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // 加载知识库数据
  useEffect(() => {
    loadKnowledgeBases()
  }, [page, searchValue, filterCategory, filterStatus])

  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const response = await knowledgeAPI.getKnowledgeBases({
        page,
        limit: pageSize,
        search: searchValue,
        category: filterCategory === 'all' ? undefined : filterCategory,
        status: filterStatus === 'all' ? undefined : filterStatus
      })
      if (response.code === 200) {
        setKnowledgeBases(response.data.knowledgeBases || [])
        setTotal(response.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('加载知识库失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 使用模拟数据作为fallback
      setKnowledgeBases([
        {
          id: 1,
          name: '产品文档',
          description: 'EasyPrompt产品相关文档',
          category: '产品文档',
          status: 'active',
          fileCount: 15,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20'
        },
        {
          id: 2,
          name: '技术规范',
          description: '开发技术规范和标准',
          category: '技术文档',
          status: 'active',
          fileCount: 8,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18'
        },
        {
          id: 3,
          name: '用户手册',
          description: '用户使用指南和教程',
          category: '用户文档',
          status: 'processing',
          fileCount: 0,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-12'
        }
      ])
      setTotal(3)
    } finally {
      setLoading(false)
    }
  }

  // 搜索和筛选功能现在通过服务端API处理
  const handleSearchChange = (value) => {
    setSearchValue(value)
    setPage(1) // 重置到第一页
  }

  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setFilterCategory(value)
    } else if (type === 'status') {
      setFilterStatus(value)
    }
    setPage(1) // 重置到第一页
  }

  // 创建知识库
  const handleCreateKnowledgeBase = async (values) => {
    try {
      const response = await knowledgeAPI.createKnowledgeBase({
        name: values.name,
        description: values.description
      })
      
      if (response.code === 201) {
        Message.success('知识库创建成功')
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('创建知识库失败:', error)
      Message.error('创建知识库失败')
    }
  }

  // 更新知识库
  const handleUpdateKnowledgeBase = async (id, values) => {
    try {
      const response = await knowledgeAPI.updateKnowledgeBase(id, {
        name: values.name,
        description: values.description
      })
      
      if (response.code === 200) {
        Message.success('知识库更新成功')
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('更新知识库失败:', error)
      Message.error('更新知识库失败')
    }
  }

  // 删除知识库
  const handleDeleteKnowledgeBase = async (id) => {
    try {
      const response = await knowledgeAPI.deleteKnowledgeBase(id)
      if (response.code === 200) {
        Message.success('知识库删除成功')
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('删除知识库失败:', error)
      Message.error('删除知识库失败')
    }
  }

  // 模拟知识库数据
  const knowledgeData = [
    {
      id: 1,
      title: 'AI Prompt 最佳实践指南',
      category: '技术文档',
      status: 'published',
      author: '张三',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      views: 1250,
      downloads: 89,
      type: 'structured',
      size: '2.3MB',
      format: 'PDF',
      tags: ['AI', 'Prompt', '最佳实践'],
      directory: '技术文档/AI相关',
      content: '这是一份关于AI Prompt工程的最佳实践指南...',
      processed: true
    },
    {
      id: 2,
      title: 'React 开发规范',
      category: '开发规范',
      status: 'draft',
      author: '李四',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      views: 890,
      downloads: 45,
      type: 'structured',
      size: '1.8MB',
      format: 'DOCX',
      tags: ['React', '开发规范', '前端'],
      directory: '开发规范/前端',
      content: 'React开发规范文档...',
      processed: true
    },
    {
      id: 3,
      title: '产品设计原则',
      category: '设计规范',
      status: 'published',
      author: '王五',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-12',
      views: 2100,
      downloads: 156,
      type: 'structured',
      size: '3.1MB',
      format: 'PDF',
      tags: ['设计', '产品', '原则'],
      directory: '设计规范/产品设计',
      content: '产品设计的基本原则和指导...',
      processed: true
    },
    {
      id: 4,
      title: '会议记录_2024-01-20',
      category: '会议记录',
      status: 'processing',
      author: '系统',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
      views: 0,
      downloads: 0,
      type: 'unstructured',
      size: '856KB',
      format: 'TXT',
      tags: ['会议', '记录', '待处理'],
      directory: '会议记录/2024年1月',
      content: '',
      processed: false
    }
  ]

  // 支持的文件格式
  const supportedFormats = [
    // 文档格式
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
    // 表格格式
    'xls', 'xlsx', 'csv', 'ods',
    // 演示文稿
    'ppt', 'pptx', 'odp',
    // 图片格式
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp',
    // 音频格式
    'mp3', 'wav', 'm4a', 'aac', 'ogg',
    // 视频格式
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
    // 压缩格式
    'zip', 'rar', '7z', 'tar', 'gz'
  ]

  // 目录树结构
  const directoryTree = [
    {
      title: '技术文档',
      key: 'tech',
      children: [
        { title: 'AI相关', key: 'tech-ai' },
        { title: '前端开发', key: 'tech-frontend' },
        { title: '后端开发', key: 'tech-backend' }
      ]
    },
    {
      title: '开发规范',
      key: 'standards',
      children: [
        { title: '前端', key: 'standards-frontend' },
        { title: '后端', key: 'standards-backend' },
        { title: '数据库', key: 'standards-database' }
      ]
    },
    {
      title: '设计规范',
      key: 'design',
      children: [
        { title: '产品设计', key: 'design-product' },
        { title: 'UI设计', key: 'design-ui' },
        { title: '交互设计', key: 'design-interaction' }
      ]
    },
    {
      title: '会议记录',
      key: 'meetings',
      children: [
        { title: '2024年1月', key: 'meetings-2024-01' },
        { title: '2024年2月', key: 'meetings-2024-02' }
      ]
    }
  ]

  // 文件上传处理
  const handleFileUpload = async (file) => {
    setSelectedFiles(prev => [...prev, file])
    return false // 阻止自动上传
  }

  // 读取文件内容
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
    })
  }

  // AI处理非结构化数据
  const processFilesWithAI = async () => {
    if (selectedFiles.length === 0) {
      Message.warning('请先选择要处理的文件')
      return
    }

    setProcessingVisible(true)
    setProcessingProgress(0)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setProcessingProgress((i / selectedFiles.length) * 100)

        // 使用AI服务处理文件
        const fileContent = await readFileContent(file)
        const prompt = `请分析这个文件的内容，提取关键信息并生成结构化的知识条目。
文件名称：${file.name}
文件类型：${file.type}

请按照以下格式返回：
- 标题：简洁的文件标题
- 分类：合适的分类标签
- 摘要：文件内容摘要
- 关键词：3-5个关键词
- 结构化内容：提取的主要信息点

请以JSON格式返回结果。`

        const aiResult = await aiService.generateText(prompt, {
          temperature: 0.3,
          maxTokens: 2000
        })

        if (aiResult.success) {
          let result
          try {
            result = JSON.parse(aiResult.content)
          } catch {
            // 如果解析失败，使用默认格式
            result = {
              title: file.name,
              category: '未分类',
              summary: aiResult.content.substring(0, 200) + '...',
              keywords: ['文档', '知识'],
              content: aiResult.content
            }
          }

          // 添加到知识库
          const newKnowledge = {
            id: Date.now() + i,
            title: result.title || file.name,
            category: result.category || '未分类',
            status: 'processing',
            author: '系统',
            createdAt: new Date().toLocaleString('zh-CN'),
            updatedAt: new Date().toLocaleString('zh-CN'),
            views: 0,
            downloads: 0,
            type: 'unstructured',
            size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
            format: file.name.split('.').pop().toUpperCase(),
            tags: result.tags || [],
            directory: currentDirectory,
            content: result.content || '',
            processed: false
          }
          
          // 这里应该调用API添加到知识库
          console.log('处理结果:', newKnowledge)
        }
      }

      setProcessingProgress(100)
      Message.success('文件处理完成')
      setSelectedFiles([])
      setUploadVisible(false)
    } catch (error) {
      console.error('文件处理失败:', error)
      Message.error('文件处理失败，请重试')
    } finally {
      setProcessingVisible(false)
      setProcessingProgress(0)
    }
  }

  // 搜索和筛选功能现在通过服务端API处理

  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Space wrap>
            <Tag color="blue" size="small">{record.category}</Tag>
            <Tag color={record.type === 'structured' ? 'green' : 'orange'} size="small">
              {record.type === 'structured' ? '结构化' : '非结构化'}
            </Tag>
            {record.processed && <Tag color="purple" size="small">已处理</Tag>}
            </Space>
        </div>
      )
    },
    {
      title: '格式/大小',
      key: 'format',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.format}</div>
          <div style={{ fontSize: 12, color: '#86909c' }}>{record.size}</div>
        </div>
      )
    },
    {
      title: '目录',
      dataIndex: 'directory',
      key: 'directory',
      render: (directory) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconFolder style={{ fontSize: 12, color: '#86909c' }} />
          <span style={{ fontSize: 12 }}>{directory}</span>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          published: { color: 'green', text: '已发布' },
          draft: { color: 'orange', text: '草稿' },
          processing: { color: 'blue', text: '处理中' }
        }
        const config = statusConfig[status] || { color: 'gray', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <Space wrap>
          {tags.slice(0, 2).map((tag, index) => (
            <Tag key={index} size="small">{tag}</Tag>
          ))}
          {tags.length > 2 && <Tag size="small">+{tags.length - 2}</Tag>}
        </Space>
      )
    },
    {
      title: '统计',
      key: 'stats',
      render: (_, record) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <IconEye style={{ fontSize: 12, color: '#86909c' }} />
            <span style={{ fontSize: 12 }}>{record.views}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconDownload style={{ fontSize: 12, color: '#86909c' }} />
            <span style={{ fontSize: 12 }}>{record.downloads}</span>
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
            <Button 
              type="text" 
              size="small" 
              icon={<IconView />}
            onClick={() => {
              // 查看文档内容
              console.log('查看文档:', record)
            }}
            />
            <Button 
              type="text" 
              size="small" 
              icon={<IconEdit />}
            onClick={() => {
              // 编辑文档
              console.log('编辑文档:', record)
            }}
            />
            <Button 
              type="text" 
              size="small" 
              icon={<IconDownload />}
            onClick={() => {
              // 下载文档
              console.log('下载文档:', record)
            }}
            />
            <Button 
              type="text" 
              size="small" 
              icon={<IconDelete />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个文档吗？',
                onOk: () => {
                  Message.success('文档删除成功')
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
      pageTitle="知识库管理"
      pageSubtitle="管理未与LLM沟通过的信息，支持结构化与非结构化数据，可扩展为数据管理器"
      >
        <div style={{ 
        height: '100%', 
          display: 'flex', 
        flexDirection: 'column'
        }}>
          {/* 操作栏 */}
        <Card style={{ marginBottom: 24, borderRadius: 12, flexShrink: 0 }}>
            <Row gutter={16} align="middle">
          <Col span={6}>
                <Input
              placeholder="搜索知识库..."
                  value={searchValue}
                  onChange={handleSearchChange}
              prefix={<IconSearch />}
                />
              </Col>
          <Col span={3}>
                <Select
              placeholder="分类"
                  value={filterCategory}
                  onChange={(value) => handleFilterChange('category', value)}
            >
              <Select.Option value="all">全部分类</Select.Option>
              <Select.Option value="技术文档">技术文档</Select.Option>
              <Select.Option value="开发规范">开发规范</Select.Option>
              <Select.Option value="设计规范">设计规范</Select.Option>
              <Select.Option value="会议记录">会议记录</Select.Option>
            </Select>
              </Col>
          <Col span={3}>
                <Select
              placeholder="状态"
                  value={filterStatus}
                  onChange={(value) => handleFilterChange('status', value)}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="draft">草稿</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
            </Select>
              </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                icon={<IconFolder />}
                onClick={() => setDirectoryVisible(true)}
                  >
                目录管理
                  </Button>
                  <Button
                type="outline"
                icon={<IconUpload />}
                onClick={() => setUploadVisible(true)}
              >
                上传文件
                  </Button>
                  <Button
                    type="primary"
                    icon={<IconPlus />}
                  >
                新建文档
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

      {/* 知识库统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={6}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#165dff', marginBottom: 8 }}>
              {knowledgeData.length}
                </div>
            <div style={{ color: '#86909c' }}>总文档数</div>
              </Card>
            </Col>
            <Col span={6}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#00b42a', marginBottom: 8 }}>
              {knowledgeData.filter(item => item.status === 'published').length}
                </div>
            <div style={{ color: '#86909c' }}>已发布</div>
              </Card>
            </Col>
            <Col span={6}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#ff7d00', marginBottom: 8 }}>
              {knowledgeData.reduce((sum, item) => sum + item.views, 0)}
                </div>
            <div style={{ color: '#86909c' }}>总浏览量</div>
              </Card>
            </Col>
            <Col span={6}>
          <Card style={{ textAlign: 'center', borderRadius: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1', marginBottom: 8 }}>
              {knowledgeData.reduce((sum, item) => sum + item.downloads, 0)}
                </div>
            <div style={{ color: '#86909c' }}>总下载量</div>
              </Card>
            </Col>
          </Row>

          {/* 知识库列表 */}
          <Card style={{ borderRadius: 12 }}>
            <Table
              columns={columns}
            data={knowledgeBases}
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
      </div>

      {/* 文件上传弹窗 */}
      <Modal
        title="上传文件"
        visible={uploadVisible}
        onCancel={() => {
          setUploadVisible(false)
          setSelectedFiles([])
        }}
        onOk={processFilesWithAI}
        style={{ width: 600 }}
        okText="开始处理"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">支持格式：{supportedFormats.join(', ').toUpperCase()}</Text>
        </div>
        
        <Upload
          multiple
          accept={supportedFormats.map(format => `.${format}`).join(',')}
          beforeUpload={handleFileUpload}
          showUploadList={{
            showRemoveIcon: true,
            onRemove: (file) => {
              setSelectedFiles(prev => prev.filter(f => f.uid !== file.uid))
            }
          }}
          style={{ width: '100%' }}
        >
          <div style={{
            border: '2px dashed #d9d9d9',
            borderRadius: 8,
            padding: '40px 20px',
            textAlign: 'center',
            background: '#fafafa'
          }}>
            <IconUpload style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16, marginBottom: 8 }}>点击或拖拽文件到此处上传</div>
            <div style={{ fontSize: 12, color: '#86909c' }}>
              支持单个或批量上传，文件将由AI自动处理并结构化
            </div>
          </div>
        </Upload>

        {selectedFiles.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text strong>已选择文件 ({selectedFiles.length}):</Text>
            <List
              dataSource={selectedFiles}
              render={(file) => (
                <List.Item>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconFile style={{ color: '#165dff' }} />
                    <span>{file.name}</span>
                    <Tag size="small">{(file.size / 1024 / 1024).toFixed(2)}MB</Tag>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>

      {/* 文件处理进度弹窗 */}
      <Modal
        title="AI处理中"
        visible={processingVisible}
        closable={false}
        footer={null}
        style={{ width: 400 }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size={48} style={{ marginBottom: 16 }} />
          <div style={{ marginBottom: 16 }}>
            <Text>正在使用AI处理文件...</Text>
          </div>
          <Progress 
            percent={processingProgress} 
            status={processingProgress === 100 ? 'success' : 'normal'}
            style={{ marginBottom: 16 }}
          />
          <Text type="secondary">
            {processingProgress === 100 ? '处理完成！' : '请稍候，这可能需要几分钟时间'}
          </Text>
        </div>
      </Modal>

      {/* 目录管理抽屉 */}
      <Drawer
        title="目录管理"
        visible={directoryVisible}
        onCancel={() => setDirectoryVisible(false)}
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<IconPlus />}
            size="small"
          >
            新建目录
          </Button>
        </div>
        <Tree
          treeData={directoryTree}
          defaultExpandAll
          onSelect={(selectedKeys) => {
            if (selectedKeys.length > 0) {
              setCurrentDirectory(selectedKeys[0])
            }
          }}
        />
      </Drawer>
    </AppLayout>
  )
}
