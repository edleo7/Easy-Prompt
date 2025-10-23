import React, { useState, useEffect } from 'react'
import { Layout } from '@arco-design/web-react'
import { authAPI } from '../services/api'
import Sidebar from './Layout/Sidebar'
import LoginModal from './LoginModal'
import UserMenu from './UserMenu'
import backgroundImage from '../assets/images/背景/背景底图.png'

const { Content } = Layout

export default function AppLayout({ 
  currentPage, 
  setCurrentPage, 
  children,
  pageTitle,
  pageSubtitle 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState(null)

  // 初始化登录状态
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserInfo(user)
        setIsLoggedIn(true)
      } catch (e) {
        // 如果解析失败，清除无效数据
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setIsLoggedIn(false)
        setUserInfo(null)
      }
    } else {
      setIsLoggedIn(false)
      setUserInfo(null)
    }
  }, [])
  
  // 处理用户头像点击事件
  const handleUserAvatarClick = () => {
    if (!isLoggedIn) {
      // 未登录，打开登录弹窗
      setLoginModalVisible(true)
    } else {
      // 已登录，打开用户设置模态框
      setUserMenuVisible(true)
    }
  }

  // 处理退出登录
  const handleLogout = () => {
    // 关闭用户菜单
    setUserMenuVisible(false)
    // 清除本地状态
    setIsLoggedIn(false)
    setUserInfo(null)
    // 调用API清除存储
    authAPI.logout()
  }

  // 处理登录成功
  const handleLoginSuccess = (userData) => {
    // 保存用户信息到localStorage
    localStorage.setItem('user', JSON.stringify(userData.user || userData))
    localStorage.setItem('token', userData.token || 'mock-token-' + Date.now())
    
    // 更新状态
    setUserInfo(userData.user || userData)
    setIsLoggedIn(true)
    
    // 关闭登录弹窗
    setLoginModalVisible(false)
    
    // 可以在这里添加其他登录成功后的逻辑
    console.log('用户登录成功:', userData)
  }

  // 处理菜单项点击
  const handleMenuClick = (key) => {
    switch (key) {
      case 'profile':
        setCurrentPage('account-center')
        break
      case 'security':
        console.log('安全设置')
        break
      case 'tickets':
        console.log('工单')
        break
      case 'privacy':
        console.log('隐私权限')
        break
      case 'preferences':
        console.log('操作设置')
        break
      case 'help':
        console.log('帮助文档')
        break
      case 'policy':
        console.log('隐私政策')
        break
      default:
        break
    }
  }


  return (
    <Layout style={{ height: '100vh', background: '#f7f8fa', overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        onUserAvatarClick={handleUserAvatarClick}
      />
      
      <Content style={{ 
        padding: '32px', 
        background: `linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {children}
      </Content>

      {/* 登录弹窗 */}
      <LoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLoginSuccess}
        title="欢迎使用 EasyPrompt"
        subtitle="请登录以访问您的个人工作空间"
      />

      {/* 用户设置模态框 */}
      <UserMenu
        visible={userMenuVisible}
        onClose={() => setUserMenuVisible(false)}
        userInfo={userInfo}
        onLogout={handleLogout}
      />
    </Layout>
  )
}