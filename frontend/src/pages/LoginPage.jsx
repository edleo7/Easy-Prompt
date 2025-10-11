import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, Space, Divider, Notification, Link } from '@arco-design/web-react'
import { IconUser, IconLock, IconGithub, IconWechat, IconClose } from '@arco-design/web-react/icon'
import mainLogo from '../assets/images/品牌/主logo.png'
import { authAPI } from '../services/api'

const { Title, Text } = Typography

// 添加 CSS 动画
const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`
if (!document.head.querySelector('style[data-login-animation]')) {
  styleSheet.setAttribute('data-login-animation', 'true')
  document.head.appendChild(styleSheet)
}

function LoginPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      console.log('登录信息:', values)
      
      const response = await authAPI.login({
        email: values.username,
        password: values.password
      })
      
      if (response.code === 200) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        Notification.success({
          title: '登录成功',
          content: '欢迎回来！',
          duration: 3000
        })
        
        setTimeout(() => {
          window.location.hash = '#/'
          window.location.reload()
        }, 1000)
      } else {
        Notification.error({
          title: '登录失败',
          content: response.message || '请检查用户名和密码',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('登录错误:', error)
      Notification.error({
        title: '登录失败',
        content: error.message || '请检查用户名和密码',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = () => {
    Notification.info({
      title: '提示',
      content: '注册功能开发中...',
      duration: 2000
    })
  }

  const handleForgotPassword = () => {
    Notification.info({
      title: '提示',
      content: '忘记密码功能开发中...',
      duration: 2000
    })
  }

  const handleClose = () => {
    // 返回主页
    window.location.hash = '#/'
    window.location.reload()
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        padding: '60px 20px',
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={(e) => {
        // 点击背景遮罩层时关闭
        if (e.target === e.currentTarget) {
          handleClose()
        }
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: 'none',
          animation: 'slideIn 0.3s ease-out',
          position: 'relative',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        {/* 关闭按钮 */}
        <Button
          icon={<IconClose />}
          shape="circle"
          size="small"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            border: 'none',
            background: 'transparent',
            color: '#86909c',
            cursor: 'pointer',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f2f3f5'
            e.currentTarget.style.color = '#1d2129'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#86909c'
          }}
        />
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src={mainLogo}
            alt="EasyPrompt"
            style={{
              height: 60,
              marginBottom: 16,
              objectFit: 'contain'
            }}
          />
          <Title heading={3} style={{ margin: 0, color: '#1d2129' }}>
            欢迎使用 EasyPrompt
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Prompt 增强与记忆管理平台
          </Text>
        </div>

        <Form
          form={form}
          onSubmit={handleLogin}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="用户名"
            field="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { minLength: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              prefix={<IconUser />}
              placeholder="请输入用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            field="password"
            rules={[
              { required: true, message: '请输入密码' },
              { minLength: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password
              prefix={<IconLock />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Form.Item field="remember" style={{ margin: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ marginRight: 8 }} /> 记住我
                </label>
              </Form.Item>
              <Link onClick={handleForgotPassword}>
                忘记密码？
              </Link>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6aa1ff, #165dff)',
                border: 'none',
                fontSize: 16,
                fontWeight: 500
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            size="large"
            style={{ width: '100%', height: 44 }}
            icon={<IconGithub />}
          >
            使用 GitHub 登录
          </Button>

          <Button
            size="large"
            style={{ width: '100%', height: 44 }}
            icon={<IconWechat />}
          >
            使用微信登录
          </Button>
        </Space>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid #f2f3f5'
        }}>
          <Text type="secondary">
            还没有账号？{' '}
            <Link onClick={handleRegister} style={{ fontWeight: 500 }}>
              立即注册
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
