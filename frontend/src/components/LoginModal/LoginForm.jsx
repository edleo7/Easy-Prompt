import React, { useState, useRef, useEffect } from 'react'
import { Form, Input, Button, Checkbox, Link, Message } from '@arco-design/web-react'
import { IconUser, IconLock, IconPhone } from '@arco-design/web-react/icon'
import { authAPI } from '../../services/api.js'
import CountryCodeSelector from './CountryCodeSelector'

export default function LoginForm({ 
  activeTab, 
  loading, 
  setLoading,
  rememberMe, 
  setRememberMe, 
  agreePolicy,
  onSuccess,
  onForgotPassword,
  onShowCaptcha
}) {
  const [form] = Form.useForm()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [countryCode, setCountryCode] = useState('+86')
  const [showCountrySelector, setShowCountrySelector] = useState(false)
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 })
  const countryCodeButtonRef = useRef(null)

  // 点击其他区域关闭选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCountrySelector && countryCodeButtonRef.current && 
          !countryCodeButtonRef.current.contains(event.target)) {
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

  // 处理登录
  const handleLogin = async (values) => {
    if (!agreePolicy) {
      Message.error('请先同意用户协议和隐私政策');
      return;
    }
    
    setLoading(true);
    
    try {
      if (activeTab === 'phone') {
        // 手机号登录逻辑
        Message.success('手机登录成功');
        onSuccess && onSuccess(values);
      } else {
        // 账号密码登录
        const response = await authAPI.login({
          email: values.username,
          password: values.password
        });
        
        if (response && response.code === 200) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          Message.success('登录成功');
          onSuccess && onSuccess(response.data);
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

  // 处理国家码选择
  const handleCountryCodeSelect = (code) => {
    setCountryCode(code);
    setShowCountrySelector(false);
  };

  // 渲染手机登录表单
  const renderPhoneForm = () => (
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
          <CountryCodeSelector
            visible={showCountrySelector}
            position={selectorPosition}
            onSelect={handleCountryCodeSelect}
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
              onClick={() => onShowCaptcha && onShowCaptcha()}
              style={{ color: '#165dff' }}
            >
              获取验证码
            </Button>
          }
        />
      </Form.Item>
    </>
  );

  // 渲染账号密码登录表单
  const renderAccountForm = () => (
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
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onSubmit={handleLogin}
      autoComplete="off"
    >
      {activeTab === 'phone' ? renderPhoneForm() : renderAccountForm()}

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
          onClick={onForgotPassword}
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
    </Form>
  )
}

