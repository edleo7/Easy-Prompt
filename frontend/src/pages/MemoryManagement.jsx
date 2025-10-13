import React, { useState } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Badge, Modal, Form, Message, Table, Switch, Divider, Tooltip } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconSend, IconEye, IconMessage as IconChat, IconThunderbolt, IconSettings, IconFile, IconFolder, IconDelete, IconEdit, IconEye as IconView, IconDownload, IconUpload } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function MemoryManagement({ currentPage, setCurrentPage }) {
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [newMemoryVisible, setNewMemoryVisible] = useState(false)
  const [editMemoryVisible, setEditMemoryVisible] = useState(false)
  const [selectedMemory, setSelectedMemory] = useState(null)

  // 模拟记忆数据
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

  const columns = [
    {
      title: '记忆标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Tag color="blue" size="small">{record.type}</Tag>
        </div>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
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
          <Button type="text" size="small" icon={<IconEdit />} />
          <Button type="text" size="small" icon={<IconDelete />} />
        </Space>
      )
    }
  ]

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="记忆管理"
      pageSubtitle="管理长期记忆"
    >
      {/* 操作栏 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索记忆..."
              value={searchValue}
              onChange={setSearchValue}
              prefix={<IconSearch />}
            />
          </Col>
          <Col span={4}>
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
          <Col span={4}>
            <Select
              placeholder="类型"
              value={filterType}
              onChange={setFilterType}
            >
              <Select.Option value="all">全部类型</Select.Option>
              <Select.Option value="用户偏好">用户偏好</Select.Option>
              <Select.Option value="工作习惯">工作习惯</Select.Option>
              <Select.Option value="技术偏好">技术偏好</Select.Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<IconPlus />}
              onClick={() => setNewMemoryVisible(true)}
            >
              新建记忆
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 记忆列表 */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          data={memoryData}
          pagination={{
            pageSize: 10,
            showTotal: true
          }}
          rowKey="id"
        />
      </Card>

      {/* 新建记忆弹窗 */}
      <Modal
        title="新建记忆"
        visible={newMemoryVisible}
        onCancel={() => setNewMemoryVisible(false)}
        onOk={() => {
          Message.success('记忆创建成功')
          setNewMemoryVisible(false)
        }}
      >
        <Form layout="vertical">
          <Form.Item label="记忆标题" required>
            <Input placeholder="请输入记忆标题" />
          </Form.Item>
          <Form.Item label="记忆类型" required>
            <Select placeholder="请选择记忆类型">
              <Select.Option value="用户偏好">用户偏好</Select.Option>
              <Select.Option value="工作习惯">工作习惯</Select.Option>
              <Select.Option value="技术偏好">技术偏好</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="记忆内容" required>
            <Input.TextArea 
              placeholder="请输入记忆内容"
              autoSize={{ minRows: 3 }}
            />
          </Form.Item>
          <Form.Item label="重要性">
            <Select placeholder="请选择重要性">
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  )
}
