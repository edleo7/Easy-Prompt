import React, { useState, useEffect, useRef } from 'react'
import { Vertify } from '@alex_xu/react-slider-vertify'
import { 
  Modal, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Tabs, 
  Divider,
  Checkbox,
  Grid,
  Link,
  Message
} from '@arco-design/web-react'
import { 
  IconClose,
  IconUser,
  IconLock,
  IconPhone,
  IconEmail,
  IconWechat,
  IconGithub
} from '@arco-design/web-react/icon'
import { authAPI } from '../services/api.js'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Row, Col } = Grid

export default function NewLoginModal({ 
  visible, 
  onClose, 
  onLogin,
  title = "欢迎回来",
  subtitle = "请登录您的账户以继续使用"
}) {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('phone')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [countryCode, setCountryCode] = useState('+86') // 默认中国码
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false) // 滑块验证状态

  const countryCodeButtonRef = useRef(null)
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 })

  // 常用国家码数据
  const countryCodes = [
    { code: '+86', country: '中国', iso: 'CN' },
    { code: '+1', country: '美国', iso: 'US' },
    { code: '+852', country: '中国香港', iso: 'HK' },
    { code: '+853', country: '中国澳门', iso: 'MO' },
    { code: '+886', country: '中国台湾', iso: 'TW' },
    { code: '+65', country: '新加坡', iso: 'SG' },
    { code: '+60', country: '马来西亚', iso: 'MY' },
    { code: '+66', country: '泰国', iso: 'TH' },
    { code: '+81', country: '日本', iso: 'JP' },
    { code: '+44', country: '英国', iso: 'GB' },
    { code: '+49', country: '德国', iso: 'DE' },
    { code: '+33', country: '法国', iso: 'FR' },
    { code: '+39', country: '意大利', iso: 'IT' },
    { code: '+82', country: '韩国', iso: 'KR' },
    { code: '+61', country: '澳大利亚', iso: 'AU' }
  ]

  // 点击其他区域关闭选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCountrySelector && countryCodeButtonRef.current && 
          !countryCodeButtonRef.current.contains(event.target)) {
        // 检查点击的是否是选择器内部元素
        const selector = document.querySelector('[data-country-selector]');
        if (selector && !selector.contains(event.target)) {
          setShowCountrySelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountrySelector]);

  // 计算选择器位置
  useEffect(() => {
    if (showCountrySelector && countryCodeButtonRef.current) {
      const buttonRect = countryCodeButtonRef.current.getBoundingClientRect()
      const modalRect = countryCodeButtonRef.current.closest('.arco-modal').getBoundingClientRect()
      
      setSelectorPosition({
        top: buttonRect.bottom - modalRect.top + 10,
        left: buttonRect.left - modalRect.left
      })
    }
  }, [showCountrySelector])

  // 重置表单当弹窗关闭时
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setActiveTab('phone');
      setRememberMe(false);
      setAgreePolicy(false);
      setShowCaptcha(false);
    }
  }, [visible, form]);

  // 处理登录/注册
  const handleLogin = async (values) => {
    if (!agreePolicy) {
      Message.error('请先同意用户协议和隐私政策');
      return;
    }
    
    setLoading(true);
    
    try {
      // 根据当前标签页决定登录方式
      if (activeTab === 'phone') {
        // 手机号登录逻辑（这里简化处理，实际应该有验证码验证）
        // 由于后端没有提供手机号登录接口，我们这里模拟处理
        Message.success('手机登录成功');
        onLogin && onLogin(values);
        onClose && onClose(); // 登录成功后关闭弹窗
      } else {
        // 账号密码登录
        const response = await authAPI.login({
          email: values.username,
          password: values.password
        });
        
        if (response && response.code === 200) {
          // 保存token到localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          Message.success('登录成功');
          onLogin && onLogin(response.data);
          onClose && onClose(); // 登录成功后关闭弹窗
        } else {
          Message.error(response?.message || '登录失败');
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      Message.error(error.message || '登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 处理微信登录
  const handleWechatLogin = () => {
    Message.info('微信登录功能开发中...')
  };

  // 处理SSO登录
  const handleSSOLogin = () => {
    Message.info('SSO登录功能开发中...')
  };

  // 处理IAM登录
  const handleIAMLogin = () => {
    Message.info('IAM登录功能开发中...')
  };

  // 处理忘记密码
  const handleForgotPassword = () => {
    Message.info('忘记密码功能开发中...')
  };

  // 处理注册
  const handleRegister = async (values) => {
    if (!agreePolicy) {
      Message.error('请先同意用户协议和隐私政策');
      return;
    }
    
    setLoading(true);
    
    try {
      // 注册用户
      const response = await authAPI.register({
        email: values.username,
        password: values.password,
        name: values.username
      });
      
      if (response && response.code === 201) {
        Message.success('注册成功');
        // 注册成功后自动登录
        const loginResponse = await authAPI.login({
          email: values.username,
          password: values.password
        });
        
        if (loginResponse && loginResponse.code === 200) {
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user));
          onLogin && onLogin(loginResponse.data);
          onClose && onClose(); // 登录成功后关闭弹窗
        }
      } else {
        Message.error(response?.message || '注册失败');
      }
    } catch (error) {
      console.error('注册错误:', error);
      Message.error(error.message || '注册失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前标签页的输入字段
  const getInputFields = () => {
    if (activeTab === 'phone') {
      return (
        <>
          <Form.Item
            field="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { 
                pattern: /^1[3-9]\d{9}$/, 
                message: '请输入正确的手机号格式' 
              }
            ]}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
              <Button
                ref={countryCodeButtonRef}
                onClick={() => setShowCountrySelector(!showCountrySelector)}
                size="large"
                style={{
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  paddingLeft: 12,
                  paddingRight: 12
                }}
              >
                {countryCode} ▼
              </Button>
              <Input
                prefix={<IconPhone style={{ color: '#86909c' }} />}
                placeholder="请输入手机号"
                size="large"
                style={{ 
                  borderRadius: 8,
                  height: 48,
                  fontSize: 16,
                  flex: 1
                }}
              />
            </div>
          </Form.Item>
          
          <Form.Item
            field="smsCode"
            rules={[
              { required: true, message: '请输入验证码' }
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              placeholder="请输入验证码"
              size="large"
              style={{ 
                borderRadius: 8,
                height: 48,
                fontSize: 16
              }}
              suffix={
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => setShowCaptcha(true)}
                  style={{ color: '#165dff' }}
                >
                  获取验证码
                </Button>
              }
            />
          </Form.Item>
        </>
      )
    }

    return (
      <>
        <Form.Item
          field="username"
          rules={[
            { required: true, message: '请输入用户名或邮箱' }
          ]}
          style={{ marginBottom: 20 }}
        >
          <Input
            prefix={<IconUser style={{ color: '#86909c' }} />}
            placeholder="请输入用户名或邮箱"
            size="large"
            style={{ 
              borderRadius: 8,
              height: 48,
              fontSize: 16
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
            placeholder="请输入密码"
            size="large"
            visibilityToggle={{
              visible: passwordVisible,
              onVisibleChange: setPasswordVisible
            }}
            style={{ 
              borderRadius: 8,
              height: 48,
              fontSize: 16
            }}
          />
        </Form.Item>
      </>
    )
  }

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={420}
    >
      <div>
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
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            border: 'none'
          }}
        />
        
        {/* 标题区域 */}
        <div style={{ 
          padding: '24px 24px 16px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderRadius: '8px 8px 0 0',
          margin: '-24px -24px 0 -24px'
        }}>
          <Title heading={3} style={{ 
            margin: 0, 
            color: '#fff',
            fontSize: 24,
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

        {/* 登录方式标签和表单区域 */}
        <div style={{ 
          background: '#fff',
          borderRadius: '0 0 8px 8px',
          margin: '0 -24px -24px -24px',
          padding: '0 24px 24px'
        }}>
          {/* 登录方式标签 */}
          <div>
            <Tabs 
              activeTab={activeTab} 
              onChange={setActiveTab}
              type="line"
              size="large"
              style={{ marginBottom: 24 }}
            >
              <TabPane key="phone" title="手机登录" />
              <TabPane key="account" title="账号登录" />
            </Tabs>
          </div>

          {/* 登录表单 */}
          <div>
            <Form
              form={form}
              layout="vertical"
              onSubmit={activeTab === 'account' ? handleLogin : handleRegister}
              autoComplete="off"
            >
              {getInputFields()}

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
                  height: 48,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 16
                }}
              >
                {loading ? '处理中...' : (activeTab === 'account' ? '登录' : '登录/注册')}
              </Button>

              {/* 协议复选框 */}
              <div style={{ 
                textAlign: 'center',
                marginTop: 16,
                fontSize: 14
              }}>
                <Checkbox
                  checked={agreePolicy}
                  onChange={setAgreePolicy}
                  style={{ 
                    marginRight: 8,
                    verticalAlign: 'middle'
                  }}
                />
                <span style={{ verticalAlign: 'middle' }}>
                  登录即表示同意
                </span>
                <Link 
                  style={{ 
                    color: '#165dff',
                    verticalAlign: 'middle'
                  }}
                >
                  《用户协议》
                </Link>
                <span style={{ 
                  verticalAlign: 'middle',
                  margin: '0 4px'
                }}>
                  和
                </span>
                <Link 
                  style={{ 
                    color: '#165dff',
                    verticalAlign: 'middle'
                  }}
                >
                  《隐私政策》
                </Link>
              </div>

              {/* 分割线 */}
              <div style={{ 
                position: 'relative',
                textAlign: 'center',
                margin: '24px 0'
              }}>
                <Divider style={{ 
                  margin: 0,
                  borderColor: '#e5e5e5'
                }} />
                <span style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: '#fff',
                  padding: '0 16px',
                  color: '#86909c',
                  fontSize: 14
                }}>
                  其他登录方式
                </span>
              </div>

              {/* 其他登录方式 - 纯文字 */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                marginBottom: 16
              }}>
                <Link 
                  onClick={handleWechatLogin}
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#f5f5f5',
                    fontSize: 14,
                    border: '1px solid #e5e5e5',
                    borderRadius: 4,
                    padding: '4px 12px',
                    textDecoration: 'none'
                  }}
                >
                  微信
                </Link>
                <Link 
                  onClick={handleSSOLogin}
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#f5f5f5',
                    fontSize: 14,
                    border: '1px solid #e5e5e5',
                    borderRadius: 4,
                    padding: '4px 12px',
                    textDecoration: 'none'
                  }}
                >
                  SSO
                </Link>
                <Link 
                  onClick={handleIAMLogin}
                  style={{ 
                    color: '#000000',
                    backgroundColor: '#f5f5f5',
                    fontSize: 14,
                    border: '1px solid #e5e5e5',
                    borderRadius: 4,
                    padding: '4px 12px',
                    textDecoration: 'none'
                  }}
                >
                  IAM
                </Link>
              </div>
            </Form>
          </div>
        </div>

        {/* 国家码选择器 */}
        {showCountrySelector && (
          <div 
            data-country-selector
            style={{
              position: 'absolute',
              top: selectorPosition.top,
              left: selectorPosition.left,
              backgroundColor: '#fff',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: 16,
              width: '33%',
              maxWidth: '90vw',
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            <div style={{
              fontSize: 16,
              fontWeight: 500,
              marginBottom: 12,
              color: '#1d2129'
            }}>
              选择国家/地区
            </div>
            {countryCodes.map((item) => (
              <div
                key={item.code}
                onClick={() => {
                  setCountryCode(item.code);
                  setShowCountrySelector(false);
                }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s',
                  fontSize: 14
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f2f3f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: '#1d2129' }}>
                  {item.country}
                </span>
                <span style={{ color: '#86909c' }}>
                  {item.code}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 滑块验证 */}
        {showCaptcha && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 8,
              width: 320
            }}>
              <Vertify
                width={320}
                height={160}
                onSuccess={() => {
                  Message.success('验证成功')
                  setShowCaptcha(false)
                }}
                onFail={() => Message.error('验证失败')}
                onRefresh={() => Message.info('验证码已刷新')}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}