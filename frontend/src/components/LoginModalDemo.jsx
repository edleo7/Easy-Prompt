import React, { useState } from 'react'
import { Button, Space, Typography, Card, Grid } from '@arco-design/web-react'
import NewLoginModal from './NewLoginModal'
import LoginModalV2 from './LoginModalV2'
import LoginModal from './LoginModal'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function LoginModalDemo() {
  const [newModalVisible, setNewModalVisible] = useState(false)
  const [v2ModalVisible, setV2ModalVisible] = useState(false)
  const [originalModalVisible, setOriginalModalVisible] = useState(false)

  const handleLogin = (userData) => {
    console.log('登录成功:', userData)
  }

  return (
    <div style={{ padding: '40px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title heading={2} style={{ textAlign: 'center', marginBottom: 40 }}>
          登录弹窗组件演示
        </Title>
        
        <Row gutter={24}>
          <Col span={8}>
            <Card 
              title="新版本登录弹窗 (NewLoginModal)" 
              style={{ height: 300 }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <Text>特点：</Text>
                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  <li>现代化渐变设计</li>
                  <li>支持账号/手机登录</li>
                  <li>第三方登录选项</li>
                  <li>响应式布局</li>
                </ul>
              </div>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setNewModalVisible(true)}
                style={{ width: '100%' }}
              >
                打开新版本弹窗
              </Button>
            </Card>
          </Col>

          <Col span={8}>
            <Card 
              title="V2版本登录弹窗 (LoginModalV2)" 
              style={{ height: 300 }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <Text>特点：</Text>
                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  <li>登录成功动画</li>
                  <li>更圆润的设计</li>
                  <li>增强的用户体验</li>
                  <li>平滑过渡效果</li>
                </ul>
              </div>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setV2ModalVisible(true)}
                style={{ width: '100%' }}
              >
                打开V2版本弹窗
              </Button>
            </Card>
          </Col>

          <Col span={8}>
            <Card 
              title="原版登录弹窗 (LoginModal)" 
              style={{ height: 300 }}
              bodyStyle={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <Text>特点：</Text>
                <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                  <li>经典设计风格</li>
                  <li>功能完整</li>
                  <li>稳定可靠</li>
                  <li>多登录方式</li>
                </ul>
              </div>
              <Button 
                type="outline" 
                size="large"
                onClick={() => setOriginalModalVisible(true)}
                style={{ width: '100%' }}
              >
                打开原版弹窗
              </Button>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <Title heading={4}>使用说明</Title>
          <Text style={{ color: '#666', lineHeight: 1.6 }}>
            点击上方按钮可以预览不同版本的登录弹窗组件。
            <br />
            每个组件都有不同的设计风格和交互体验，您可以根据项目需求选择合适的版本。
          </Text>
        </div>
      </div>

      {/* 新版本登录弹窗 */}
      <NewLoginModal
        visible={newModalVisible}
        onClose={() => setNewModalVisible(false)}
        onLogin={handleLogin}
        title="欢迎使用 EasyPrompt"
        subtitle="请登录以开始您的AI创作之旅"
      />

      {/* V2版本登录弹窗 */}
      <LoginModalV2
        visible={v2ModalVisible}
        onClose={() => setV2ModalVisible(false)}
        onLogin={handleLogin}
        title="欢迎回来"
        subtitle="请登录以访问您的个人工作空间"
      />

      {/* 原版登录弹窗 */}
      <LoginModal
        visible={originalModalVisible}
        onClose={() => setOriginalModalVisible(false)}
        onLogin={handleLogin}
      />
    </div>
  )
}
