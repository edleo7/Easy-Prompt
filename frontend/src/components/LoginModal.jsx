import React, { useState } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Tabs, 
  Space, 
  Divider,
  message,
  Row,
  Col
} from '@arco-design/web-react'
import { 
  IconEye, 
  IconEyeInvisible, 
  IconClose,
  IconWechat,
  IconEmail,
  IconUser,
  IconLock
} from '@arco-design/web-react/icon'

const { Title, Text, Link } = Typography
const { TabPane } = Tabs

export default function LoginModal({ visible, onClose, onLogin }) {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('account')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  // 处理登录
  const handleLogin = async (values) => {
    setLoading(true)
    try {
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (values.username === 'admin' && values.password === '123456') {
        message.success('登录成功！')
        onLogin(values)
        onClose()
      } else {
        message.error('用户名或密码错误')
      }
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理微信登录
  const handleWechatLogin = () => {
    message.info('微信登录功能开发中...')
  }

  // 处理邮箱登录
  const handleEmailLogin = () => {
    setActiveTab('email')
  }

  // 处理忘记密码
  const handleForgotPassword = () => {
    message.info('忘记密码功能开发中...')
  }

  // 处理注册
  const handleRegister = () => {
    message.info('注册功能开发中...')
  }

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={480}
      style={{ top: '10%' }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{ 
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* 关闭按钮 */}
        <Button
          type="text"
          icon={<IconClose />}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            color: '#86909c',
            fontSize: 16
          }}
        />
        
        {/* 标题区域 */}
        <div style={{ 
          padding: '32px 32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid #f2f3f5'
        }}>
          <Title heading={4} style={{ 
            margin: 0, 
            color: '#1d2129',
            fontSize: 20,
            fontWeight: 600
          }}>
            欢迎来到EasyPrompt
          </Title>
        </div>

        {/* 登录方式标签 */}
        <div style={{ padding: '0 32px' }}>
          <Tabs 
            activeTab={activeTab} 
            onChange={setActiveTab}
            type="line"
            size="large"
            style={{ marginBottom: 24 }}
          >
            <TabPane key="phone" title="手机号登录" />
            <TabPane key="account" title="账号登录" />
          </Tabs>
        </div>

        {/* 登录表单 */}
        <div style={{ padding: '0 32px 32px' }}>
          <Form
            form={form}
            layout="vertical"
            onSubmit={handleLogin}
            autoComplete="off"
          >
            <Form.Item
              label=""
              field="username"
              rules={[
                { required: true, message: '请输入用户名' }
              ]}
              style={{ marginBottom: 20 }}
            >
              <Input
                prefix={<IconUser style={{ color: '#86909c' }} />}
                placeholder="请输入用户名"
                size="large"
                style={{ 
                  borderRadius: 6,
                  height: 48
                }}
              />
            </Form.Item>

            <Form.Item
              label=""
              field="password"
              rules={[
                { required: true, message: '请输入登录密码' }
              ]}
              style={{ marginBottom: 16 }}
            >
              <Input.Password
                prefix={<IconLock style={{ color: '#86909c' }} />}
                placeholder="请输入登录密码"
                size="large"
                visibilityToggle={{
                  visible: passwordVisible,
                  onVisibleChange: setPasswordVisible
                }}
                style={{ 
                  borderRadius: 6,
                  height: 48
                }}
              />
            </Form.Item>

            {/* 服务条款 */}
            <div style={{ 
              marginBottom: 24,
              fontSize: 12,
              color: '#86909c',
              lineHeight: '18px'
            }}>
              登录视为您已阅读并同意EasyPrompt{' '}
              <Link style={{ color: '#165dff' }}>服务条款</Link>
              {' '}和{' '}
              <Link style={{ color: '#165dff' }}>隐私政策</Link>
            </div>

            {/* 登录按钮 */}
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 16
              }}
            >
              立即登录
            </Button>

            {/* 忘记密码和特殊登录 */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: 24
            }}>
              <Link 
                onClick={handleForgotPassword}
                style={{ fontSize: 14 }}
              >
                忘记密码
              </Link>
              <Link 
                onClick={() => message.info('IAM子用户登录功能开发中...')}
                style={{ fontSize: 14 }}
              >
                IAM子用户登录|企业联邦登录
              </Link>
            </div>

            {/* 其他登录方式 */}
            <div>
              <div style={{ 
                textAlign: 'center',
                marginBottom: 16,
                fontSize: 14,
                color: '#86909c'
              }}>
                其他登录方式
              </div>
              
              <Row gutter={16} justify="center">
                <Col span={6}>
                  <Button
                    type="outline"
                    size="large"
                    icon={<IconEmail />}
                    onClick={handleEmailLogin}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 6,
                      borderColor: '#e5e6eb'
                    }}
                  >
                    邮箱
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    type="outline"
                    size="large"
                    icon={<IconWechat />}
                    onClick={handleWechatLogin}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 6,
                      borderColor: '#e5e6eb'
                    }}
                  >
                    微信
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    type="outline"
                    size="large"
                    onClick={() => message.info('TikTok登录功能开发中...')}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 6,
                      borderColor: '#e5e6eb',
                      fontSize: 12
                    }}
                  >
                    TikTok
                  </Button>
                </Col>
                <Col span={6}>
                  <Button
                    type="outline"
                    size="large"
                    onClick={() => message.info('头条登录功能开发中...')}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 6,
                      borderColor: '#e5e6eb',
                      fontSize: 12
                    }}
                  >
                    头条
                  </Button>
                </Col>
              </Row>
            </div>

            {/* 注册链接 */}
            <div style={{ 
              textAlign: 'center',
              marginTop: 24,
              fontSize: 14,
              color: '#86909c'
            }}>
              没有账号？
              <Link 
                onClick={handleRegister}
                style={{ 
                  color: '#165dff',
                  marginLeft: 4
                }}
              >
                去注册
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  )
}






