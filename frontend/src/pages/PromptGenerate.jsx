import React, { useState } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Modal, Form, Message } from '@arco-design/web-react'
import { IconPlus, IconSearch, IconSend, IconEye, IconMessage as IconChat, IconThunderbolt, IconSettings, IconFile } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function PromptGenerate({ currentPage, setCurrentPage }) {
  const [taskDescription, setTaskDescription] = useState('')
  const [taskType, setTaskType] = useState('文本理解')

  const promptExamples = [
    {
      id: 1,
      type: '文本理解',
      title: '教育题目答案批改输出',
      description: '你身为中国顶尖的 {subject} 教师，学生会将完成的题目…',
      icon: '📝',
      color: 'green'
    },
    {
      id: 2,
      type: '视觉理解',
      title: '图像内容分析',
      description: '请分析这张图片中的主要内容，包括物体、场景、颜色等…',
      icon: '👁️',
      color: 'blue'
    },
    {
      id: 3,
      type: '多轮对话',
      title: '客服对话生成',
      description: '生成客服对话机器人的对话内容，要求自然流畅，符合日…',
      icon: '💬',
      color: 'purple'
    }
  ]

  const handleGenerate = () => {
    Message.success('Prompt 生成中...')
    // 这里可以添加实际的生成逻辑
  }

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="Prompt 生成"
      pageSubtitle="智能生成 Prompt"
    >
      {/* 主标题区域 */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <Title heading={2} style={{ margin: 0, marginBottom: 12, color: '#1d2129' }}>
          从生成一个 Prompt. 开始
        </Title>
        <Text type="secondary" style={{ fontSize: 16 }}>
          激发模型潜能，轻松优化Prompt。使用手册
        </Text>
      </div>

      {/* 任务输入卡片 */}
      <div style={{ 
        background: '#fff',
        borderRadius: 12,
        padding: '32px',
        marginBottom: 32,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e5e6eb'
      }}>
        <div style={{ marginBottom: 24 }}>
          <Title heading={5} style={{ margin: 0, marginBottom: 8 }}>描述您的任务</Title>
          <Text type="secondary">请详细描述您希望AI完成的任务，我们将为您生成专业的Prompt</Text>
        </div>
        
        <Form layout="vertical">
          <Form.Item label="任务类型" required>
            <Select 
              value={taskType} 
              onChange={setTaskType}
              style={{ width: 200 }}
            >
              <Select.Option value="文本理解">文本理解</Select.Option>
              <Select.Option value="视觉理解">视觉理解</Select.Option>
              <Select.Option value="多轮对话">多轮对话</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="任务描述" required>
            <Input.TextArea
              value={taskDescription}
              onChange={setTaskDescription}
              placeholder="请详细描述您的任务，例如：我需要一个能够分析学生作文并给出改进建议的Prompt..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              style={{ fontSize: 14 }}
            />
          </Form.Item>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button size="large">清空</Button>
            <Button 
              type="primary" 
              size="large" 
              icon={<IconSend />}
              onClick={handleGenerate}
              style={{ 
                background: 'linear-gradient(135deg,#6aa1ff,#165dff)',
                border: 'none'
              }}
            >
              生成 Prompt
            </Button>
          </div>
        </Form>
      </div>

      {/* 示例卡片 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ marginBottom: 20 }}>
          <Title heading={5} style={{ margin: 0, marginBottom: 8 }}>参考示例</Title>
          <Text type="secondary">查看这些示例，了解如何描述您的任务</Text>
        </div>
        
        <Row gutter={[20, 20]}>
          {promptExamples.map((example) => (
            <Col span={8} key={example.id}>
              <Card 
                hoverable 
                style={{ 
                  borderRadius: 12,
                  border: '1px solid #e5e6eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                bodyStyle={{ padding: '20px' }}
                onClick={() => {
                  setTaskType(example.type)
                  setTaskDescription(example.description)
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: 12
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${
                      example.color === 'green' ? '#00b42a' :
                      example.color === 'blue' ? '#165dff' : '#722ed1'
                    }, ${
                      example.color === 'green' ? '#23c343' :
                      example.color === 'blue' ? '#4080ff' : '#9254de'
                    })`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 18,
                    marginRight: 12
                  }}>
                    {example.icon}
                  </div>
                  <div>
                    <Title heading={6} style={{ margin: 0, fontSize: 14 }}>{example.title}</Title>
                    <Tag 
                      color={example.color} 
                      size="small"
                      style={{ fontSize: 10, marginTop: 4 }}
                    >
                      {example.type}
                    </Tag>
                  </div>
                </div>
                
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 13, 
                    lineHeight: 1.5,
                    display: 'block'
                  }}
                >
                  {example.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 使用提示 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
        borderRadius: 12,
        padding: '24px',
        border: '1px solid #e5e6eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'linear-gradient(135deg,#6aa1ff,#165dff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 16,
            flexShrink: 0
          }}>
            💡
          </div>
          <div>
            <Title heading={6} style={{ margin: 0, marginBottom: 8, color: '#1d2129' }}>
              使用提示
            </Title>
            <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              1. 详细描述任务的具体要求和期望输出<br/>
              2. 说明任务的背景和上下文信息<br/>
              3. 指定输出格式和风格要求<br/>
              4. 提供相关的示例或参考
            </Text>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
