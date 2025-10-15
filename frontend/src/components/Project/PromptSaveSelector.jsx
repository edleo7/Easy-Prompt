import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Message, Button, Space, Radio, List, Typography, Tag } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconFolder } from '@arco-design/web-react/icon'
import { getProjects } from '../../services/project'
import { formatDateTime } from '../../utils/format'

const FormItem = Form.Item
const Option = Select.Option
const { Text } = Typography

export default function PromptSaveSelector({ 
  visible, 
  onClose, 
  onSave, 
  promptData,
  loading = false 
}) {
  const [form] = Form.useForm()
  const [saveType, setSaveType] = useState('existing') // 'existing' | 'new'
  const [projects, setProjects] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    if (visible) {
      loadProjects()
    }
  }, [visible])

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const response = await getProjects({ limit: 50 })
      if (response.code === 200) {
        setProjects(response.data.tasks || [])
      }
    } catch (error) {
      console.error('加载项目列表失败:', error)
      Message.error('加载项目列表失败')
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleSave = async () => {
    try {
      if (saveType === 'existing' && !selectedProject) {
        Message.error('请选择一个项目')
        return
      }

      if (saveType === 'new') {
        const values = await form.validate()
        const projectData = {
          name: values.projectName,
          description: values.projectDescription,
          type: 'PROMPT',
          status: 'active'
        }
        
        await onSave(projectData, promptData)
      } else {
        await onSave(selectedProject, promptData)
      }
      
      Message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setSaveType('existing')
    setSearchValue('')
    setSelectedProject(null)
    onClose()
  }

  // 过滤项目列表
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchValue.toLowerCase()))
  )

  return (
    <Modal
      title="保存Prompt到项目"
      visible={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={loading}
      style={{ width: 700 }}
      okText="保存"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <Radio.Group 
          value={saveType} 
          onChange={setSaveType}
          type="button"
        >
          <Radio value="existing">保存到现有项目</Radio>
          <Radio value="new">创建新项目</Radio>
        </Radio.Group>
      </div>

      {saveType === 'existing' ? (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="搜索项目..."
              prefix={<IconSearch />}
              value={searchValue}
              onChange={setSearchValue}
              allowClear
            />
          </div>

          <div style={{ 
            maxHeight: 300, 
            overflowY: 'auto',
            border: '1px solid var(--color-border-2)',
            borderRadius: 4
          }}>
            {loadingProjects ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Text type="secondary">加载中...</Text>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <Text type="secondary">暂无项目</Text>
              </div>
            ) : (
              <List
                dataSource={filteredProjects}
                render={(project) => (
                  <List.Item
                    key={project.id}
                    style={{
                      cursor: 'pointer',
                      background: selectedProject?.id === project.id ? 'var(--color-fill-2)' : 'transparent',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border-2)'
                    }}
                    onClick={() => setSelectedProject(project)}
                  >
                    <List.Item.Meta
                      avatar={<IconFolder style={{ fontSize: 20, color: 'var(--color-primary-6)' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontWeight: 500 }}>{project.name}</Text>
                          <Tag size="small" color="blue">
                            {project._count?.prompts || 0} 个Prompt
                          </Tag>
                        </div>
                      }
                      description={
                        <div>
                          {project.description && (
                            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
                              {project.description}
                            </Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            创建于 {formatDateTime(project.createdAt)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem
            label="项目名称"
            field="projectName"
            rules={[
              { required: true, message: '请输入项目名称' },
              { minLength: 2, message: '项目名称至少2个字符' },
              { maxLength: 50, message: '项目名称最多50个字符' }
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </FormItem>

          <FormItem
            label="项目描述"
            field="projectDescription"
            rules={[
              { maxLength: 200, message: '项目描述最多200个字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="请输入项目描述（可选）"
              rows={3}
              showWordLimit
              maxLength={200}
            />
          </FormItem>
        </Form>
      )}

      {selectedProject && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'var(--color-fill-1)', 
          borderRadius: 4 
        }}>
          <Text type="secondary">已选择项目：</Text>
          <Text style={{ fontWeight: 500, marginLeft: 8 }}>
            {selectedProject.name}
          </Text>
        </div>
      )}
    </Modal>
  )
}
