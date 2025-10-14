import React, { useState } from 'react';
import { Typography, Input, Button, Space, Select } from '@arco-design/web-react';
import { IconPlus, IconMinus, IconUpload, IconQuestionCircle, IconDown } from '@arco-design/web-react/icon';
import AppLayout from '../components/AppLayout';

const { Title, Text } = Typography;
const Option = Select.Option;

export default function PromptGenerate({ currentPage, setCurrentPage }) {
  // 控制页面内容是否上移的状态
  const [contentMoved, setContentMoved] = useState(false);
  // 处理帮助文档点击
  const handleHelpClick = () => {
    // 这里可以打开帮助文档页面或模态框
    console.log('打开帮助文档');
    // 示例：window.open('/help', '_blank');
  };
  
  // 处理向下按钮点击
  const handleMoveDown = () => {
    setContentMoved(true);
  };
  
  // 处理上传按钮点击，切换到Prompt详情页面
  const handleUploadClick = () => {
    setCurrentPage('prompt-detail');
  };

  return (
    <AppLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageTitle="Prompt 生成"
      pageSubtitle="智能生成 Prompt"
    >
      {/* 帮助文档按钮 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100 }}>
        <Button
          type="text"
          icon={<IconQuestionCircle style={{ fontSize: '20px', color: '#888' }} />}
          onClick={handleHelpClick}
          style={{ 
            padding: '4px 12px', 
            borderRadius: '20px',
            minWidth: 'auto',
            color: '#888',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          帮助文档
        </Button>
      </div>

      {/* 左侧导航栏 */}
      {/* 假设这里已经存在左侧导航栏组件 */}

      {/* 主体内容区域 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        // padding: '20px',
        paddingTop: '50px',
        transform: contentMoved ? 'translateY(0vh)' : 'translateY(0)',
        transition: 'transform 0.3s ease'
      }}>
        {/* 标题区域 */}
        <div style={{
          textAlign: 'left', marginBottom: '10px', width: '100%',
          maxWidth: '700px',
        }}>
          <Title heading={2} style={{ fontSize: '36px', fontWeight: '700', margin: '0 0 16px 0' }}>
            你好，
          </Title>
        </div>

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
              <Button type="secondary" shape="circle" icon={<IconUpload />} onClick={handleUploadClick} />
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
            <Select placeholder="请选择" style={{ width: 160 }} allowClear>
              <Option value="option1">选项1</Option>
              <Option value="option2">选项2</Option>
              <Option value="option3">选项3</Option>
            </Select>
          </div>
        </div>
      </div>
      
      {/* 图片展示区域 - 仅在内容移动后显示 */}
      {contentMoved && (
        <div style={{ 
          marginTop: '100px',
          width: '100%',
          maxWidth: '700px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          margin: '100px auto 0'
        }}>
          {/* 第一行图片 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            width: '100%'
          }}>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
          </div>
          
          {/* 第二行图片 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px',
            width: '100%'
          }}>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
            <div style={{ 
              width: 'calc((100% - 40px) / 3)', 
              aspectRatio: '1/1',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px'
            }}>
              🖼️
            </div>
          </div>
        </div>
      )}
      
      {/* 向下按钮 - 仅在内容未移动时显示 */}
      {!contentMoved && (
        <div style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)',
          zIndex: 100 
        }}>
          <Button
            type="text"
            icon={<IconDown style={{ fontSize: '24px', color: '#888' }} />}
            onClick={handleMoveDown}
            style={{ 
              padding: '8px',
              borderRadius: '50%',
              minWidth: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              width: '44px',
              height: '44px'
            }}
          />
        </div>
      )}
    </AppLayout>
  );
}