import React, { useState, useEffect } from 'react'
import { Button, Input, Select, Typography, Card, Grid, Space, Tag, Avatar, Modal, Form, Message, Tabs, List, Switch, Divider, Tooltip, Progress, Spin, Drawer, Badge } from '@arco-design/web-react'
import { IconSend, IconThunderbolt, IconBook, IconFile, IconCopy, IconDownload, IconRefresh, IconSettings, IconEye, IconEdit, IconDelete, IconPlus, IconClose, IconCheck } from '@arco-design/web-react/icon'
import pureLogo from '../assets/images/品牌/纯logo.png'
import AppLayout from '../components/AppLayout'
import { promptAPI, memoryAPI, knowledgeAPI } from '../services/api'
import aiService from '../services/aiService'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function PromptGenerate({ currentPage, setCurrentPage }) {
  // 主要状态
  const [inputValue, setInputValue] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [taskType, setTaskType] = useState('文本理解')
  
  // 上下文选择状态
  const [selectedMemories, setSelectedMemories] = useState([])
  const [selectedKnowledge, setSelectedKnowledge] = useState([])
  const [selectedVariables, setSelectedVariables] = useState([])
  
  // 设置状态
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [customSettings, setCustomSettings] = useState({
    temperature: 0.7,
    maxTokens: 2000,
    llmModel: 'gpt-4'
  })
  
  // 数据状态
  const [memoryData, setMemoryData] = useState([])
  const [knowledgeData, setKnowledgeData] = useState([])
  const [variableData, setVariableData] = useState([])
  const [loading, setLoading] = useState(false)
  
  // 上下文选择面板状态
  const [contextPanelVisible, setContextPanelVisible] = useState(false)
  const [contextType, setContextType] = useState('memories') // memories, knowledge, variables

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 加载记忆数据
      const memoryResponse = await memoryAPI.getMemories({ page: 1, limit: 100 })
      if (memoryResponse.code === 200) {
        setMemoryData(memoryResponse.data.memories || [])
      }

      // 加载知识库数据
      const knowledgeResponse = await knowledgeAPI.getKnowledge({ page: 1, limit: 100 })
      if (knowledgeResponse.code === 200) {
        setKnowledgeData(knowledgeResponse.data.knowledge || [])
      }

      // 模拟变量数据
      setVariableData([
        { id: 1, name: '当前时间', type: 'time', value: new Date().toLocaleString() },
        { id: 2, name: '用户姓名', type: 'custom', value: '张三' },
        { id: 3, name: '项目名称', type: 'custom', value: 'EasyPrompt' },
        { id: 4, name: '任务类型', type: 'custom', value: '文本分析' }
      ])
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 生成Prompt
  const handleGeneratePrompt = async () => {
    if (!inputValue.trim()) {
      Message.warning('请输入任务描述')
      return
    }

    setIsGenerating(true)
    
    try {
      // 构建上下文信息
      const context = {
        task: inputValue,
        type: taskType,
        memories: selectedMemories.map(id => 
          memoryData.find(m => m.id === id)
        ).filter(Boolean),
        knowledge: selectedKnowledge.map(id => 
          knowledgeData.find(k => k.id === id)
        ).filter(Boolean),
        variables: selectedVariables.map(id => 
          variableData.find(v => v.id === id)
        ).filter(Boolean),
        settings: customSettings
      }

      // 使用AI服务优化Prompt
      try {
        const aiResult = await aiService.optimizePrompt(inputValue, context, {
          temperature: customSettings.temperature || 0.7,
          maxTokens: customSettings.maxTokens || 2000
        })

        if (aiResult.success) {
          setGeneratedPrompt(aiResult.content)
          Message.success(`Prompt 生成成功 (使用${aiResult.model})`)
        } else {
          throw new Error(aiResult.error || 'AI生成失败')
        }
      } catch (aiError) {
        console.error('AI服务调用失败:', aiError)
        Message.warning('AI服务不可用，使用模板生成')
        
        // 使用模板生成fallback
        const templatePrompt = generateTemplatePrompt(inputValue, taskType, context)
        setGeneratedPrompt(templatePrompt)
        Message.success('Prompt 生成成功 (使用模板)')
      }
    } catch (error) {
      console.error('生成Prompt失败:', error)
      Message.error('生成失败: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制Prompt
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    Message.success('Prompt已复制到剪贴板')
  }

  // 下载Prompt
  const handleDownloadPrompt = () => {
    const blob = new Blob([generatedPrompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    Message.success('Prompt已下载')
  }

  // 清空输入
  const handleClear = () => {
    setInputValue('')
    setGeneratedPrompt('')
  }

  // 模板生成Prompt
  const generateTemplatePrompt = (task, type, context) => {
    let prompt = ''
    
    // 根据任务类型选择基础模板
    if (type === '文本理解') {
      prompt = '你是一位专业的文本分析专家，请基于以下要求分析文本内容：\n\n'
    } else if (type === '视觉理解') {
      prompt = '你是一位专业的图像分析专家，请基于以下要求分析图像内容：\n\n'
    } else if (type === '多轮对话') {
      prompt = '你是一位专业的对话助手，请基于以下要求进行对话：\n\n'
    } else if (type === '代码生成') {
      prompt = '你是一位专业的程序员，请基于以下要求生成代码：\n\n'
    }

    // 添加任务描述
    prompt += `任务描述：${task}\n\n`

    // 添加记忆内容
    if (context.memories && context.memories.length > 0) {
      prompt += '相关记忆：\n'
      context.memories.forEach(memory => {
        prompt += `- ${memory.content}\n`
      })
      prompt += '\n'
    }

    // 添加知识库内容
    if (context.knowledge && context.knowledge.length > 0) {
      prompt += '相关知识：\n'
      context.knowledge.forEach(kb => {
        prompt += `- ${kb.name}: ${kb.description}\n`
      })
      prompt += '\n'
    }

    // 添加变量内容
    if (context.variables && context.variables.length > 0) {
      prompt += '相关变量：\n'
      context.variables.forEach(variable => {
        prompt += `- ${variable.name}: ${variable.value}\n`
      })
      prompt += '\n'
    }

    // 添加输出格式要求
    prompt += '请按照以下步骤执行：\n'
    prompt += '1. 仔细分析任务要求\n'
    prompt += '2. 结合提供的上下文信息\n'
    prompt += '3. 生成高质量的回复\n'
    prompt += '4. 确保回复准确、有用、易懂\n\n'
    prompt += '请开始执行任务：'

    return prompt
  }

  // Prompt示例数据
  const promptExamples = [
    {
      type: '文本理解',
      icon: '📝',
      examples: [
        '从实际的法律案宗中抽取指定内容，并以json格式输出',
        '根据商品期货的近况，给一份分析报告'
      ]
    },
    {
      type: '视觉理解',
      icon: '👁️',
      examples: [
        '依据提供给的题目图片，对其中的题目展开解析',
        '对图片进行分析，判断每个作答是正确还是错误'
      ]
    },
    {
      type: '多轮对话',
      icon: '💬',
      examples: [
        '生成客服对话机器人的对话内容，要求自然流畅',
        '生成销售培训陪练的对话内容，销售人员将会...'
      ]
    }
  ]

  return (
    <AppLayout 
      currentPage={currentPage} 
      setCurrentPage={setCurrentPage}
      pageTitle="智能 Prompt 生成器"
      pageSubtitle="导出并可选择自适应不同的大语言模型或应用，融合记忆与知识库"
    >
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#fafafa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        
        {/* 主内容区域 */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: '24px 20px',
          maxWidth: '1000px',
          margin: '0 auto',
          width: '100%',
          gap: '24px'
        }}>
          
          {/* 页面标题 */}
          <div style={{ 
            textAlign: 'left'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#1a1a1a',
              margin: '0 0 8px 0',
              lineHeight: 1.3
            }}>
              从生成一个 <span style={{ color: '#1890ff' }}>Prompt</span> 开始
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              激发模型潜能，轻松优化 Prompt。<a href="#" style={{ color: '#1890ff', textDecoration: 'none' }}>使用手册</a>
            </p>
          </div>

          {/* 主交互卡片 */}
          <Card style={{ 
            borderRadius: '12px',
            border: '1px solid #e8e8e8',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                  你的任务
                </Text>
                <Text style={{ fontSize: '13px', color: '#666' }}>
                  描述你想要AI帮助完成的具体任务
                </Text>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <Input.TextArea
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder="例如：帮我分析这份合同中的关键条款，并生成一份摘要报告..."
                  style={{ 
                    minHeight: '80px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    border: '1px solid #d9d9d9',
                    borderRadius: '8px',
                    resize: 'none',
                    backgroundColor: '#fafafa'
                  }}
                  onPressEnter={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      handleGeneratePrompt()
                    }
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                  <Select 
                    value={taskType} 
                    onChange={setTaskType}
                    style={{ width: '140px' }}
                    size="default"
                  >
                    <Select.Option value="文本理解">📝 文本理解</Select.Option>
                    <Select.Option value="视觉理解">👁️ 视觉理解</Select.Option>
                    <Select.Option value="多轮对话">💬 多轮对话</Select.Option>
                    <Select.Option value="代码生成">💻 代码生成</Select.Option>
                  </Select>
                  
                  <Button 
                    type="outline"
                    icon={<IconBook />}
                    onClick={() => setContextPanelVisible(true)}
                    style={{ borderRadius: '6px' }}
                    size="default"
                  >
                    知识库
                  </Button>
                </div>
                
                <Button
                  type="primary"
                  icon={<IconSend />}
                  onClick={handleGeneratePrompt}
                  loading={isGenerating}
                  disabled={!inputValue.trim()}
                  size="default"
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    borderRadius: '6px',
                    minWidth: '100px',
                    height: '36px'
                  }}
                >
                  {isGenerating ? '生成中...' : '生成 Prompt'}
                </Button>
              </div>
            </div>
          </Card>

          {/* 生成结果 */}
          {generatedPrompt && (
            <Card style={{ 
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              backgroundColor: '#ffffff'
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                      生成的 Prompt
                    </Text>
                    <Text style={{ fontSize: '13px', color: '#666' }}>
                      基于你的任务描述和上下文信息生成
                    </Text>
                  </div>
                  <Space wrap>
                    <Button 
                      type="outline" 
                      size="small"
                      icon={<IconCopy />}
                      onClick={handleCopyPrompt}
                      style={{ borderRadius: '4px' }}
                    >
                      复制
                    </Button>
                    <Button 
                      type="outline" 
                      size="small"
                      icon={<IconDownload />}
                      onClick={handleDownloadPrompt}
                      style={{ borderRadius: '4px' }}
                    >
                      下载
                    </Button>
                    <Button 
                      type="outline" 
                      size="small"
                      icon={<IconRefresh />}
                      onClick={handleGeneratePrompt}
                      loading={isGenerating}
                      style={{ borderRadius: '4px' }}
                    >
                      重新生成
                    </Button>
                  </Space>
                </div>

                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {generatedPrompt}
                </div>
              </div>
            </Card>
          )}

          {/* Prompt示例 */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Text style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#1a1a1a',
                marginBottom: '6px',
                display: 'block'
              }}>
                试试以下 Prompt 示例
              </Text>
              <Text style={{ 
                fontSize: '13px', 
                color: '#666',
                margin: 0
              }}>
                点击示例快速开始，或参考这些模板来构思你的任务
              </Text>
            </div>
            
            <Row gutter={[20, 20]}>
              {promptExamples.map((example, index) => (
                <Col xs={24} sm={12} lg={8} key={index}>
                  <Card 
                    style={{ 
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      height: '100%',
                      backgroundColor: '#ffffff'
                    }}
                    hoverable
                    onClick={() => {
                      setInputValue(example.examples[0])
                      setTaskType(example.type)
                    }}
                  >
                    <div style={{ padding: '20px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '16px' 
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#f0f9ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          fontSize: '20px'
                        }}>
                          {example.icon}
                        </div>
                        <div>
                          <Text style={{ 
                            fontSize: '15px', 
                            fontWeight: '600', 
                            color: '#1a1a1a',
                            margin: 0
                          }}>
                            {example.type}
                          </Text>
                          <Text style={{ 
                            fontSize: '11px', 
                            color: '#666',
                            margin: 0
                          }}>
                            点击使用示例
                          </Text>
                        </div>
                      </div>
                      
                      <div>
                        {example.examples.map((ex, idx) => (
                          <div key={idx} style={{
                            fontSize: '13px',
                            color: '#666',
                            lineHeight: 1.5,
                            marginBottom: '10px',
                            padding: '10px 14px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            {ex}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* 底部说明 */}
          <div style={{
            textAlign: 'center',
            color: '#999',
            fontSize: '11px',
            padding: '12px 0',
            borderTop: '1px solid #f0f0f0',
            marginTop: '12px'
          }}>
            页面内容皆由人工智能创作，不代表平台立场
          </div>
        </div>

        {/* 上下文选择抽屉 */}
        <Drawer
          title={
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                选择上下文
              </div>
              <div style={{ fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
                选择相关的记忆、知识或变量来增强Prompt效果
              </div>
            </div>
          }
          visible={contextPanelVisible}
          onCancel={() => setContextPanelVisible(false)}
          width={420}
          footer={null}
          style={{ borderRadius: '10px 0 0 10px' }}
        >
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: '20px' }}>
              <Space wrap>
                <Button 
                  type={contextType === 'memories' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setContextType('memories')}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontWeight: 500,
                    height: '32px'
                  }}
                >
                  🧠 记忆 ({selectedMemories.length})
                </Button>
                <Button 
                  type={contextType === 'knowledge' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setContextType('knowledge')}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontWeight: 500,
                    height: '32px'
                  }}
                >
                  📚 知识 ({selectedKnowledge.length})
                </Button>
                <Button 
                  type={contextType === 'variables' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => setContextType('variables')}
                  style={{
                    borderRadius: '6px',
                    padding: '6px 16px',
                    fontWeight: 500,
                    height: '32px'
                  }}
                >
                  🔧 变量 ({selectedVariables.length})
                </Button>
              </Space>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '6px' }}>
              {(() => {
                const getCurrentData = () => {
                  switch (contextType) {
                    case 'memories': return memoryData
                    case 'knowledge': return knowledgeData
                    case 'variables': return variableData
                    default: return []
                  }
                }

                const getCurrentSelected = () => {
                  switch (contextType) {
                    case 'memories': return selectedMemories
                    case 'knowledge': return selectedKnowledge
                    case 'variables': return selectedVariables
                    default: return []
                  }
                }

                const handleSelect = (id) => {
                  switch (contextType) {
                    case 'memories':
                      setSelectedMemories(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      )
                      break
                    case 'knowledge':
                      setSelectedKnowledge(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      )
                      break
                    case 'variables':
                      setSelectedVariables(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      )
                      break
                  }
                }

                const data = getCurrentData()
                const selected = getCurrentSelected()

                return data.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#999', 
                    padding: '40px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    border: '1px dashed #e9ecef'
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                      {contextType === 'memories' ? '🧠' : contextType === 'knowledge' ? '📚' : '🔧'}
                    </div>
                    <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 500 }}>
                      暂无{contextType === 'memories' ? '记忆' : contextType === 'knowledge' ? '知识' : '变量'}数据
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      请先在其他页面添加相关内容
                    </div>
                  </div>
                ) : (
                  <List
                    dataSource={data}
                    render={(item) => (
                      <List.Item
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: selected.includes(item.id) ? '#e6f7ff' : 'transparent',
                          borderRadius: '10px',
                          marginBottom: '6px',
                          border: selected.includes(item.id) ? '1px solid #1890ff' : '1px solid #f0f0f0',
                          transition: 'all 0.3s ease',
                          boxShadow: selected.includes(item.id) ? '0 2px 8px rgba(24, 144, 255, 0.15)' : 'none'
                        }}
                        onClick={() => handleSelect(item.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              marginBottom: 4,
                              color: selected.includes(item.id) ? '#1890ff' : '#1a1a1a',
                              fontSize: 14
                            }}>
                              {item.title || item.name}
                            </div>
                            <div style={{ 
                              fontSize: 12, 
                              color: selected.includes(item.id) ? '#1890ff' : '#666',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {item.content || item.description || item.value}
                            </div>
                          </div>
                          {selected.includes(item.id) && (
                            <div style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: '#1890ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: 12,
                              boxShadow: '0 2px 4px rgba(24, 144, 255, 0.3)'
                            }}>
                              <IconCheck style={{ color: '#fff', fontSize: 12 }} />
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                )
              })()}
            </div>
          </div>
        </Drawer>

        {/* 设置模态框 */}
        <Modal
          title={
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
                生成设置
              </div>
              <div style={{ fontSize: '13px', color: '#666', fontWeight: 'normal' }}>
                调整AI模型参数以优化Prompt生成效果
              </div>
            </div>
          }
          visible={settingsVisible}
          onCancel={() => setSettingsVisible(false)}
          onOk={() => setSettingsVisible(false)}
          style={{ width: 520 }}
          okText="保存设置"
          cancelText="取消"
        >
          <div style={{ padding: '6px 0' }}>
            <Form
              layout="vertical"
              initialValues={customSettings}
              onChange={(values) => setCustomSettings(prev => ({ ...prev, ...values }))}
            >
              <Form.Item 
                label={
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                    目标LLM模型
                  </div>
                }
              >
                <Select 
                  value={customSettings.llmModel}
                  onChange={(value) => setCustomSettings(prev => ({ ...prev, llmModel: value }))}
                  size="default"
                  style={{ borderRadius: '6px' }}
                >
                  <Select.Option value="gpt-4">🤖 GPT-4</Select.Option>
                  <Select.Option value="gpt-3.5-turbo">⚡ GPT-3.5 Turbo</Select.Option>
                  <Select.Option value="claude-3">🧠 Claude 3</Select.Option>
                  <Select.Option value="claude-2">🧠 Claude 2</Select.Option>
                  <Select.Option value="gemini-pro">💎 Gemini Pro</Select.Option>
                  <Select.Option value="llama-2">🦙 Llama 2</Select.Option>
                  <Select.Option value="kimi">🌙 Kimi (月之暗面)</Select.Option>
                  <Select.Option value="qwen">🔮 通义千问</Select.Option>
                  <Select.Option value="wenxin">📝 文心一言</Select.Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                        温度 (Temperature)
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                          控制输出的随机性，0-2之间
                        </div>
                      </div>
                    }
                  >
                    <Input 
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={customSettings.temperature}
                      onChange={(value) => setCustomSettings(prev => ({ ...prev, temperature: parseFloat(value) }))}
                      addonAfter="0.0-2.0"
                      size="default"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '6px' }}>
                        最大Token数
                        <div style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>
                          限制生成内容的最大长度
                        </div>
                      </div>
                    }
                  >
                    <Input 
                      type="number"
                      min="100"
                      max="8000"
                      step="100"
                      value={customSettings.maxTokens}
                      onChange={(value) => setCustomSettings(prev => ({ ...prev, maxTokens: parseInt(value) }))}
                      addonAfter="tokens"
                      size="default"
                      style={{ borderRadius: '6px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        </Modal>
      </div>
    </AppLayout>
)
}