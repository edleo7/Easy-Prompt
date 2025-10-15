/**
 * AI助手组件
 * 提供基于知识库的智能对话功能
 */

import React, { useState, useRef, useEffect } from 'react'
import { 
  Card, 
  Input, 
  Button, 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Tooltip,
  Spin,
  Empty,
  Divider,
  Popover
} from '@arco-design/web-react'
import { 
  IconSend, 
  IconRobot, 
  IconUser, 
  IconBulb, 
  IconRefresh,
  IconCopy,
  IconThumbUp,
  IconThumbDown,
  IconFile,
  IconSearch
} from '@arco-design/web-react/icon'
import { formatDate } from '../../utils/format'

const { Text, Title } = Typography
const { TextArea } = Input

const AIAssistant = ({ 
  kbId, 
  kbName = '知识库',
  onFileClick,
  className = '' 
}) => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickQuestions] = useState([
    '这个知识库主要讲什么？',
    '帮我总结一下核心内容',
    '有哪些重要的文档？',
    '最新的更新是什么？',
    '帮我找一下关于XX的内容'
  ])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      // 这里应该调用AI API
      const response = await fetch(`/api/v1/kb/${kbId}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.slice(-5) // 只发送最近5条消息作为上下文
        })
      })

      const data = await response.json()
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.reply || '抱歉，我暂时无法回答这个问题。',
        references: data.references || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI对话失败:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '抱歉，服务暂时不可用，请稍后再试。',
        timestamp: new Date(),
        error: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // 快速提问
  const handleQuickQuestion = (question) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  // 复制消息
  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    // 这里可以添加复制成功的提示
  }

  // 评价消息
  const handleRateMessage = (messageId, rating) => {
    // 这里可以调用API记录用户评价
    console.log('评价消息:', messageId, rating)
  }

  // 点击引用文件
  const handleReferenceClick = (fileId) => {
    if (onFileClick) {
      onFileClick(fileId)
    }
  }

  // 渲染消息内容
  const renderMessageContent = (message) => {
    if (message.type === 'user') {
      return (
        <div style={{ textAlign: 'right' }}>
          <Text>{message.content}</Text>
        </div>
      )
    }

    return (
      <div>
        <div style={{ marginBottom: message.references?.length > 0 ? 8 : 0 }}>
          <Text>{message.content}</Text>
        </div>
        
        {message.references && message.references.length > 0 && (
          <div>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4 }}>
              参考文档：
            </Text>
            <Space wrap>
              {message.references.map((ref, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleReferenceClick(ref.fileId)}
                >
                  <IconFile style={{ marginRight: 4 }} />
                  {ref.fileName || `文档${index + 1}`}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </div>
    )
  }

  // 渲染消息操作
  const renderMessageActions = (message) => {
    if (message.type === 'ai' && !message.error) {
      return (
        <Space size={8}>
          <Tooltip content="复制">
            <Button
              type="text"
              size="mini"
              icon={<IconCopy />}
              onClick={() => handleCopyMessage(message.content)}
            />
          </Tooltip>
          <Tooltip content="有用">
            <Button
              type="text"
              size="mini"
              icon={<IconThumbUp />}
              onClick={() => handleRateMessage(message.id, 'positive')}
            />
          </Tooltip>
          <Tooltip content="无用">
            <Button
              type="text"
              size="mini"
              icon={<IconThumbDown />}
              onClick={() => handleRateMessage(message.id, 'negative')}
            />
          </Tooltip>
        </Space>
      )
    }
    return null
  }

  return (
    <Card
      title={
        <Space>
          <IconRobot style={{ color: '#1890ff' }} />
          <span>AI助手</span>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {kbName}
          </Text>
        </Space>
      }
      className={`ai-assistant ${className}`}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* 快速提问 */}
      {messages.length === 0 && (
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            <IconBulb style={{ marginRight: 8, color: '#faad14' }} />
            快速提问
          </Title>
          <Space wrap>
            {quickQuestions.map((question, index) => (
              <Button
                key={index}
                type="outline"
                size="small"
                onClick={() => handleQuickQuestion(question)}
                style={{ marginBottom: 8 }}
              >
                {question}
              </Button>
            ))}
          </Space>
        </div>
      )}

      {/* 对话历史 */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '16px',
        minHeight: 200
      }}>
        {messages.length === 0 ? (
          <Empty
            description="开始与AI助手对话"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={messages}
            render={(message) => (
              <List.Item
                key={message.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Avatar
                    size={32}
                    style={{
                      backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
                      flexShrink: 0
                    }}
                  >
                    {message.type === 'user' ? <IconUser /> : <IconRobot />}
                  </Avatar>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: 4
                    }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {message.type === 'user' ? '你' : 'AI助手'} · {formatDate(message.timestamp)}
                      </Text>
                      {renderMessageActions(message)}
                    </div>
                    
                    {renderMessageContent(message)}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
        
        {loading && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px 0'
          }}>
            <Spin size="small" />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              AI正在思考中...
            </Text>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: 16, 
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <TextArea
            ref={inputRef}
            value={inputValue}
            onChange={setInputValue}
            placeholder="输入您的问题..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flex: 1 }}
            onPressEnter={(e) => {
              if (e.shiftKey) return // Shift+Enter 换行
              e.preventDefault()
              handleSendMessage()
            }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={<IconSend />}
            onClick={handleSendMessage}
            loading={loading}
            disabled={!inputValue.trim()}
            style={{ flexShrink: 0 }}
          >
            发送
          </Button>
        </div>
        
        <div style={{ 
          marginTop: 8, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            按 Enter 发送，Shift+Enter 换行
          </Text>
          {messages.length > 0 && (
            <Button
              type="text"
              size="mini"
              icon={<IconRefresh />}
              onClick={() => setMessages([])}
            >
              清空对话
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default AIAssistant
