import React, { useState, useEffect } from 'react'
import { Button, Input, Grid, Tabs, Modal, Form, Message, Spin, Empty, Upload } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconDown, IconUpload } from '@arco-design/web-react/icon'
import AppLayout from '../components/AppLayout'
import KnowledgeCard from '../components/KnowledgeBase/KnowledgeCard'
import CoverUploader from '../components/KnowledgeBase/CoverUploader'
import { 
  getKnowledgeBases, 
  createKnowledgeBase, 
  updateKnowledgeBase, 
  deleteKnowledgeBase 
} from '../services/knowledgeBase'

const { Row, Col } = Grid
const TabPane = Tabs.TabPane
const FormItem = Form.Item

export default function KnowledgeBaseManagement({ currentPage, setCurrentPage }) {
  const [knowledgeBases, setKnowledgeBases] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [currentKb, setCurrentKb] = useState(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [coverUrl, setCoverUrl] = useState(null)

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const response = await getKnowledgeBases({ 
        search: searchValue,
        // 这里可以根据activeTab过滤
      })
      
      if (response.code === 200) {
        setKnowledgeBases(response.data.knowledgeBases)
      }
    } catch (error) {
      console.error('加载知识库失败:', error)
      Message.error('加载知识库失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKnowledgeBases()
  }, [searchValue])

  // 创建知识库
  const handleCreate = async (values) => {
    try {
      const response = await createKnowledgeBase({
        ...values,
        workspaceId: 'default-workspace', // 临时使用默认工作空间
        tags: values.tags ? values.tags.split(',').map(t => t.trim()) : []
      })

      if (response.code === 201) {
        Message.success('知识库创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('创建失败:', error)
      Message.error('创建知识库失败')
    }
  }

  // 编辑知识库
  const handleEdit = (kb) => {
    setCurrentKb(kb)
    editForm.setFieldsValue({
      name: kb.name,
      description: kb.description,
      tags: kb.tags?.join(', ') || '',
      coverImage: kb.coverImage
    })
    setEditModalVisible(true)
  }

  // 更新知识库
  const handleUpdate = async (values) => {
    try {
      const response = await updateKnowledgeBase(currentKb.id, {
        ...values,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()) : []
      })

      if (response.code === 200) {
        Message.success('更新成功')
        setEditModalVisible(false)
        editForm.resetFields()
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('更新失败:', error)
      Message.error('更新失败')
    }
  }

  // 删除知识库
  const handleDelete = async (kb) => {
    try {
      const response = await deleteKnowledgeBase(kb.id)
      
      if (response.code === 200) {
        Message.success('删除成功')
        loadKnowledgeBases()
      }
    } catch (error) {
      console.error('删除失败:', error)
      Message.error('删除失败')
    }
  }

  // 打开知识库详情
  const handleCardClick = (kb) => {
    // 跳转到知识库详情页
    setCurrentPage(`knowledge-detail-${kb.id}`)
  }

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="知识库"
      pageSubtitle="管理您的知识库文档"
    >
      {/* 顶部操作栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24 
      }}>
        <Tabs 
          activeTab={activeTab} 
          onChange={setActiveTab}
          type="rounded"
        >
          <TabPane key="all" title="全部知识库" />
          <TabPane key="archived" title="离职文档库" />
        </Tabs>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input
            style={{ width: 240 }}
            placeholder="搜索知识库..."
            value={searchValue}
            onChange={setSearchValue}
            prefix={<IconSearch />}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<IconPlus />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建知识库
          </Button>
          <Button icon={<IconDown />}>
            新建
          </Button>
        </div>
      </div>

      {/* 知识库卡片网格 */}
      <Spin loading={loading} style={{ display: 'block' }}>
        {knowledgeBases.length > 0 ? (
          <Row gutter={[16, 16]}>
            {knowledgeBases.map((kb) => (
              <Col key={kb.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                <KnowledgeCard
                  knowledgeBase={kb}
                  onClick={handleCardClick}
                  onEdit={handleEdit}
                  onSettings={(kb) => Message.info('设置功能开发中')}
                  onDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty 
            description={searchValue ? '未找到匹配的知识库' : '暂无知识库，点击右上角创建'}
            style={{ marginTop: 100 }}
          />
        )}
      </Spin>

      {/* 创建知识库对话框 */}
      <Modal
        title="新建知识库"
        visible={createModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        okText="创建"
        cancelText="取消"
        style={{ width: 600 }}
      >
        <Form
          form={form}
          onSubmit={handleCreate}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem 
            label="知识库名称" 
            field="name" 
            rules={[{ required: true, message: '请输入知识库名称' }]}
          >
            <Input placeholder="请输入知识库名称" />
          </FormItem>
          
          <FormItem 
            label="描述" 
            field="description"
          >
            <Input.TextArea 
              placeholder="请输入描述（选填）" 
              rows={3}
            />
          </FormItem>

          <FormItem 
            label="标签" 
            field="tags"
          >
            <Input 
              placeholder="多个标签用逗号分隔，如：技术,产品,设计" 
            />
          </FormItem>

          <FormItem 
            label="封面图" 
            field="coverImage"
          >
            <CoverUploader
              kbId={null}
              currentCover={coverUrl}
              onUploadSuccess={(url) => {
                setCoverUrl(url)
                form.setFieldValue('coverImage', url)
              }}
            />
          </FormItem>
        </Form>
      </Modal>

      {/* 编辑知识库对话框 */}
      <Modal
        title="编辑知识库"
        visible={editModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditModalVisible(false)
          editForm.resetFields()
        }}
        okText="保存"
        cancelText="取消"
        style={{ width: 600 }}
      >
        <Form
          form={editForm}
          onSubmit={handleUpdate}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem 
            label="知识库名称" 
            field="name" 
            rules={[{ required: true, message: '请输入知识库名称' }]}
          >
            <Input placeholder="请输入知识库名称" />
          </FormItem>
          
          <FormItem 
            label="描述" 
            field="description"
          >
            <Input.TextArea 
              placeholder="请输入描述（选填）" 
              rows={3}
            />
          </FormItem>

          <FormItem 
            label="标签" 
            field="tags"
          >
            <Input 
              placeholder="多个标签用逗号分隔，如：技术,产品,设计" 
            />
          </FormItem>

          <FormItem 
            label="封面图" 
            field="coverImage"
          >
            <CoverUploader
              kbId={currentKb?.id}
              currentCover={currentKb?.coverImage}
              onUploadSuccess={(url) => {
                editForm.setFieldValue('coverImage', url)
              }}
            />
          </FormItem>
        </Form>
      </Modal>
    </AppLayout>
  )
}
