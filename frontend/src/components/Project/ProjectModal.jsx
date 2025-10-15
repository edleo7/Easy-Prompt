import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Message, Tag, Space, Button } from '@arco-design/web-react'
import { IconPlus } from '@arco-design/web-react/icon'
import CoverUploader from '../KnowledgeBase/CoverUploader'

const FormItem = Form.Item
const Option = Select.Option

export default function ProjectModal({ 
  visible, 
  onClose, 
  onSave, 
  project = null, 
  loading = false 
}) {
  const [form] = Form.useForm()
  const [tags, setTags] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [coverUrl, setCoverUrl] = useState(null)

  const isEdit = !!project

  useEffect(() => {
    if (visible && project) {
      form.setFieldsValue({
        name: project.name,
        description: project.description,
        type: project.type || 'PROMPT',
        status: project.status || 'draft',
        workspaceId: project.workspaceId
      })
      setTags(project.tags ? JSON.parse(project.tags) : [])
      setCoverUrl(project.coverImage)
    } else {
      form.resetFields()
      setTags([])
      setInputValue('')
      setCoverUrl(null)
    }
  }, [visible, project, form])

  const handleAddTag = () => {
    if (inputValue && tags.indexOf(inputValue) === -1) {
      setTags([...tags, inputValue])
    }
    setInputValue('')
  }

  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleOk = async () => {
    try {
      const values = await form.validate()
      
      const projectData = {
        ...values,
        tags,
        coverImage: coverUrl
      }

      await onSave(projectData)
      Message.success(isEdit ? '项目更新成功' : '项目创建成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    setTags([])
    setInputValue('')
    setCoverUrl(null)
    onClose()
  }

  return (
    <Modal
      title={isEdit ? '编辑项目' : '创建项目'}
      visible={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      style={{ width: 600 }}
      okText={isEdit ? '更新' : '创建'}
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <FormItem
          label="项目名称"
          field="name"
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
          field="description"
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

        <FormItem
          label="项目类型"
          field="type"
          rules={[{ required: true, message: '请选择项目类型' }]}
        >
          <Select placeholder="请选择项目类型">
            <Option value="PROMPT">Prompt项目</Option>
            <Option value="VISION">视觉项目</Option>
            <Option value="CHAT">对话项目</Option>
          </Select>
        </FormItem>

        <FormItem
          label="项目状态"
          field="status"
          rules={[{ required: true, message: '请选择项目状态' }]}
        >
          <Select placeholder="请选择项目状态">
            <Option value="draft">草稿</Option>
            <Option value="active">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="archived">已归档</Option>
          </Select>
        </FormItem>

        <FormItem
          label="工作空间"
          field="workspaceId"
        >
          <Select placeholder="请选择工作空间（可选）">
            <Option value="">默认工作空间</Option>
            {/* TODO: 从API获取工作空间列表 */}
          </Select>
        </FormItem>

        <FormItem
          label="项目标签"
        >
          <div>
            <div style={{ marginBottom: 8 }}>
              <Space wrap>
                {tags.map((tag, index) => (
                  <Tag
                    key={index}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    color="blue"
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
            <Space.Compact>
              <Input
                value={inputValue}
                onChange={setInputValue}
                placeholder="输入标签名称"
                onPressEnter={handleAddTag}
                style={{ width: 200 }}
              />
              <Button
                type="outline"
                icon={<IconPlus />}
                onClick={handleAddTag}
                disabled={!inputValue.trim()}
              >
                添加
              </Button>
            </Space.Compact>
          </div>
        </FormItem>

        <FormItem
          label="封面图"
        >
          <CoverUploader
            kbId={project?.id}
            currentCover={coverUrl}
            onUploadSuccess={(url) => {
              setCoverUrl(url)
            }}
          />
        </FormItem>
      </Form>
    </Modal>
  )
}
