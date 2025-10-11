import React, { useState, useEffect } from 'react'
import { Layout, Menu, Button, Typography, Avatar, Dropdown } from '@arco-design/web-react'
import { IconList, IconBook, IconThunderbolt, IconSettings, IconEye, IconFile, IconMenuFold, IconMenuUnfold, IconMessage, IconFolder, IconLink, IconCode, IconUser, IconCloud, IconShareAlt, IconPoweroff } from '@arco-design/web-react/icon'
import mainLogo from '../assets/images/品牌/主logo.png'
import pureLogo from '../assets/images/品牌/纯logo.png'
import { authAPI } from '../services/api'
import NewLoginModal from './NewLoginModal'
import UserMenu from './UserMenu'

const { Sider, Content } = Layout

export default function AppLayout({ 
  currentPage, 
  setCurrentPage, 
  children,
  pageTitle,
  pageSubtitle 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loginModalVisible, setLoginModalVisible] = useState(false)
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
    }
    // 已登录时，点击头像不执行任何操作，由下拉菜单处理
  }

  // 处理退出登录
  const handleLogout = () => {
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
    <Layout style={{ height: '100vh', background: '#f7f8fa', overflow: 'hidden' }}>
      <Sider 
        breakpoint="lg" 
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        style={{ 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          borderRight: '1px solid #e5e6eb'
        }}
        width={240}
        collapsedWidth={64}
        collapsible
      >
        <div style={{ 
          padding: sidebarCollapsed ? '20px 8px' : '20px 16px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f2f3f5',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
        }}>
          {!sidebarCollapsed && (
            <img 
              src={mainLogo} 
              alt="EasyPrompt" 
              style={{ 
                height: 40, 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          )}
          <Button
            type="text"
            icon={sidebarCollapsed ? <IconMenuUnfold /> : <IconMenuFold />}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              color: '#86909c',
              fontSize: 16,
              padding: '4px',
              minWidth: 'auto'
            }}
          />
        </div>
        
        <Menu 
          selectedKeys={[currentPage]} 
          style={{ 
            border: 'none', 
            background: 'transparent',
            padding: '8px 0'
          }}
        >
          <Menu.Item 
            key="project-management" 
            style={{ margin: '4px 8px', borderRadius: 6 }}
            onClick={() => setCurrentPage('project-management')}
          >
            <IconFolder style={{ marginRight: 8 }} />
            项目管理
          </Menu.Item>
          
          <Menu.SubMenu 
            key="prompt-management" 
            title={
              <span>
                <IconThunderbolt style={{ marginRight: 8 }} />
                Prompt管理
              </span>
            }
            style={{ margin: '4px 8px', borderRadius: 6 }}
          >
            <Menu.Item 
              key="prompt-generate" 
              style={{ margin: '2px 4px', borderRadius: 4 }}
              onClick={() => setCurrentPage('prompt-generate')}
            >
              <IconThunderbolt style={{ marginRight: 8 }} />
              Prompt 生成
            </Menu.Item>
            <Menu.Item 
              key="variable-management" 
              style={{ margin: '2px 4px', borderRadius: 4 }}
              onClick={() => setCurrentPage('variable-management')}
            >
              <IconSettings style={{ marginRight: 8 }} />
              变量管理
            </Menu.Item>
            <Menu.SubMenu 
              key="prompt-debug" 
              title={
                <span>
                  <IconSettings style={{ marginRight: 8 }} />
                  Prompt 调试
                </span>
              }
              style={{ margin: '2px 4px', borderRadius: 4 }}
            >
            <Menu.Item 
              key="text-understanding" 
              style={{ margin: '2px 8px', borderRadius: 4 }}
              onClick={() => setCurrentPage('text-understanding')}
            >
              <IconFile style={{ marginRight: 8 }} />
              文本理解
            </Menu.Item>
            <Menu.Item 
              key="multi-turn-dialogue" 
              style={{ margin: '2px 8px', borderRadius: 4 }}
              onClick={() => setCurrentPage('multi-turn-dialogue')}
            >
              <IconMessage style={{ marginRight: 8 }} />
              多轮对话
            </Menu.Item>
            </Menu.SubMenu>
            </Menu.SubMenu>
            
            <Menu.Item 
              key="memory-management" 
              style={{ margin: '4px 8px', borderRadius: 6 }}
              onClick={() => setCurrentPage('memory-management')}
            >
              <IconBook style={{ marginRight: 8 }} />
              记忆管理
            </Menu.Item>
            
            <Menu.Item 
              key="knowledge-base" 
              style={{ margin: '4px 8px', borderRadius: 6 }}
              onClick={() => setCurrentPage('knowledge-base')}
            >
              <IconFile style={{ marginRight: 8 }} />
              知识库管理
            </Menu.Item>
        </Menu>
        
        {/* 底部菜单项 */}
        <div style={{ 
          position: 'absolute', 
          bottom: 80, 
          left: 16, 
          right: 16,
          display: sidebarCollapsed ? 'none' : 'block'
        }}>
          <Menu
            mode="vertical"
            selectedKeys={currentPage === 'api-docs' || currentPage === 'open-platform' || currentPage === 'account-center' || currentPage === 'my-subscription' ? [currentPage] : []}
            style={{ 
              border: 'none', 
              background: 'transparent',
              marginBottom: 16
            }}
          >
            <Menu.Item 
              key="api-docs" 
              style={{ 
                margin: '2px 4px', 
                borderRadius: 4,
                height: '36px',
                lineHeight: '36px'
              }}
              onClick={() => setCurrentPage('api-docs')}
            >
              <IconLink style={{ marginRight: 8 }} />
              API文档
            </Menu.Item>
            
            <Menu.Item 
              key="open-platform" 
              style={{ 
                margin: '2px 4px', 
                borderRadius: 4,
                height: '36px',
                lineHeight: '36px'
              }}
              onClick={() => setCurrentPage('open-platform')}
            >
              <IconCloud style={{ marginRight: 8 }} />
              开放平台
            </Menu.Item>
            
            <Menu.Item 
              key="account-center" 
              style={{ 
                margin: '2px 4px', 
                borderRadius: 4,
                height: '36px',
                lineHeight: '36px'
              }}
              onClick={() => setCurrentPage('account-center')}
            >
              <IconUser style={{ marginRight: 8 }} />
              账户中心
            </Menu.Item>
            
            <Menu.Item 
              key="my-subscription" 
              style={{ 
                margin: '2px 4px', 
                borderRadius: 4,
                height: '36px',
                lineHeight: '36px'
              }}
              onClick={() => setCurrentPage('my-subscription')}
            >
              <IconShareAlt style={{ marginRight: 8 }} />
              我的订阅
            </Menu.Item>
          </Menu>
        </div>
        
        <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
          {isLoggedIn ? (
            <Dropdown
              droplist={
                <UserMenu 
                  userInfo={userInfo} 
                  onLogout={handleLogout} 
                  onMenuItemClick={handleMenuClick}
                />
              }
              position="top"
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: sidebarCollapsed ? 0 : 12, 
                  padding: sidebarCollapsed ? '8px' : '12px', 
                  background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)', 
                  borderRadius: 12,
                  border: '1px solid #e5e6eb',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #e8f0ff 0%, #d6e4ff 100%)'
                  e.target.style.borderColor = '#165dff'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(22, 93, 255, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
                  e.target.style.borderColor = '#e5e6eb'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <Avatar 
                  size={sidebarCollapsed ? 32 : 36} 
                  style={{ padding: 4 }}
                >
                  <img 
                    src={pureLogo} 
                    alt="App" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain',
                      borderRadius: 4
                    }} 
                  />
                </Avatar>
                {!sidebarCollapsed && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 500 }}>
                      {userInfo?.username || userInfo?.name || '用户'}
                    </div>
                    <div style={{ fontSize: 11, color: '#86909c', marginTop: 2 }}>
                      {userInfo?.email ? `已登录 • ${userInfo.email}` : '已登录'}
                    </div>
                  </div>
                )}
              </div>
            </Dropdown>
          ) : (
            <div 
              onClick={handleUserAvatarClick}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: sidebarCollapsed ? 0 : 12, 
                padding: sidebarCollapsed ? '8px' : '12px', 
                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)', 
                borderRadius: 12,
                border: '1px solid #e5e6eb',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #e8f0ff 0%, #d6e4ff 100%)'
                e.target.style.borderColor = '#165dff'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(22, 93, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
                e.target.style.borderColor = '#e5e6eb'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <Avatar 
                size={sidebarCollapsed ? 32 : 36} 
                style={{ padding: 4 }}
              >
                <img 
                  src={pureLogo} 
                  alt="App" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    borderRadius: 4
                  }} 
                />
              </Avatar>
              {!sidebarCollapsed && (
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 500 }}>
                    点击登录
                  </div>
                  <div style={{ fontSize: 11, color: '#86909c', marginTop: 2 }}>
                    未登录 • 体验完整功能
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Sider>
      
      <Content style={{ 
        padding: '32px', 
        background: '#f7f8fa', 
        flex: 1, 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </Content>

      {/* 登录弹窗 */}
      <NewLoginModal
        visible={loginModalVisible}
        onClose={() => setLoginModalVisible(false)}
        onLogin={handleLoginSuccess}
        title="欢迎使用 EasyPrompt"
        subtitle="请登录以访问您的个人工作空间"
      />
    </Layout>
  )
}