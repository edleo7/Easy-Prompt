import React, { useMemo, useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Modal, Form, Message, Table, Switch, Divider, Tooltip } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconEdit, IconDelete, IconFolder, IconEye, IconSettings } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'
import Pagination from '../components/Pagination'
import { projectAPI } from '../services/api'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function ProjectManagement({ currentPage, setCurrentPage }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterImportance, setFilterImportance] = useState('all')
  const [createVisible, setCreateVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [viewMode, setViewMode] = useState('card') // card or table
  const [page, setPage] = useState(1)
  const pageSize = 12
  const [form] = Form.useForm()

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await projectAPI.getProjects()
      if (response.code === 200) {
        setProjects(response.data.tasks || [])
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 使用模拟数据作为fallback
      setProjects([
        {
          id: 1,
          name: 'EasyPrompt项目',
          description: '智能Prompt生成平台',
          type: '产品开发',
          status: '进行中',
          priority: 'high',
          progress: 75,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20'
        },
        {
          id: 2,
          name: '用户界面优化',
          description: '优化用户界面体验',
          type: 'UI/UX',
          status: '已完成',
          priority: 'medium',
          progress: 100,
          createdAt: '2024-01-10',
          updatedAt: '2024-01-18'
        },
        {
          id: 3,
          name: 'API接口开发',
          description: '开发后端API接口',
          type: '后端开发',
          status: '进行中',
          priority: 'high',
          progress: 60,
          createdAt: '2024-01-05',
          updatedAt: '2024-01-19'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // 创建项目
  const handleCreateProject = async (values) => {
    try {
      const response = await projectAPI.createProject({
        name: values.name,
        type: values.type,
        variables: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      })
      
      if (response.code === 201) {
        Message.success('项目创建成功')
        setCreateVisible(false)
        form.resetFields()
        loadProjects()
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 模拟创建成功
      const newProject = {
        id: Date.now(),
        name: values.name,
        description: values.description || '',
        type: values.type,
        status: '进行中',
        priority: 'medium',
        progress: 0,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      }
      setProjects(prev => [newProject, ...prev])
      setCreateVisible(false)
      form.resetFields()
      Message.success('项目创建成功（模拟数据）')
    }
  }

  // 更新项目
  const handleUpdateProject = async (id, values) => {
    try {
      const response = await projectAPI.updateProject(id, {
        name: values.name,
        type: values.type,
        variables: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
      })
      
      if (response.code === 200) {
        Message.success('项目更新成功')
        setEditVisible(false)
        setSelectedProject(null)
        loadProjects()
      }
    } catch (error) {
      console.error('更新项目失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 模拟更新成功
      setProjects(prev => prev.map(project => 
        project.id === id 
          ? { 
              ...project, 
              name: values.name,
              description: values.description || project.description,
              type: values.type,
              updatedAt: new Date().toISOString().split('T')[0]
            }
          : project
      ))
      setEditVisible(false)
      setSelectedProject(null)
      Message.success('项目更新成功（模拟数据）')
    }
  }

  // 删除项目
  const handleDeleteProject = async (id) => {
    try {
      const response = await projectAPI.deleteProject(id)
      if (response.code === 200) {
        Message.success('项目删除成功')
        loadProjects()
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      Message.warning('后端服务未启动，使用模拟数据')
      // 模拟删除成功
      setProjects(prev => prev.filter(project => project.id !== id))
      Message.success('项目删除成功（模拟数据）')
    }
  }

  // 表单处理函数
  const handleCreate = () => {
    form.validate().then((values) => {
      handleCreateProject(values)
    })
  }

  const handleEdit = (project) => {
    setSelectedProject(project)
    form.setFieldsValue({
      name: project.name,
      type: project.type,
      tags: project.variables ? project.variables.join(', ') : ''
    })
    setEditVisible(true)
  }

  const handleUpdate = () => {
    form.validate().then((values) => {
      handleUpdateProject(selectedProject.id, values)
    })
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗？删除后无法恢复。',
      onOk: () => {
        handleDeleteProject(id)
      }
    })
  }

  // 搜索和筛选功能
  const filteredProjects = useMemo(() => {
    let list = projects
    
    // 搜索筛选
    if (searchValue.trim()) {
      const query = searchValue.trim().toLowerCase()
      list = list.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // 状态筛选
    if (filterStatus !== 'all') {
      list = list.filter(p => p.status === filterStatus)
    }
    
    // 类型筛选
    if (filterType !== 'all') {
      list = list.filter(p => p.type === filterType)
    }
    
    // 重要性筛选
    if (filterImportance !== 'all') {
      list = list.filter(p => p.importance === filterImportance)
    }
    
    return list
  }, [projects, searchValue, filterStatus, filterType, filterImportance])

  const total = filteredProjects.length
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize)

  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Tag color={record.typeColor} size="small">{record.icon} {record.type}</Tag>
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <div style={{ 
          maxWidth: 300, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {text}
        </div>
      )
    },
    {
      title: '重要性',
      dataIndex: 'importance',
      key: 'importance',
      render: (importance) => (
        <Tag color={importance === 'high' ? 'red' : importance === 'medium' ? 'orange' : 'green'}>
          {importance === 'high' ? '高' : importance === 'medium' ? '中' : '低'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Switch 
          checked={status === 'active'} 
          size="small"
          onChange={(checked) => {
            // 更新状态逻辑
            console.log('更新状态:', checked)
          }}
        />
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
            icon={<IconEye />}
            onClick={() => {
              // 查看项目详情
              console.log('查看项目:', record)
            }}
          />
          <Button 
            type="text" 
            size="small" 
            icon={<IconEdit />}
            onClick={() => {
              setSelectedProject(record)
              setEditVisible(true)
            }}
          />
          <Button 
            type="text" 
            size="small" 
            icon={<IconDelete />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这个项目吗？',
                onOk: () => {
                  setProjects(prev => prev.filter(p => p.id !== record.id))
                  Message.success('项目删除成功')
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
      pageTitle="项目管理"
      pageSubtitle="管理您的所有项目"
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
              placeholder="搜索项目..."
              value={searchValue}
              onChange={setSearchValue}
              prefix={<IconSearch />}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="状态"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">未激活</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="类型"
              value={filterType}
              onChange={setFilterType}
            >
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="文本理解">文本理解</Select.Option>
              <Select.Option value="视觉理解">视觉理解</Select.Option>
              <Select.Option value="多轮对话">多轮对话</Select.Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select
              placeholder="重要性"
              value={filterImportance}
              onChange={setFilterImportance}
            >
              <Select.Option value="all">全部重要性</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type={viewMode === 'card' ? 'primary' : 'outline'}
                icon={<IconFolder />}
                onClick={() => setViewMode('card')}
              >
                卡片视图
              </Button>
              <Button 
                type={viewMode === 'table' ? 'primary' : 'outline'}
                icon={<IconSettings />}
                onClick={() => setViewMode('table')}
              >
                表格视图
              </Button>
              <Button 
                type="primary" 
                icon={<IconPlus />}
                onClick={() => setCreateVisible(true)}
              >
                新建项目
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

        {/* 项目列表 */}
        {viewMode === 'card' ? (
          <div>
            <Row gutter={[20, 20]}>
            {pagedProjects.map((project) => (
              <Col span={8} key={project.id}>
                <Card 
                  hoverable 
                  style={{ 
                    borderRadius: 12,
                    border: '1px solid #e5e6eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s ease'
                  }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}>
                    <Title heading={6} style={{ margin: 0, color: '#1d2129', fontSize: 16 }}>
                      {project.name}
                    </Title>
                    <Button type="text" size="small" style={{ color: '#86909c' }}>···</Button>
                  </div>
                  
                  <div style={{ 
                    color: '#4e5969', 
                    fontSize: 13, 
                    lineHeight: 1.5,
                    marginBottom: 16,
                    minHeight: 40
                  }}>
                    {project.description}
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                      <Tag 
                        color={project.typeColor} 
                        style={{ 
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          padding: '4px 8px'
                        }}
                      >
                        {project.icon} {project.version} {project.type}
                      </Tag>
                      <Tag 
                        color={project.importance === 'high' ? 'red' : project.importance === 'medium' ? 'orange' : 'green'}
                        size="small"
                      >
                        {project.importance === 'high' ? '高' : project.importance === 'medium' ? '中' : '低'}优先级
                      </Tag>
                    </Space>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <Button 
                      type="primary" 
                      size="small"
                      style={{ 
                        borderRadius: 6,
                        fontWeight: 500,
                        background: 'linear-gradient(135deg,#6aa1ff,#165dff)',
                        border: 'none'
                      }}
                    >
                      进入项目
                    </Button>
                    <Text type="secondary" style={{ fontSize: 11 }}>编辑于 {project.updatedAt}</Text>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    paddingTop: 12,
                    borderTop: '1px solid #f2f3f5'
                  }}>
                    <Avatar size={24} style={{ padding: 2 }}>
                      <img 
                        src={pureLogo} 
                        alt="User" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain',
                          borderRadius: 2
                        }} 
                      />
                    </Avatar>
                    <Text type="secondary" style={{ fontSize: 12 }}>{project.user}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        ) : (
          <Card style={{ borderRadius: 12 }}>
            <Table
              columns={columns}
              data={pagedProjects}
              pagination={false}
              rowKey="id"
            />
          </Card>
        )}

        {/* 分页 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 16,
          padding: '20px 24px',
          background: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e6eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          flexShrink: 0
        }}>
          <Text type="secondary" style={{ fontSize: 14 }}>共 {total} 个项目</Text>
          <Pagination 
            total={total} 
            pageSize={pageSize} 
            current={page} 
            onChange={setPage} 
            sizeOptions={[12]} 
            showTotal 
            showJumper={false} 
            showMore={false}
            style={{ margin: 0 }}
          />
        </div>
      </div>

      {/* 新建项目弹窗 */}
      <Modal
        title="新建项目"
        visible={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={() => {
          form.validate().then((values) => {
            const id = projects.length ? Math.max(...projects.map(p => p.id)) + 1 : 1
            const newProject = {
              id,
              name: values.name,
              description: values.description || '— —',
              icon: values.type === '视觉理解' ? '👁️' : values.type === '多轮对话' ? '💬' : '📝',
              type: values.type,
              version: 'V1',
              typeColor: values.type === '视觉理解' ? 'blue' : values.type === '多轮对话' ? 'purple' : 'green',
              user: '你',
              updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              status: 'active',
              importance: values.importance || 'medium',
              tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : []
            }
            setProjects(prev => [newProject, ...prev])
            setCreateVisible(false)
            form.resetFields()
            Message.success('项目创建成功')
          })
        }}
        style={{ width: 600 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="项目名称" field="name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item label="项目类型" field="type" initialValue="文本理解">
            <Select>
              <Select.Option value="文本理解">文本理解</Select.Option>
              <Select.Option value="视觉理解">视觉理解</Select.Option>
              <Select.Option value="多轮对话">多轮对话</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="项目描述" field="description">
            <Input.TextArea autoSize={{ minRows: 3 }} placeholder="请描述项目用途和目标" />
          </Form.Item>
          <Form.Item label="重要性" field="importance" initialValue="medium">
            <Select>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签" field="tags">
            <Input placeholder="请输入标签，用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        title="编辑项目"
        visible={editVisible}
        onCancel={() => {
          setEditVisible(false)
          setSelectedProject(null)
        }}
        onOk={() => {
          form.validate().then((values) => {
            setProjects(prev => prev.map(p => 
              p.id === selectedProject.id 
                ? { ...p, ...values, updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }) }
                : p
            ))
            setEditVisible(false)
            setSelectedProject(null)
            Message.success('项目更新成功')
          })
        }}
        style={{ width: 600 }}
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={selectedProject}
        >
          <Form.Item label="项目名称" field="name" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item label="项目类型" field="type">
            <Select>
              <Select.Option value="文本理解">文本理解</Select.Option>
              <Select.Option value="视觉理解">视觉理解</Select.Option>
              <Select.Option value="多轮对话">多轮对话</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="项目描述" field="description">
            <Input.TextArea autoSize={{ minRows: 3 }} placeholder="请描述项目用途和目标" />
          </Form.Item>
          <Form.Item label="重要性" field="importance">
            <Select>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="标签" field="tags">
            <Input placeholder="请输入标签，用逗号分隔" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}
