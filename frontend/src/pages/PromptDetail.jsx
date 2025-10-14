import React, { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { Button, List, Typography, Card, Space, Input, Modal, Checkbox } from '@arco-design/web-react';
import { IconShareInternal, IconMoreVertical, IconBook, IconStorage, IconCopy, IconDelete, IconRefresh, IconPlus, IconUpload, IconDown, IconClose } from '@arco-design/web-react/icon';

export default function PromptDetail({ currentPage, setCurrentPage }) {
  // 控制页面内容是否上移的状态
  const [contentMoved, setContentMoved] = useState(false);
  // 控制模态框显示状态
  const [modalVisible, setModalVisible] = useState(false);
  // 控制删除确认框显示状态
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  // 控制共享模态框显示状态
  const [shareModalVisible, setShareModalVisible] = useState(false);
  // 控制共享链接模态框显示状态
  const [shareLinkModalVisible, setShareLinkModalVisible] = useState(false);
  // 共享模态框中选中的问题
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  // 生成的链接
  const [generatedLink, setGeneratedLink] = useState('');

  // 知识库数据
  const knowledgeBaseData = [
    { title: '知识库文件1.txt' },
    { title: '知识库文件2.pdf' },
    { title: '知识库文件3.docx' }
  ];

  // 记忆库数据
  const memoryData = [
    { title: '记忆库记录1' },
    { title: '记忆库记录2' },
    { title: '记忆库记录3' }
  ];

  // 示例数据
  const exampleData = Array.from({ length: 3 }, (_, index) => ({
    id: index + 1,
    question: `这里是问题描述的示例文字 ${index + 1}`,
    thinking: `这里展示AI的思考过程，包括如何理解用户需求、分析问题和制定解决方案。在这个阶段，系统会分析输入内容，提取关键信息，并确定处理策略。这是第${index + 1}个示例。`,
    prompt: `基于思考过程，系统会生成具体的提示词用于指导AI生成内容。这些提示词经过优化，以确保生成的内容符合用户需求并具有高质量。这是第${index + 1}个示例。`
  }));

  // 初始化选中的问题状态
  useEffect(() => {
    if (selectedQuestions.length === 0 && exampleData.length > 0) {
      setSelectedQuestions(exampleData.map(item => item.id));
    }
  }, [exampleData]);

  // 处理向下按钮点击
  const handleMoveDown = () => {
    setContentMoved(true);
  };

  // 处理模态框显示
  const handleMoreClick = () => {
    setModalVisible(true);
  };

  // 处理模态框关闭
  const handleModalCancel = () => {
    setModalVisible(false);
  };

  // 处理添加到项目
  const handleAddToProject = () => {
    console.log('添加到项目');
    setModalVisible(false);
  };

  // 处理删除操作
  const handleDelete = () => {
    console.log('执行删除操作');
    setModalVisible(false);
  };

  // 处理删除确认框显示
  const showDeleteConfirm = () => {
    setDeleteConfirmVisible(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = () => {
    console.log('确认删除');
    setDeleteConfirmVisible(false);
    // 执行实际的删除操作
    handleDelete();
  };

  // 处理删除取消
  const handleDeleteCancel = () => {
    setDeleteConfirmVisible(false);
  };

  // 处理共享模态框显示
  const handleShareClick = () => {
    setShareModalVisible(true);
  };

  // 处理共享模态框关闭
  const handleShareModalCancel = () => {
    setShareModalVisible(false);
  };

  // 处理共享链接模态框显示
  const handleShareLinkModalShow = () => {
    // 生成随机链接
    const randomString = Math.random().toString(36).substring(2, 15);
    setGeneratedLink(`https://chatgpt.com/share/${randomString}`);
    setShareLinkModalVisible(true);
  };

  // 处理共享链接模态框关闭
  const handleShareLinkModalCancel = () => {
    setShareLinkModalVisible(false);
  };

  // 处理创建链接
  const handleCreateLink = () => {
    // 在实际应用中，这里会调用API生成真实的共享链接
    console.log('创建共享链接');
  };

  // 处理问题选择变化
  const handleQuestionSelect = (value) => {
    setSelectedQuestions(value);
  };

  return (
    <AppLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageTitle="Prompt 详情"
      pageSubtitle="查看和管理您的 Prompt"
    >
      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        visible={deleteConfirmVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="确认"
        cancelText="取消"
        status="warning"
        style={{ zIndex: 1001 }}
        modalStyle={{ zIndex: 1001 }}
      >
        <p>确定要删除这个提示词吗？此操作不可恢复。</p>
      </Modal>
      
      {/* 共享模态框 */}
      <Modal
        title="共享"
        visible={shareModalVisible}
        onCancel={handleShareModalCancel}
        footer={[
          <Button key="cancel" onClick={handleShareModalCancel}>
            取消
          </Button>,
          <Button key="share" type="primary" onClick={handleShareLinkModalShow}>
            共享
          </Button>
        ]}
        style={{ zIndex: 1001 }}
        modalStyle={{ zIndex: 1001 }}
      >
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <Checkbox.Group 
            value={selectedQuestions} 
            onChange={handleQuestionSelect}
            style={{ width: '100%' }}
          >
            {exampleData.map((item) => (
              <div 
                key={item.id} 
                style={{ 
                  padding: '12px 0', 
                  borderBottom: '1px solid #e5e5e5' 
                }}
              >
                <Checkbox value={item.id} style={{ width: '100%' }}>
                  <Typography.Text ellipsis style={{ width: 'calc(100% - 24px)', display: 'inline-block' }}>
                    {item.question}
                  </Typography.Text>
                </Checkbox>
              </div>
            ))}
          </Checkbox.Group>
        </div>
      </Modal>

      {/* 共享链接模态框 */}
      <Modal
        title="共享"
        visible={shareLinkModalVisible}
        onCancel={handleShareLinkModalCancel}
        footer={[
          <Button key="cancel" onClick={handleShareLinkModalCancel}>
            取消
          </Button>,
          <Button key="create" type="primary" onClick={handleCreateLink}>
            创建链接
          </Button>
        ]}
        style={{ zIndex: 1001 }}
        modalStyle={{ zIndex: 1001 }}
      >
        <div style={{ padding: '20px 0' }}>
          <Typography.Paragraph style={{ marginBottom: '20px' }}>
            您的姓名以及您在共享后添加的任何消息都将予以保密处理。
          </Typography.Paragraph>
          <Input 
            value={generatedLink} 
            readOnly 
            style={{ width: '100%', marginBottom: '20px' }} 
          />
        </div>
      </Modal>

      <div style={{ padding: '20px', height: '100%', overflow: 'hidden' }}>
        {/* 共享按钮移至顶部右侧 */}
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button type="primary" icon={<IconShareInternal />} iconPosition="right" onClick={handleShareClick}>
            共享
          </Button>
          <IconMoreVertical 
            style={{ fontSize: '20px', color: '#888', cursor: 'pointer' }} 
            onClick={handleMoreClick}
          />
        </div>
        <div style={{ 
          position: 'absolute', 
          top: '60px', 
          right: '20px', 
          left: '20px', 
          borderBottom: '1px solid #e5e5e5' 
        }}></div>
        
        {/* 在分割线下方添加大的div容器 */}
        <div style={{ 
          marginTop: '70px',
          display: 'flex',
          width: '100%',
          height: 'calc(100% - 90px)'
        }}>
          {/* 左侧div，占70%宽度 */}
          <div style={{ 
            flex: 7,
            padding: '20px',
            marginRight: '10px',
            height: '100%',
            overflow: 'hidden'
          }}>
            {/* 参考DeepSeek的对话和生成内容样式结构 */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* 用div包裹主体内容区域之外的其他区域 */}
              <div style={{ 
                overflowY: 'auto',
                flex: 1,
                paddingRight: '10px'
              }}>
                <style>
                  {`
                    div::-webkit-scrollbar {
                      width: 8px;
                    }
                    div::-webkit-scrollbar-track {
                      background: transparent;
                      margin-top: 0;
                      margin-bottom: 0;
                    }
                    div::-webkit-scrollbar-thumb {
                      background: #c1c1c1;
                      border-radius: 4px;
                    }
                    div::-webkit-scrollbar-button {
                      display: none;
                    }
                  `}
                </style>
                {exampleData.map(item => (
                  <div key={item.id}>
                    {/* 问题区域 - 居右显示 */}
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ 
                        background: '#f0f0f0',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        padding: '16px',
                        width: 'fit-content',
                        maxWidth: '70%'
                      }}>
                        <Typography.Paragraph style={{ margin: 0 }}>
                          {item.question}
                        </Typography.Paragraph>
                      </div>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<IconCopy />} 
                        style={{ marginTop: '8px' }}
                      >
                        复制
                      </Button>
                    </div>

                    {/* 思考过程区域 */}
                    <div style={{ 
                      background: '#f7f8fa',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      padding: '16px',
                      maxWidth: '70%',
                      marginTop: '20px'
                    }}>
                      <Typography.Title heading={6} style={{ marginTop: 0 }}>思考过程</Typography.Title>
                      <Typography.Paragraph>
                        {item.thinking}
                      </Typography.Paragraph>
                    </div>

                    {/* 生成提示词区域 */}
                    <div style={{ 
                      background: '#f7f8fa',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      padding: '16px',
                      maxWidth: '70%',
                      marginTop: '20px'
                    }}>
                      <Typography.Title heading={6} style={{ marginTop: 0 }}>生成提示词</Typography.Title>
                      <Typography.Paragraph>
                        {item.prompt}
                      </Typography.Paragraph>
                    </div>
                    
                    {/* 操作按钮区域 */}
                    <Space style={{ marginTop: '20px' }}>
                      <Button type="primary" status="danger" icon={<IconDelete />} onClick={showDeleteConfirm}>
                        删除
                      </Button>
                      <Button type="primary" icon={<IconRefresh />}>
                        重新生成
                      </Button>
                      <Button type="primary" icon={<IconCopy />}>
                        复制
                      </Button>
                    </Space>
                  </div>
                ))}
              </div>

              {/* 主体内容区域 - 从PromptGenerate.jsx复制 */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-end',
                width: '100%',
                marginTop: '30px'
              }}>
                {/* 输入卡片 */}
                <div style={{
                  width: '100%',
                  maxWidth: '700px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* 输入框 */}
                  <div style={{ position: 'relative' }}>
                    <Input.TextArea
                      placeholder="请输入..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '16px 20px',
                        fontSize: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e5e6eb',
                        backgroundColor: '#ffffff'
                      }}
                      autoSize={{ minRows: 3, maxRows: 6 }}
                    />
                    {/* 添加按钮到输入框内左右两侧 */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '20px', display: 'flex', gap: '8px' }}>
                      <Button type="secondary" shape="circle" icon={<IconPlus />} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '16px', right: '20px', display: 'flex', gap: '8px' }}>
                      <Button type="secondary" shape="circle" icon={<IconUpload />} />
                    </div>
                  </div>

                  {/* 输入框下方的按钮和选择器 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0'
                  }}>
                    <Space size="medium">
                      <Button type="primary" style={{ borderRadius: '8px' }}>知识库</Button>
                      <Button type="primary" style={{ borderRadius: '8px' }}>变量库</Button>
                    </Space>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 中间竖线 */}
          <div style={{ 
            width: '1px',
            backgroundColor: '#e5e5e5',
            margin: '0 10px',
            height: '100%'
          }}></div>
          
          {/* 右侧div，占30%宽度，作为引用来源区域 */}
          <div style={{ 
            flex: 3,
            padding: '20px',
            marginLeft: '10px',
            overflowY: 'auto',
            height: '100%'
          }}>
            <style>
              {`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                  margin-top: 0;
                  margin-bottom: 0;
                }
                div::-webkit-scrollbar-thumb {
                  background: #c1c1c1;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-button {
                  display: none;
                }
              `}
            </style>
            <Typography.Title level={4}>引用来源</Typography.Title>
            
            {/* 知识库部分 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <IconBook style={{ marginRight: '8px' }} />
              <span style={{ fontWeight: '500' }}>知识库</span>
            </div>
            <List
              dataSource={knowledgeBaseData}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <span style={{ color: '#1890ff', cursor: 'pointer' }}>{item.title}</span>
                </List.Item>
              )}
            />
            
            {/* 记忆库部分 */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 12px' }}>
              <IconStorage style={{ marginRight: '8px' }} />
              <span style={{ fontWeight: '500' }}>记忆库</span>
            </div>
            <List
              dataSource={memoryData}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0' }}>
                  <span style={{ color: '#1890ff', cursor: 'pointer' }}>{item.title}</span>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}