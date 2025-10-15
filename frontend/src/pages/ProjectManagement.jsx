import React, { useMemo, useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Message, Modal, Popconfirm } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconApps, IconList } from '@arco-design/web-react/icon'
import AppLayout from '../components/AppLayout'
import ProjectCard from '../components/Project/ProjectCard'
import ProjectModal from '../components/Project/ProjectModal'
import { getProjects, createProject, updateProject, deleteProject } from '../services/project'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function ProjectManagement({ currentPage, setCurrentPage }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('card') // card or list
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12
  
  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // 加载项目数据
  useEffect(() => {
    loadProjects()
  }, [page, searchValue, filterStatus, filterType])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: pageSize,
        search: searchValue || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined
      }
      
      const response = await getProjects(params)
      if (response.code === 200) {
        setProjects(response.data.tasks || [])
        setTotal(response.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('加载项目失败:', error)
      Message.error('加载项目失败')
    } finally {
      setLoading(false)
    }
  }

  // 创建项目
  const handleCreateProject = async (projectData) => {
    setModalLoading(true)
    try {
      const response = await createProject(projectData)
      if (response.code === 201) {
        Message.success('项目创建成功')
        setCreateModalVisible(false)
        loadProjects()
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      Message.error('创建项目失败')
    } finally {
      setModalLoading(false)
    }
  }

  // 更新项目
  const handleUpdateProject = async (projectData) => {
    setModalLoading(true)
    try {
      const response = await updateProject(selectedProject.id, projectData)
      if (response.code === 200) {
        Message.success('项目更新成功')
        setEditModalVisible(false)
        setSelectedProject(null)
        loadProjects()
      }
    } catch (error) {
      console.error('更新项目失败:', error)
      Message.error('更新项目失败')
    } finally {
      setModalLoading(false)
    }
  }

  // 删除项目
  const handleDeleteProject = async (project) => {
    try {
      const response = await deleteProject(project.id)
      if (response.code === 200) {
        Message.success('项目删除成功')
        loadProjects()
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      Message.error('删除项目失败')
    }
  }

  // 事件处理函数
  const handleEdit = (project) => {
    setSelectedProject(project)
    setEditModalVisible(true)
  }

  const handleView = (project) => {
    // 跳转到项目详情页
    setCurrentPage(`project-detail-${project.id}`)
  }

  const handleDuplicate = (project) => {
    // TODO: 实现项目复制功能
    Message.info('项目复制功能开发中...')
  }

  // 重置搜索
  const handleSearchReset = () => {
    setSearchValue('')
    setFilterStatus('all')
    setFilterType('all')
    setPage(1)
  }


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
                allowClear
              />
            </Col>
            <Col span={3}>
              <Select
                placeholder="状态"
                value={filterStatus}
                onChange={setFilterStatus}
              >
                <Select.Option value="all">全部状态</Select.Option>
                <Select.Option value="draft">草稿</Select.Option>
                <Select.Option value="active">进行中</Select.Option>
                <Select.Option value="completed">已完成</Select.Option>
                <Select.Option value="archived">已归档</Select.Option>
              </Select>
            </Col>
            <Col span={3}>
              <Select
                placeholder="类型"
                value={filterType}
                onChange={setFilterType}
              >
                <Select.Option value="all">全部类型</Select.Option>
                <Select.Option value="PROMPT">Prompt项目</Select.Option>
                <Select.Option value="VISION">视觉项目</Select.Option>
                <Select.Option value="CHAT">对话项目</Select.Option>
              </Select>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button 
                  type={viewMode === 'card' ? 'primary' : 'outline'}
                  icon={<IconApps />}
                  onClick={() => setViewMode('card')}
                >
                  卡片视图
                </Button>
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'outline'}
                  icon={<IconList />}
                  onClick={() => setViewMode('list')}
                >
                  列表视图
                </Button>
                <Button 
                  type="primary" 
                  icon={<IconPlus />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  新建项目
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 项目列表 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {viewMode === 'card' ? (
            <Row gutter={[20, 20]}>
              {projects.map((project) => (
                <Col span={8} key={project.id}>
                  <ProjectCard
                    project={project}
                    onEdit={handleEdit}
                    onDelete={handleDeleteProject}
                    onView={handleView}
                    onDuplicate={handleDuplicate}
                    loading={loading}
                  />
                </Col>
              ))}
            </Row>
          ) : (
            <Card style={{ borderRadius: 12 }}>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#86909C' }}>
                列表视图开发中...
              </div>
            </Card>
          )}
        </div>

        {/* 分页 */}
        {total > 0 && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button 
                size="small" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <Text type="secondary" style={{ fontSize: 14 }}>
                第 {page} 页，共 {Math.ceil(total / pageSize)} 页
              </Text>
              <Button 
                size="small" 
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 新建项目模态框 */}
      <ProjectModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleCreateProject}
        loading={modalLoading}
      />

      {/* 编辑项目模态框 */}
      <ProjectModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          setSelectedProject(null)
        }}
        onSave={handleUpdateProject}
        project={selectedProject}
        loading={modalLoading}
      />
    </AppLayout>
  )
}

