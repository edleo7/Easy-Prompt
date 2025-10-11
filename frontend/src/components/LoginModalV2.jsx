import React, { useState, useEffect } from 'react'
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Divider,
  Checkbox,
  Grid,
  Link
} from '@arco-design/web-react'
import { Message } from '@arco-design/web-react'
import { 
  IconClose,
  IconUser,
  IconLock,
  IconEmail,
  IconWechat,
  IconGithub,
  IconCheckCircle
} from '@arco-design/web-react/icon'

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function LoginModalV2({ 
  visible, 
  onClose, 
  onLogin,
  title = "欢迎使用 EasyPrompt",
  subtitle = "请登录以访问您的个人工作空间"
}) {
  const [form] = Form.useForm()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginStep, setLoginStep] = useState('form') // 'form', 'success'

  // 重置表单当弹窗关闭时
  useEffect(() => {
    if (!visible) {
      form.resetFields()
      setPasswordVisible(false)
      setLoading(false)
      setLoginStep('form')
    }
  }, [visible, form])

  // 处理登录
  const handleLogin = async (values) => {
    setLoading(true)
    try {
      // 模拟登录请求
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 简单的验证逻辑
      if (values.username && values.password) {
        setLoginStep('success')
        setTimeout(() => {
          Message.success('登录成功！')
          onLogin({
            ...values,
            rememberMe,
            loginTime: new Date().toISOString()
          })
          onClose()
        }, 1500)
      } else {
        Message.error('请输入用户名和密码')
      }
    } catch (error) {
      Message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 处理第三方登录
  const handleSocialLogin = (platform) => {
    Message.info(`${platform}登录功能开发中...`)
  }

  // 处理忘记密码
  const handleForgotPassword = () => {
    Message.info('忘记密码功能开发中...')
  }

  // 处理注册
  const handleRegister = () => {
    Message.info('注册功能开发中...')
  }

  // 成功页面
  const renderSuccessPage = () => (
    <div style={{ 
      padding: '60px 40px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      minHeight: 300
    }}>
      <IconCheckCircle 
        style={{ 
          fontSize: 64, 
          color: '#52c41a',
          marginBottom: 24,
          backgroundColor: '#fff',
          borderRadius: '50%',
          padding: 16
        }} 
      />
      <Title heading={3} style={{ 
        color: '#fff',
        marginBottom: 12
      }}>
        登录成功！
      </Title>
      <Text style={{ 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16
      }}>
        正在为您跳转...
      </Text>
    </div>
  )

  // 登录表单
  const renderLoginForm = () => (
    <>
      {/* 标题区域 */}
      <div style={{ 
        padding: '32px 32px 24px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff'
      }}>
        <Title heading={3} style={{ 
          margin: 0, 
          color: '#fff',
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 8
        }}>
          {title}
        </Title>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 14
        }}>
          {subtitle}
        </Text>
      </div>

      {/* 登录表单 */}
      <div style={{ padding: '32px' }}>
        <Form
          form={form}
          layout="vertical"
          onSubmit={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            field="username"
            rules={[
              { required: true, message: '请输入用户名或邮箱' },
              { 
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^[a-zA-Z0-9_]{3,20}$/, 
                message: '请输入正确的用户名或邮箱格式' 
              }
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<IconUser style={{ color: '#86909c' }} />}
              placeholder="用户名或邮箱"
              size="large"
              style={{ 
                borderRadius: 10,
                height: 50,
                fontSize: 16,
                border: '2px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}
            />
          </Form.Item>

          <Form.Item
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6位' }
            ]}
            style={{ marginBottom: 16 }}
          >
            <Input.Password
              prefix={<IconLock style={{ color: '#86909c' }} />}
              placeholder="密码"
              size="large"
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible
              }}
              style={{ 
                borderRadius: 10,
                height: 50,
                fontSize: 16,
                border: '2px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}
            />
          </Form.Item>

          {/* 记住我和忘记密码 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <Checkbox
              checked={rememberMe}
              onChange={setRememberMe}
              style={{ fontSize: 14 }}
            >
              记住我
            </Checkbox>
            <Link 
              onClick={handleForgotPassword}
              style={{ fontSize: 14, color: '#165dff' }}
            >
              忘记密码？
            </Link>
          </div>

          {/* 登录按钮 */}
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={loading}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 24,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '登录中...' : '立即登录'}
          </Button>

          {/* 分割线 */}
          <div style={{ 
            position: 'relative',
            textAlign: 'center',
            marginBottom: 24
          }}>
            <Divider style={{ margin: 0 }}>
              <Text style={{ 
                color: '#86909c',
                fontSize: 12,
                backgroundColor: '#fff',
                padding: '0 16px'
              }}>
                或使用以下方式登录
              </Text>
            </Divider>
          </div>

          {/* 第三方登录 */}
          <Row gutter={12} justify="center">
            <Col span={8}>
              <Button
                type="outline"
                size="large"
                icon={<IconWechat style={{ color: '#07c160' }} />}
                onClick={() => handleSocialLogin('微信')}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 10,
                  borderColor: '#e5e6eb',
                  fontSize: 12,
                  transition: 'all 0.3s ease'
                }}
              >
                微信
              </Button>
            </Col>
            <Col span={8}>
              <Button
                type="outline"
                size="large"
                icon={<IconEmail style={{ color: '#1890ff' }} />}
                onClick={() => handleSocialLogin('邮箱')}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 10,
                  borderColor: '#e5e6eb',
                  fontSize: 12,
                  transition: 'all 0.3s ease'
                }}
              >
                邮箱
              </Button>
            </Col>
            <Col span={8}>
              <Button
                type="outline"
                size="large"
                icon={<IconGithub style={{ color: '#333' }} />}
                onClick={() => handleSocialLogin('GitHub')}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 10,
                  borderColor: '#e5e6eb',
                  fontSize: 12,
                  transition: 'all 0.3s ease'
                }}
              >
                GitHub
              </Button>
            </Col>
          </Row>

          {/* 注册链接 */}
          <div style={{ 
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: '#86909c'
          }}>
            还没有账号？
            <Link 
              onClick={handleRegister}
              style={{ 
                color: '#165dff',
                marginLeft: 4,
                fontWeight: 500
              }}
            >
              立即注册
            </Link>
          </div>
        </Form>
      </div>
    </>
  )

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={440}
      style={{ top: '10%' }}
      bodyStyle={{ padding: 0 }}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div style={{ 
        background: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
      }}>
        {/* 关闭按钮 */}
        <Button
          type="text"
          icon={<IconClose />}
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10,
            color: '#86909c',
            fontSize: 18,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none',
            transition: 'all 0.3s ease'
          }}
        />
        
        {loginStep === 'success' ? renderSuccessPage() : renderLoginForm()}
      </div>
    </Modal>
  )
}
