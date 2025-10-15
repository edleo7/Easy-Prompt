/**
 * 知识编辑界面组件
 * 统一编辑文件和文件夹的元数据
 */

import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Message, 
  Typography,
  Divider,
  Tag,
  Upload,
  Image
} from '@arco-design/web-react'
import { IconPlus, IconDelete, IconUpload } from '@arco-design/web-react/icon'
import { formatFileSize, formatDate } from '../../utils/format'

const { Text, Title } = Typography
const { TextArea } = Input
const { Option } = Select

const KnowledgeEditor = ({ 
  visible, 
  onClose, 
  item, 
  onSave,
  loading = false 
}) => {
  const [form] = Form.useForm()
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [previewImage, setPreviewImage] = useState('')

  // 初始化表单数据
  useEffect(() => {
    if (item && visible) {
      form.setFieldsValue({
        name: item.name,
        description: item.description || '',
        tags: item.tags || [],
        type: item.type,
        size: item.size,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })
      setTags(item.tags || [])
      setPreviewImage(item.thumbnail || item.coverImage || '')
    }
  }, [item, visible, form])

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()]
      setTags(newTags)
      form.setFieldValue('tags', newTags)
      setNewTag('')
    }
  }

  // 删除标签
  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setFieldValue('tags', newTags)
  }

  // 处理保存
  const handleSave = async () => {
    try {
      const values = await form.validate()
      const updatedItem = {
        ...item,
        ...values,
        tags: tags
      }
      await onSave(updatedItem)
      Message.success('保存成功')
      onClose()
    } catch (error) {
      console.error('保存失败:', error)
      Message.error('保存失败')
    }
  }

  // 处理图片上传
  const handleImageUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target.result)
    }
    reader.readAsDataURL(file)
    return false // 阻止自动上传
  }

  return (
    <Modal
      title={`编辑 ${item?.type === 'folder' ? '文件夹' : '文件'}`}
      visible={visible}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={loading}
      width={600}
      style={{ top: 20 }}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        {/* 基本信息 */}
        <Title level={5}>基本信息</Title>
        
        <Form.Item
          label="名称"
          field="name"
          rules={[
            { required: true, message: '请输入名称' },
            { maxLength: 100, message: '名称不能超过100个字符' }
          ]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>

        <Form.Item
          label="描述"
          field="description"
          rules={[
            { maxLength: 500, message: '描述不能超过500个字符' }
          ]}
        >
          <TextArea 
            placeholder="请输入描述" 
            rows={3}
            showWordLimit
            maxLength={500}
          />
        </Form.Item>

        {/* 标签管理 */}
        <Form.Item label="标签">
          <div>
            <Space wrap style={{ marginBottom: 8 }}>
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                  color="blue"
                >
                  {tag}
                </Tag>
              ))}
            </Space>
            <Space>
              <Input
                placeholder="添加标签"
                value={newTag}
                onChange={setNewTag}
                onPressEnter={handleAddTag}
                style={{ width: 120 }}
              />
              <Button 
                type="outline" 
                icon={<IconPlus />}
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                添加
              </Button>
            </Space>
          </div>
        </Form.Item>

        {/* 文件信息（仅文件显示） */}
        {item?.type !== 'folder' && (
          <>
            <Divider />
            <Title level={5}>文件信息</Title>
            
            <Form.Item label="文件类型">
              <Text>{item?.mimeType || '-'}</Text>
            </Form.Item>

            <Form.Item label="文件大小">
              <Text>{item?.size ? formatFileSize(item.size) : '-'}</Text>
            </Form.Item>

            <Form.Item label="创建时间">
              <Text>{item?.createdAt ? formatDate(item.createdAt) : '-'}</Text>
            </Form.Item>

            <Form.Item label="修改时间">
              <Text>{item?.updatedAt ? formatDate(item.updatedAt) : '-'}</Text>
            </Form.Item>
          </>
        )}

        {/* 缩略图/封面（仅文件显示） */}
        {item?.type !== 'folder' && (
          <>
            <Divider />
            <Title level={5}>缩略图</Title>
            
            <Form.Item>
              <div>
                {previewImage && (
                  <div style={{ marginBottom: 12 }}>
                    <Image
                      src={previewImage}
                      width={120}
                      height={80}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                    />
                  </div>
                )}
                <Upload
                  accept="image/*"
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                >
                  <Button icon={<IconUpload />}>
                    {previewImage ? '更换缩略图' : '上传缩略图'}
                  </Button>
                </Upload>
              </div>
            </Form.Item>
          </>
        )}

        {/* 权限设置 */}
        <Divider />
        <Title level={5}>权限设置</Title>
        
        <Form.Item
          label="访问权限"
          field="permission"
          initialValue="private"
        >
          <Select>
            <Option value="private">私有</Option>
            <Option value="public">公开</Option>
            <Option value="team">团队</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="编辑权限"
          field="editPermission"
          initialValue="owner"
        >
          <Select>
            <Option value="owner">仅所有者</Option>
            <Option value="team">团队成员</Option>
            <Option value="public">所有人</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default KnowledgeEditor
