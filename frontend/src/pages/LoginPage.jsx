import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, Space, Divider, Notification, Link } from '@arco-design/web-react'
import { IconUser, IconLock, IconGithub, IconWechat } from '@arco-design/web-react/icon'
import mainLogo from '../assets/images/品牌/主logo.png'
import { authAPI } from '../services/api'

const { Title, Text } = Typography

function LoginPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      console.log('登录信息:', values)
      
      // 调用后端登录 API
      const response = await authAPI.login({
        email: values.username, // 使用用户名作为邮箱
        password: values.password
      })
      
      if (response.code === 200) {
        // 保存 token 到 localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        Notification.success({
          title: '登录成功',
          content: '欢迎回来！',
          duration: 3000
        })
        
        // 跳转到主页
        setTimeout(() => {
          // 使用 hash 路由避免白屏
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img 
            src={mainLogo} 
            alt="EasyPrompt" 
            style={{ 
              height: 60, 
              width: 'auto',
              marginBottom: 16
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
          layout="vertical"
          onSubmit={handleLogin}
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
