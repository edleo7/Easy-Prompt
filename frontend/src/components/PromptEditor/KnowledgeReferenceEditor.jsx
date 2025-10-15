/**
 * 知识库引用编辑器组件
 * 集成到Prompt编辑器中，提供知识库引用功能
 */

import React, { useState, useEffect, useRef } from 'react'
import { 
  Button, 
  Modal, 
  Typography, 
  Space, 
  Tag, 
  Card, 
  List, 
  Tooltip,
  Popconfirm,
  Message,
  Divider,
  Input,
  Select
} from '@arco-design/web-react'
import { 
  IconBook, 
  IconPlus, 
  IconDelete, 
  IconEye, 
  IconCopy,
  IconRefresh,
  IconSearch
} from '@arco-design/web-react/icon'
import KnowledgeSelector from './KnowledgeSelector'
import { 
  parseReferences, 
  validateReferences, 
  getReferencePreview,
  extractReferences,
  createReferenceSyntax,
  isValidReferenceSyntax,
  parseReferenceSyntax
} from '../../services/knowledgeReference'

const { Text, Title } = Typography
const { TextArea } = Input
const Option = Select.Option

const KnowledgeReferenceEditor = ({ 
  value = '', 
  onChange, 
  placeholder = '输入Prompt内容...',
  className = '' 
}) => {
  const [showSelector, setShowSelector] = useState(false)
  const [references, setReferences] = useState([])
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [replaceMode, setReplaceMode] = useState('content') // content, summary, metadata
  const [resolvedContent, setResolvedContent] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  
  const textareaRef = useRef(null)

  // 解析引用
  const parseContentReferences = (content) => {
    const extractedRefs = extractReferences(content)
    setReferences(extractedRefs)
  }

  // 处理内容变化
  const handleContentChange = (value) => {
    onChange(value)
    parseContentReferences(value)
  }

  // 处理知识选择
  const handleKnowledgeSelect = (selectedItems) => {
    const cursorPosition = textareaRef.current?.textarea?.selectionStart || 0
    const currentContent = value
    
    let newContent = currentContent
    let offset = 0

    selectedItems.forEach(item => {
      const syntax = createReferenceSyntax(item.kbId, item.id)
      const insertPosition = cursorPosition + offset
      
      newContent = 
        newContent.substring(0, insertPosition) +
        syntax +
        newContent.substring(insertPosition)
      
      offset += syntax.length
    })

    handleContentChange(newContent)
    setShowSelector(false)
  }

  // 预览引用内容
  const handlePreviewReference = async (reference) => {
    setPreviewLoading(true)
    setPreviewModalVisible(true)
    
    try {
      const response = await getReferencePreview(reference.kbId, reference.fileId)
      if (response.code === 200) {
        setPreviewContent(response.data)
      } else {
        Message.error('获取预览失败')
      }
    } catch (error) {
      console.error('获取预览失败:', error)
      Message.error('获取预览失败: ' + error.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  // 删除引用
  const handleDeleteReference = (reference) => {
    const newContent = value.replace(reference.fullMatch, '')
    handleContentChange(newContent)
  }

  // 复制引用语法
  const handleCopyReference = (reference) => {
    navigator.clipboard.writeText(reference.fullMatch)
    Message.success('引用语法已复制')
  }

  // 解析所有引用
  const handleResolveReferences = async () => {
    if (references.length === 0) {
      Message.warning('没有找到引用')
      return
    }

    setPreviewLoading(true)
    try {
      const response = await parseReferences(value, {
        replaceMode,
        maxLength: 2000,
        includeHeader: true
      })
      
      if (response.code === 200) {
        setResolvedContent(response.data.content)
        setShowResolved(true)
      } else {
        Message.error('解析引用失败')
      }
    } catch (error) {
      console.error('解析引用失败:', error)
      Message.error('解析引用失败: ' + error.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  // 验证引用
  const handleValidateReferences = async () => {
    if (references.length === 0) {
      Message.warning('没有找到引用')
      return
    }

    try {
      const response = await validateReferences(value)
      if (response.code === 200) {
        const { totalCount, validCount } = response.data
        if (validCount === totalCount) {
          Message.success(`所有 ${totalCount} 个引用都有效`)
        } else {
          Message.warning(`${validCount}/${totalCount} 个引用有效`)
        }
      }
    } catch (error) {
      console.error('验证引用失败:', error)
      Message.error('验证引用失败: ' + error.message)
    }
  }

  // 渲染引用列表
  const renderReference = (reference, index) => {
    const parsed = parseReferenceSyntax(reference.fullMatch)
    
    return (
      <List.Item
        key={index}
        style={{ 
          padding: '8px 12px',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Tag color="blue" size="small">
              KB: {reference.kbId}
            </Tag>
            <Tag color="green" size="small">
              File: {reference.fileId}
            </Tag>
            <Text code style={{ fontSize: 12 }}>
              {reference.fullMatch}
            </Text>
          </Space>
          <Space>
            <Tooltip content="预览内容">
              <Button
                type="text"
                size="small"
                icon={<IconEye />}
                onClick={() => handlePreviewReference(reference)}
              />
            </Tooltip>
            <Tooltip content="复制语法">
              <Button
                type="text"
                size="small"
                icon={<IconCopy />}
                onClick={() => handleCopyReference(reference)}
              />
            </Tooltip>
            <Popconfirm
              title="确定删除此引用吗？"
              onOk={() => handleDeleteReference(reference)}
            >
              <Button
                type="text"
                size="small"
                icon={<IconDelete />}
                style={{ color: '#f53f3f' }}
              />
            </Popconfirm>
          </Space>
        </div>
      </List.Item>
    )
  }

  useEffect(() => {
    parseContentReferences(value)
  }, [value])

  return (
    <div className={`knowledge-reference-editor ${className}`}>
      {/* 工具栏 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12,
        padding: '8px 12px',
        background: '#f7f8fa',
        borderRadius: 4
      }}>
        <Space>
          <Button
            type="outline"
            icon={<IconBook />}
            onClick={() => setShowSelector(true)}
          >
            引用知识库
          </Button>
          {references.length > 0 && (
            <>
              <Button
                type="outline"
                icon={<IconRefresh />}
                onClick={handleResolveReferences}
                loading={previewLoading}
              >
                解析引用
              </Button>
              <Button
                type="outline"
                icon={<IconSearch />}
                onClick={handleValidateReferences}
              >
                验证引用
              </Button>
            </>
          )}
        </Space>
        
        {references.length > 0 && (
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              发现 {references.length} 个引用
            </Text>
            <Select
              size="small"
              value={replaceMode}
              onChange={setReplaceMode}
              style={{ width: 120 }}
            >
              <Option value="content">完整内容</Option>
              <Option value="summary">摘要</Option>
              <Option value="metadata">元数据</Option>
            </Select>
          </Space>
        )}
      </div>

      {/* 编辑器 */}
      <TextArea
        ref={textareaRef}
        value={value}
        onChange={handleContentChange}
        placeholder={placeholder}
        autoSize={{ minRows: 6, maxRows: 20 }}
        style={{ marginBottom: 12 }}
      />

      {/* 引用列表 */}
      {references.length > 0 && (
        <Card title="引用列表" size="small" style={{ marginBottom: 12 }}>
          <List
            dataSource={references}
            render={renderReference}
            style={{ maxHeight: 200, overflowY: 'auto' }}
          />
        </Card>
      )}

      {/* 知识库选择器 */}
      <KnowledgeSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleKnowledgeSelect}
      />

      {/* 引用预览对话框 */}
      <Modal
        title="引用内容预览"
        visible={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        style={{ width: 600 }}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text>加载中...</Text>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>
                {previewContent.fileName}
              </Title>
              <Space size={16} style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  类型: {previewContent.fileFormat}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  大小: {previewContent.fileSize} 字节
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  修改: {new Date(previewContent.lastModified).toLocaleString()}
                </Text>
              </Space>
            </div>
            <Divider />
            <div style={{ 
              maxHeight: 400, 
              overflowY: 'auto',
              background: '#f7f8fa',
              padding: 12,
              borderRadius: 4,
              fontSize: 12,
              lineHeight: 1.6
            }}>
              {previewContent.preview}
            </div>
            {previewContent.fullLength > 200 && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                完整内容长度: {previewContent.fullLength} 字符
              </Text>
            )}
          </div>
        )}
      </Modal>

      {/* 解析结果对话框 */}
      <Modal
        title="引用解析结果"
        visible={showResolved}
        onCancel={() => setShowResolved(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <div style={{ 
          maxHeight: 500, 
          overflowY: 'auto',
          background: '#f7f8fa',
          padding: 16,
          borderRadius: 4,
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap'
        }}>
          {resolvedContent}
        </div>
      </Modal>
    </div>
  )
}

export default KnowledgeReferenceEditor
