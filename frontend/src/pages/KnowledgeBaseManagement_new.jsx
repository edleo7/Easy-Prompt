import React, { useState } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Badge, Modal, Form, Message, Table, Switch, Divider, Tooltip, Upload, Progress } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconSend, IconEye, IconMessage as IconChat, IconThunderbolt, IconSettings, IconFile, IconFolder, IconDelete, IconEdit, IconEye as IconView, IconDownload, IconUpload, IconTag, IconCalendar, IconUser as IconAuthor } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function KnowledgeBaseManagement({ currentPage, setCurrentPage }) {
  const [searchValue, setSearchValue] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

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
      downloads: 89
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
      downloads: 45
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
      downloads: 156
    }
  ]

  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <Tag color="blue" size="small">{record.category}</Tag>
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} style={{ backgroundColor: '#165dff' }}>
            {author.charAt(0)}
          </Avatar>
          <span>{author}</span>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '浏览量',
      dataIndex: 'views',
      key: 'views',
      render: (views) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconEye style={{ fontSize: 12, color: '#86909c' }} />
          <span>{views}</span>
        </div>
      )
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconDownload style={{ fontSize: 12, color: '#86909c' }} />
          <span>{downloads}</span>
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="text" size="small" icon={<IconView />} />
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
      pageTitle="知识库管理"
      pageSubtitle="管理您的知识库"
    >
      {/* 操作栏 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Input
              placeholder="搜索知识库..."
              value={searchValue}
              onChange={setSearchValue}
              prefix={<IconSearch />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="分类"
              value={filterCategory}
              onChange={setFilterCategory}
            >
              <Select.Option value="all">全部分类</Select.Option>
              <Select.Option value="技术文档">技术文档</Select.Option>
              <Select.Option value="开发规范">开发规范</Select.Option>
              <Select.Option value="设计规范">设计规范</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              value={filterStatus}
              onChange={setFilterStatus}
            >
              <Select.Option value="all">全部状态</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
              <Select.Option value="draft">草稿</Select.Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<IconPlus />}
            >
              新建文档
            </Button>
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
          data={knowledgeData}
          pagination={{
            pageSize: 10,
            showTotal: true
          }}
          rowKey="id"
        />
      </Card>
    </AppLayout>
  )
}
