import React, { useState } from 'react';
import { Typography, Input, Button, Space, Select, Card, Message, Dropdown } from '@arco-design/web-react';
import { IconPlus, IconMinus, IconUpload, IconQuestionCircle, IconDown, IconBook, IconSave, IconSend, IconExpand, IconApps, IconList, IconNotification, IconCode } from '@arco-design/web-react/icon';
import AppLayout from '../components/AppLayout';
import KnowledgeReferenceEditor from '../components/PromptEditor/KnowledgeReferenceEditor';
import PromptSaveSelector from '../components/Project/PromptSaveSelector';
import { createProject, createPrompt } from '../services/project';

const { Title, Text } = Typography;
const Option = Select.Option;

export default function PromptGenerate({ currentPage, setCurrentPage }) {
  // 控制页面内容是否上移的状态
  const [contentMoved, setContentMoved] = useState(false);
  // 知识库引用相关状态
  const [promptContent, setPromptContent] = useState('');
  const [showKnowledgeEditor, setShowKnowledgeEditor] = useState(false);
  // 保存到项目相关状态
  const [showSaveSelector, setShowSaveSelector] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  // Prompt相关状态
  const [variables, setVariables] = useState([]);
  const [knowledgeReferences, setKnowledgeReferences] = useState([]);
  // 设计稿相关状态
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState('');
  const [selectedMemoryBank, setSelectedMemoryBank] = useState('');
  const [selectedVariable, setSelectedVariable] = useState('');
  const [promptMode, setPromptMode] = useState('auto'); // auto, thinking, fast
  const [showDropdowns, setShowDropdowns] = useState(false);

  // 处理帮助文档点击
  const handleHelpClick = () => {
    // 这里可以打开帮助文档页面或模态框
    console.log('打开帮助文档');
    // 示例：window.open('/help', '_blank');
  };

  // 处理保存到项目
  const handleSaveToProject = async (projectId) => {
    if (!promptContent.trim()) {
      Message.warning('请先生成Prompt内容');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await createPrompt(projectId, {
        name: promptName || '新生成的Prompt',
        content: promptContent,
        variables: variables,
        kbReferences: knowledgeReferences,
        status: 'draft'
      });

      if (response.code === 201) {
        Message.success('Prompt已保存到项目');
        setShowSaveSelector(false);
        setPromptName('');
        // 可以选择跳转到项目详情页
        setCurrentPage(`project-detail-${projectId}`);
      } else {
        Message.error('Prompt保存失败');
      }
    } catch (error) {
      console.error('保存Prompt到项目失败:', error);
      Message.error('Prompt保存失败');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // 处理向下按钮点击
  const handleMoveDown = () => {
    setContentMoved(true);
  };

  // 处理上传点击
  const handleUploadClick = () => {
    console.log('上传文件');
  };

  return (
    <AppLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageTitle="Prompt生成"
      pageSubtitle="通过智能助手快速生成Prompt"
    >
      {/* 主体内容区域 - 根据设计稿重新设计 */}
      <div style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        {/* 顶部状态栏 */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 10
        }}>
          <Button type="text" icon={<IconNotification />} style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ff4d4f',
              borderRadius: '50%'
            }} />
          </Button>
          <Button type="text">升级</Button>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span>500</span>
            <IconCode style={{ color: '#52c41a' }} />
          </div>
        </div>

        {/* 主内容卡片 */}
        <Card style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '40px'
        }}>
          {/* 欢迎标题 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title heading={2} style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              margin: '0 0 8px 0',
              color: '#1f2937'
            }}>
              你好,欢迎使用EasyPrompt!
            </Title>
          </div>

          {/* 主输入区域 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <Input.TextArea
                value={promptContent}
                onChange={setPromptContent}
                placeholder="Please enter..."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '20px 24px',
                  fontSize: '16px',
                  borderRadius: '16px',
                  border: '2px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  resize: 'none'
                }}
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
              
              {/* 输入框内的控制按钮 */}
              <div style={{ 
                position: 'absolute', 
                bottom: '16px', 
                left: '24px', 
                display: 'flex', 
                gap: '8px' 
              }}>
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<IconExpand />}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    border: 'none'
                  }}
                />
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<IconApps />}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    border: 'none'
                  }}
                />
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<IconList />}
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    border: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 模式选择和发送按钮 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <Space>
              <Button
                type={promptMode === 'auto' ? 'primary' : 'outline'}
                onClick={() => setPromptMode('auto')}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px'
                }}
              >
                Auto
              </Button>
              <Button
                type={promptMode === 'thinking' ? 'primary' : 'outline'}
                onClick={() => setPromptMode('thinking')}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px'
                }}
              >
                Thinking
              </Button>
              <Button
                type={promptMode === 'fast' ? 'primary' : 'outline'}
                onClick={() => setPromptMode('fast')}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px'
                }}
              >
                Fast
              </Button>
            </Space>
            
            <Button
              type="primary"
              icon={<IconSend />}
              size="large"
              style={{
                borderRadius: '20px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              发送
            </Button>
          </div>

          {/* 下拉选择器区域 */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {/* 知识库选择器 */}
            <Dropdown
              droplist={
                <div style={{ padding: '8px 0', minWidth: '200px' }}>
                  <div style={{ padding: '8px 16px', color: '#6b7280', fontSize: '12px' }}>知识库</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>知识库1</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>知识库2</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>知识库3</div>
                </div>
              }
              trigger="click"
            >
              <Button
                type="outline"
                style={{
                  borderRadius: '12px',
                  padding: '12px 20px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white'
                }}
              >
                知识库 <IconDown style={{ marginLeft: '8px' }} />
              </Button>
            </Dropdown>

            {/* 记忆库选择器 */}
            <Dropdown
              droplist={
                <div style={{ padding: '8px 0', minWidth: '200px' }}>
                  <div style={{ padding: '8px 16px', color: '#6b7280', fontSize: '12px' }}>记忆库</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库1</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库2</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库3</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库4</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库5</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库6</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库7</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>记忆库8</div>
                </div>
              }
              trigger="click"
            >
              <Button
                type="outline"
                style={{
                  borderRadius: '12px',
                  padding: '12px 20px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white'
                }}
              >
                记忆库 <IconDown style={{ marginLeft: '8px' }} />
              </Button>
            </Dropdown>

            {/* 变量库选择器 */}
            <Dropdown
              droplist={
                <div style={{ padding: '8px 0', minWidth: '200px' }}>
                  <div style={{ padding: '8px 16px', color: '#6b7280', fontSize: '12px' }}>变量库</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>变量库1</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>变量库2</div>
                  <div style={{ padding: '8px 16px', cursor: 'pointer', hover: { backgroundColor: '#f3f4f6' } }}>变量库3</div>
                </div>
              }
              trigger="click"
            >
              <Button
                type="outline"
                style={{
                  borderRadius: '12px',
                  padding: '12px 20px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white'
                }}
              >
                变量库 <IconDown style={{ marginLeft: '8px' }} />
              </Button>
            </Dropdown>
          </div>
        </Card>
      </div>

      {/* 保存Prompt到项目模态框 */}
      <PromptSaveSelector
        visible={showSaveSelector}
        onClose={() => setShowSaveSelector(false)}
        onSave={handleSaveToProject}
        loading={saveLoading}
      />
    </AppLayout>
  );
}