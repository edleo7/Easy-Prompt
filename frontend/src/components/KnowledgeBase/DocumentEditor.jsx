import React, { useState, useEffect, useRef } from 'react'
import { Input, Button, Space, Radio, Message, Spin } from '@arco-design/web-react'
import { IconSave, IconUndo, IconRedo, IconSwap } from '@arco-design/web-react/icon'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const { TextArea } = Input

export default function DocumentEditor({
  initialContent = '',
  initialEditorType = 'markdown',
  fileName = '未命名文档',
  onSave,
  onContentChange
}) {
  const [content, setContent] = useState(initialContent)
  const [editorType, setEditorType] = useState(initialEditorType)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimerRef = useRef(null)

  // 监听内容变化
  useEffect(() => {
    if (content !== initialContent) {
      setHasUnsavedChanges(true)
      onContentChange?.(content)
      
      // 自动保存（防抖3秒）
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave()
      }, 3000)
    }
  }, [content])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  // 自动保存
  const handleAutoSave = async () => {
    if (!hasUnsavedChanges) return
    
    try {
      await onSave?.({ content, editorType })
      setHasUnsavedChanges(false)
      Message.success('已自动保存')
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }

  // 手动保存
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave?.({ content, editorType })
      setHasUnsavedChanges(false)
      Message.success('保存成功')
    } catch (error) {
      Message.error('保存失败')
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // 切换编辑器类型
  const handleEditorTypeChange = (value) => {
    setEditorType(value)
    setHasUnsavedChanges(true)
  }

  // Markdown编辑器
  const renderMarkdownEditor = () => (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '16px',
      height: 'calc(100vh - 250px)'
    }}>
      {/* 编辑区 */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '8px 12px', 
          background: '#f7f8fa',
          borderBottom: '1px solid #e5e6eb',
          fontWeight: 500,
          fontSize: 13
        }}>
          Markdown 编辑
        </div>
        <TextArea
          value={content}
          onChange={setContent}
          placeholder="请输入 Markdown 内容..."
          style={{ 
            flex: 1,
            border: 'none',
            borderRadius: 0,
            fontSize: 14,
            lineHeight: 1.8,
            fontFamily: 'Monaco, Consolas, monospace'
          }}
        />
      </div>

      {/* 预览区 */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '8px 12px', 
          background: '#f7f8fa',
          borderBottom: '1px solid #e5e6eb',
          fontWeight: 500,
          fontSize: 13
        }}>
          实时预览
        </div>
        <div style={{ 
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          background: '#fff',
          border: '1px solid #e5e6eb',
          borderTop: 'none'
        }}>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )

  // 富文本编辑器（简化版）
  const renderRichTextEditor = () => (
    <div style={{ height: 'calc(100vh - 250px)' }}>
      <TextArea
        value={content}
        onChange={setContent}
        placeholder="请输入内容..."
        style={{ 
          height: '100%',
          fontSize: 14,
          lineHeight: 1.8
        }}
      />
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 工具栏 */}
      <div style={{ 
        padding: '12px 16px',
        borderBottom: '1px solid #e5e6eb',
        background: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Button
            type="primary"
            icon={<IconSave />}
            onClick={handleSave}
            loading={isSaving}
            disabled={!hasUnsavedChanges}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
          <Button icon={<IconUndo />} disabled>撤销</Button>
          <Button icon={<IconRedo />} disabled>重做</Button>
        </Space>

        <Space>
          <Radio.Group
            type="button"
            value={editorType}
            onChange={handleEditorTypeChange}
          >
            <Radio value="markdown">Markdown</Radio>
            <Radio value="richtext">富文本</Radio>
          </Radio.Group>
          {hasUnsavedChanges && (
            <span style={{ fontSize: 12, color: '#ff7d00' }}>
              • 有未保存的更改
            </span>
          )}
        </Space>
      </div>

      {/* 编辑器内容 */}
      <div style={{ flex: 1, background: '#f7f8fa' }}>
        {editorType === 'markdown' ? renderMarkdownEditor() : renderRichTextEditor()}
      </div>

      {/* Markdown样式 */}
      <style>{`
        .markdown-body {
          font-size: 14px;
          line-height: 1.8;
        }
        .markdown-body h1 {
          font-size: 28px;
          font-weight: 600;
          margin: 24px 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e6eb;
        }
        .markdown-body h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 20px 0 12px;
        }
        .markdown-body h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 16px 0 8px;
        }
        .markdown-body p {
          margin: 8px 0;
        }
        .markdown-body code {
          background: #f7f8fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: Monaco, Consolas, monospace;
          font-size: 13px;
        }
        .markdown-body pre {
          background: #f7f8fa;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
        }
        .markdown-body pre code {
          background: none;
          padding: 0;
        }
        .markdown-body blockquote {
          border-left: 4px solid #165dff;
          padding-left: 16px;
          margin: 16px 0;
          color: #4e5969;
        }
        .markdown-body ul, .markdown-body ol {
          padding-left: 24px;
        }
        .markdown-body li {
          margin: 4px 0;
        }
        .markdown-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid #e5e6eb;
          padding: 8px 12px;
        }
        .markdown-body th {
          background: #f7f8fa;
          font-weight: 600;
        }
        .markdown-body a {
          color: #165dff;
          text-decoration: none;
        }
        .markdown-body a:hover {
          text-decoration: underline;
        }
        .markdown-body img {
          max-width: 100%;
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}

