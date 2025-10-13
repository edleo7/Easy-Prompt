import React, { useState, useEffect } from 'react'
import { Modal, Button, Typography, Tabs } from '@arco-design/web-react'
import { IconClose } from '@arco-design/web-react/icon'
import LoginForm from './LoginForm'
import SlideCaptcha from './SlideCaptcha'
import OtherLoginMethods from './OtherLoginMethods'
import PolicyAgreement from './PolicyAgreement'
import { Message } from '@arco-design/web-react'

const { Title, Text } = Typography
const { TabPane } = Tabs

export default function LoginModal({ 
  visible, 
  onClose, 
  onLogin,
  title = "欢迎回来",
  subtitle = "请登录您的账户以继续使用"
}) {
  const [activeTab, setActiveTab] = useState('phone')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [agreePolicy, setAgreePolicy] = useState(false)
  const [showCaptcha, setShowCaptcha] = useState(false)

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!visible) {
      setActiveTab('phone');
      setRememberMe(false);
      setAgreePolicy(false);
      setShowCaptcha(false);
    }
  }, [visible]);

  // 处理登录成功
  const handleLoginSuccess = (userData) => {
    onLogin && onLogin(userData);
    onClose && onClose();
  };

  // 处理忘记密码
  const handleForgotPassword = () => {
    Message.info('忘记密码功能开发中...')
  };

  // 处理显示验证码
  const handleShowCaptcha = () => {
    setShowCaptcha(true);
  };

  // 处理验证码成功
  const handleCaptchaSuccess = () => {
    Message.success('验证码已发送');
  };

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
            <LoginForm
              activeTab={activeTab}
              loading={loading}
              setLoading={setLoading}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              agreePolicy={agreePolicy}
              onSuccess={handleLoginSuccess}
              onForgotPassword={handleForgotPassword}
              onShowCaptcha={handleShowCaptcha}
            />

            {/* 协议复选框 */}
            <PolicyAgreement
              checked={agreePolicy}
              onChange={setAgreePolicy}
            />

            {/* 其他登录方式 */}
            <OtherLoginMethods />
          </div>
        </div>

        {/* 滑块验证 */}
        <SlideCaptcha
          visible={showCaptcha}
          onClose={() => setShowCaptcha(false)}
          onSuccess={handleCaptchaSuccess}
        />
      </div>
    </Modal>
  )
}

