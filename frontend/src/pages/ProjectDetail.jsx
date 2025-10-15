import React, { useState, useEffect } from 'react'
import { Button, Space, Message, Spin, Typography, Breadcrumb, Layout, Card } from '@arco-design/web-react'
import { IconLeft, IconPlus, IconSave, IconPlay, IconDownload } from '@arco-design/web-react/icon'
import AppLayout from '../components/AppLayout'
import { getProjectDetail, getProjectPrompts, createPrompt, updatePrompt, deletePrompt } from '../services/project'
import { formatDateTime } from '../utils/format'

const { Title, Text } = Typography
const { Sider, Content } = Layout

export default function ProjectDetail({ currentPage, setCurrentPage }) {
  const [project, setProject] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [promptContent, setPromptContent] = useState('')
  const [promptName, setPromptName] = useState('')

  // 从路由中提取项目ID
  const projectId = currentPage.replace('project-detail-', '')

  useEffect(() => {
    if (projectId) {
      loadProjectDetail()
      loadPrompts()
    }
  }, [projectId])

  const loadProjectDetail = async () => {
    try {
      setLoading(true)
      const response = await getProjectDetail(projectId)
      if (response.code === 200) {
        setProject(response.data)
      }
    } catch (error) {
      console.error('加载项目详情失败:', error)
      Message.error('加载项目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const loadPrompts = async () => {
    try {
      const response = await getProjectPrompts(projectId)
      if (response.code === 200) {
        setPrompts(response.data.prompts || [])
      }
    } catch (error) {
      console.error('加载Prompt列表失败:', error)
      Message.error('加载Prompt列表失败')
    }
  }

  const handleCreatePrompt = async () => {
    if (!promptName.trim()) {
      Message.error('请输入Prompt名称')
      return
    }

    try {
      const response = await createPrompt(projectId, {
        name: promptName,
        content: promptContent,
        status: 'draft'
      })

      if (response.code === 201) {
        Message.success('Prompt创建成功')
        setPromptName('')
        setPromptContent('')
        setSelectedPrompt(null)
        loadPrompts()
      }
    } catch (error) {
      console.error('创建Prompt失败:', error)
      Message.error('创建Prompt失败')
    }
  }

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return

    try {
      const response = await updatePrompt(selectedPrompt.id, {
        name: promptName,
        content: promptContent
      })

      if (response.code === 200) {
        Message.success('Prompt更新成功')
        loadPrompts()
      }
    } catch (error) {
      console.error('更新Prompt失败:', error)
      Message.error('更新Prompt失败')
    }
  }

  const handleDeletePrompt = async (promptId) => {
    try {
      const response = await deletePrompt(promptId)
      if (response.code === 200) {
        Message.success('Prompt删除成功')
        if (selectedPrompt?.id === promptId) {
          setSelectedPrompt(null)
          setPromptName('')
          setPromptContent('')
        }
        loadPrompts()
      }
    } catch (error) {
      console.error('删除Prompt失败:', error)
      Message.error('删除Prompt失败')
    }
  }

  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt)
    setPromptName(prompt.name)
    setPromptContent(prompt.content)
  }

  const handleSave = () => {
    if (selectedPrompt) {
      handleUpdatePrompt()
    } else {
      handleCreatePrompt()
    }
  }

  const handleTest = () => {
    // TODO: 实现Prompt测试功能
    Message.info('Prompt测试功能开发中...')
  }

  const handleExport = () => {
    // TODO: 实现Prompt导出功能
    Message.info('Prompt导出功能开发中...')
  }

  if (loading) {
    return (
      <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size="large" />
        </div>
      </AppLayout>
    )
  }

  if (!project) {
    return (
      <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">项目不存在</Text>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部导航 */}
        <div style={{ marginBottom: 16 }}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <Button 
                type="text" 
                icon={<IconLeft />}
                onClick={() => setCurrentPage('project-management')}
              >
                项目管理
              </Button>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{project.name}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/* 项目信息 */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title heading={4} style={{ margin: 0, marginBottom: 8 }}>
                {project.name}
              </Title>
              {project.description && (
                <Text type="secondary">{project.description}</Text>
              )}
            </div>
            <Space>
              <Button icon={<IconSave />} onClick={handleSave}>
                保存
              </Button>
              <Button icon={<IconPlay />} onClick={handleTest}>
                测试
              </Button>
              <Button icon={<IconDownload />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </div>
        </Card>

        {/* 主要内容区域 */}
        <Layout style={{ flex: 1, background: 'transparent' }}>
          {/* 左侧Prompt列表 */}
          <Sider width={300} style={{ background: 'transparent', marginRight: 16 }}>
            <Card title="Prompt列表" style={{ height: '100%' }}>
              <div style={{ marginBottom: 16 }}>
                <Button 
                  type="primary" 
                  icon={<IconPlus />}
                  onClick={() => {
                    setSelectedPrompt(null)
                    setPromptName('')
                    setPromptContent('')
                  }}
                  block
                >
                  新建Prompt
                </Button>
              </div>
              
              <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                {prompts.map((prompt) => (
                  <Card
                    key={prompt.id}
                    size="small"
                    hoverable
                    style={{
                      marginBottom: 8,
                      cursor: 'pointer',
                      border: selectedPrompt?.id === prompt.id ? '1px solid var(--color-primary-6)' : '1px solid var(--color-border-2)'
                    }}
                    onClick={() => handleSelectPrompt(prompt)}
                  >
                    <div>
                      <Text style={{ fontWeight: 500 }}>{prompt.name}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDateTime(prompt.updatedAt)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </Sider>

          {/* 右侧编辑区域 */}
          <Content style={{ background: 'transparent' }}>
            <Card title={selectedPrompt ? '编辑Prompt' : '新建Prompt'} style={{ height: '100%' }}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="请输入Prompt名称"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--color-border-2)',
                    borderRadius: 4,
                    fontSize: 14
                  }}
                />
              </div>
              
              <textarea
                placeholder="请输入Prompt内容..."
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 400px)',
                  padding: '12px',
                  border: '1px solid var(--color-border-2)',
                  borderRadius: 4,
                  fontSize: 14,
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  resize: 'none'
                }}
              />
            </Card>
          </Content>
        </Layout>
      </div>
    </AppLayout>
  )
}
