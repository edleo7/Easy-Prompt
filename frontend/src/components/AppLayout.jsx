import React, { useState } from 'react'
import { Layout, Menu, Button, Typography, Avatar, Dropdown } from '@arco-design/web-react'
import { IconList, IconBook, IconThunderbolt, IconSettings, IconEye, IconFile, IconMenuFold, IconMenuUnfold, IconMessage, IconFolder, IconLink, IconCode, IconUser, IconCloud, IconShareAlt, IconPoweroff } from '@arco-design/web-react/icon'
import mainLogo from '../assets/images/品牌/主logo.png'
import pureLogo from '../assets/images/品牌/纯logo.png'
import { authAPI } from '../services/api'

const { Sider, Content } = Layout

export default function AppLayout({ 
  currentPage, 
  setCurrentPage, 
  children,
  pageTitle,
  pageSubtitle 
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // 处理用户头像点击事件
  const handleUserAvatarClick = () => {
    // 检查是否已登录
    const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('user')
    
    if (!isLoggedIn) {
      // 未登录，跳转到登录页面
      window.location.hash = '#/login'
      window.location.reload()
    }
    // 已登录时，点击头像不执行任何操作，由下拉菜单处理
  }

  // 处理退出登录
  const handleLogout = () => {
    authAPI.logout()
  }

  // 获取用户信息
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        return JSON.parse(userStr)
      } catch (e) {
        return null
      }
    }
    return null
  }

  const userInfo = getUserInfo()
  const isLoggedIn = !!userInfo


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
                <Menu>
                  <Menu.Item key="account" onClick={() => setCurrentPage('account-center')}>
                    <IconUser style={{ marginRight: 8 }} />
                    账户中心
                  </Menu.Item>
                  <Menu.Item key="subscription" onClick={() => setCurrentPage('my-subscription')}>
                    <IconShareAlt style={{ marginRight: 8 }} />
                    我的订阅
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item key="logout" onClick={handleLogout}>
                    <IconPoweroff style={{ marginRight: 8 }} />
                    退出登录
                  </Menu.Item>
                </Menu>
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
                      {userInfo?.name || '用户'}
                    </div>
                    <div style={{ fontSize: 11, color: '#86909c', marginTop: 2 }}>
                      已登录
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
                    未登录
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


    </Layout>
  )
}
