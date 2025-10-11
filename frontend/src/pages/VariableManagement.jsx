import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Modal, Form, Message, Table, Switch, Divider, Tooltip, Tabs } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconDelete, IconEdit, IconEye, IconRefresh, IconSettings } from '@arco-design/web-react/icon'
import AppLayout from '../components/AppLayout'
import Pagination from '../components/Pagination'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function VariableManagement({ currentPage, setCurrentPage }) {
  const [searchValue, setSearchValue] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [newVariableVisible, setNewVariableVisible] = useState(false)
  const [editVariableVisible, setEditVariableVisible] = useState(false)
  const [selectedVariable, setSelectedVariable] = useState(null)
  const [variables, setVariables] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('list')
  const pageSize = 10

  // 模拟变量数据
  const mockVariables = [
    {
      id: '1',
      name: '当前时间',
      key: 'current_time',
      value: '2024-01-15 14:30:00',
      category: '时间',
      type: 'datetime',
      description: '当前系统时间，格式为YYYY-MM-DD HH:mm:ss',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: '项目地点',
      key: 'project_location',
      value: '北京市朝阳区',
      category: '地点',
      type: 'location',
      description: '项目执行的主要地点',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '3',
      name: '任务优先级',
      key: 'task_priority',
      value: '高',
      category: '任务',
      type: 'select',
      description: '当前任务的优先级级别',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '4',
      name: '用户角色',
      key: 'user_role',
      value: '产品经理',
      category: '用户',
      type: 'text',
      description: '当前用户的角色身份',
      isActive: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    }
  ]

  // 加载变量数据
  useEffect(() => {
    loadVariables()
  }, [page, searchValue, filterCategory, filterType])

  const loadVariables = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      setTimeout(() => {
        let filteredData = [...mockVariables]
        
        // 搜索过滤
        if (searchValue) {
          filteredData = filteredData.filter(item => 
            item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.key.toLowerCase().includes(searchValue.toLowerCase()) ||
            item.description.toLowerCase().includes(searchValue.toLowerCase())
          )
        }
        
        // 分类过滤
        if (filterCategory !== 'all') {
          filteredData = filteredData.filter(item => item.category === filterCategory)
        }
        
        // 类型过滤
        if (filterType !== 'all') {
          filteredData = filteredData.filter(item => item.type === filterType)
        }
        
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedData = filteredData.slice(startIndex, endIndex)
        
        setVariables(paginatedData)
        setTotal(filteredData.length)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('加载变量失败:', error)
      setLoading(false)
    }
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setFilterCategory(value)
    } else if (type === 'type') {
      setFilterType(value)
    }
    setPage(1)
  }

  const handleCreate = () => {
    setSelectedVariable(null)
    setNewVariableVisible(true)
  }

  const handleEdit = (variable) => {
    setSelectedVariable(variable)
    setEditVariableVisible(true)
  }

  const handleCreateSubmit = async (values) => {
    try {
      // 模拟API调用
      const newVariable = {
        id: Date.now().toString(),
        ...values,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setVariables(prev => [newVariable, ...prev])
      setNewVariableVisible(false)
      Message.success('变量创建成功')
    } catch (error) {
      Message.error('创建失败')
    }
  }

  const handleUpdateSubmit = async (values) => {
    try {
      // 模拟API调用
      setVariables(prev => prev.map(item => 
        item.id === selectedVariable.id 
          ? { ...item, ...values, updatedAt: new Date().toISOString() }
          : item
      ))
      setEditVariableVisible(false)
      Message.success('变量更新成功')
    } catch (error) {
      Message.error('更新失败')
    }
  }

  const handleDelete = async (variable) => {
    try {
      // 模拟API调用
      setVariables(prev => prev.filter(item => item.id !== variable.id))
      Message.success('变量删除成功')
    } catch (error) {
      Message.error('删除失败')
    }
  }

  const handleToggleActive = async (variable) => {
    try {
      // 模拟API调用
      setVariables(prev => prev.map(item => 
        item.id === variable.id 
          ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() }
          : item
      ))
      Message.success(`变量已${variable.isActive ? '停用' : '启用'}`)
    } catch (error) {
      Message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '变量名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#86909c' }}>{record.key}</div>
        </div>
      )
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (text) => (
        <Tag color="blue" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 80,
      render: (text) => {
        const colorMap = {
          '时间': 'red',
          '地点': 'green',
          '任务': 'blue',
          '用户': 'purple'
        }
        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text) => {
        const typeMap = {
          'datetime': '时间',
          'location': '地点',
          'select': '选择',
          'text': '文本',
          'number': '数字'
        }
        return <Tag>{typeMap[text] || text}</Tag>
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => (
        <Tooltip content={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Switch 
          checked={isActive} 
          size="small"
          onChange={() => handleToggleActive({ isActive })}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip content="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<IconEdit />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip content="删除">
            <Button 
              type="text" 
              size="small" 
              icon={<IconDelete />}
              onClick={() => handleDelete(record)}
              style={{ color: '#f53f3f' }}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const categoryOptions = [
    { label: '全部', value: 'all' },
    { label: '时间', value: '时间' },
    { label: '地点', value: '地点' },
    { label: '任务', value: '任务' },
    { label: '用户', value: '用户' }
  ]

  const typeOptions = [
    { label: '全部', value: 'all' },
    { label: '时间', value: 'datetime' },
    { label: '地点', value: 'location' },
    { label: '选择', value: 'select' },
    { label: '文本', value: 'text' },
    { label: '数字', value: 'number' }
  ]

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="变量管理"
      pageSubtitle="管理短限定的具体变量，如时间、地点、任务内容等，用于Prompt生成"
    >
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        {/* 操作栏 */}
        <Card style={{ borderRadius: 12, marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col span={8}>
              <Space>
                <Input.Search
                  placeholder="搜索变量名称、键名或描述"
                  value={searchValue}
                  onChange={handleSearchChange}
                  style={{ width: 300 }}
                  allowClear
                />
              </Space>
            </Col>
            <Col span={8}>
              <Space>
                <Select
                  placeholder="选择分类"
                  value={filterCategory}
                  onChange={(value) => handleFilterChange('category', value)}
                  style={{ width: 120 }}
                >
                  {categoryOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  placeholder="选择类型"
                  value={filterType}
                  onChange={(value) => handleFilterChange('type', value)}
                  style={{ width: 120 }}
                >
                  {typeOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={handleCreate}
                >
                  新建变量
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 变量列表 */}
        <Card style={{ borderRadius: 12, flex: 1 }}>
          <Table
            columns={columns}
            data={variables}
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

        {/* 新建变量模态框 */}
        <Modal
          title="新建变量"
          visible={newVariableVisible}
          onCancel={() => setNewVariableVisible(false)}
          footer={null}
          style={{ width: 600 }}
        >
          <Form
            layout="vertical"
            onSubmit={handleCreateSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="变量名称"
              field="name"
              rules={[{ required: true, message: '请输入变量名称' }]}
            >
              <Input placeholder="例如：当前时间" />
            </Form.Item>
            <Form.Item
              label="变量键名"
              field="key"
              rules={[{ required: true, message: '请输入变量键名' }]}
            >
              <Input placeholder="例如：current_time" />
            </Form.Item>
            <Form.Item
              label="当前值"
              field="value"
              rules={[{ required: true, message: '请输入当前值' }]}
            >
              <Input placeholder="例如：2024-01-15 14:30:00" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="分类"
                  field="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Select placeholder="选择分类">
                    {categoryOptions.slice(1).map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="类型"
                  field="type"
                  rules={[{ required: true, message: '请选择类型' }]}
                >
                  <Select placeholder="选择类型">
                    {typeOptions.slice(1).map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="描述"
              field="description"
              rules={[{ required: true, message: '请输入描述' }]}
            >
              <Input.TextArea 
                placeholder="描述变量的用途和格式要求"
                rows={3}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  创建变量
                </Button>
                <Button onClick={() => setNewVariableVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑变量模态框 */}
        <Modal
          title="编辑变量"
          visible={editVariableVisible}
          onCancel={() => setEditVariableVisible(false)}
          footer={null}
          style={{ width: 600 }}
        >
          <Form
            layout="vertical"
            onSubmit={handleUpdateSubmit}
            autoComplete="off"
            initialValues={selectedVariable}
          >
            <Form.Item
              label="变量名称"
              field="name"
              rules={[{ required: true, message: '请输入变量名称' }]}
            >
              <Input placeholder="例如：当前时间" />
            </Form.Item>
            <Form.Item
              label="变量键名"
              field="key"
              rules={[{ required: true, message: '请输入变量键名' }]}
            >
              <Input placeholder="例如：current_time" />
            </Form.Item>
            <Form.Item
              label="当前值"
              field="value"
              rules={[{ required: true, message: '请输入当前值' }]}
            >
              <Input placeholder="例如：2024-01-15 14:30:00" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="分类"
                  field="category"
                  rules={[{ required: true, message: '请选择分类' }]}
                >
                  <Select placeholder="选择分类">
                    {categoryOptions.slice(1).map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="类型"
                  field="type"
                  rules={[{ required: true, message: '请选择类型' }]}
                >
                  <Select placeholder="选择类型">
                    {typeOptions.slice(1).map(option => (
                      <Select.Option key={option.value} value={option.value}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="描述"
              field="description"
              rules={[{ required: true, message: '请输入描述' }]}
            >
              <Input.TextArea 
                placeholder="描述变量的用途和格式要求"
                rows={3}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  更新变量
                </Button>
                <Button onClick={() => setEditVariableVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AppLayout>
  )
}
