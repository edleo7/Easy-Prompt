import React from 'react'
import { Layout, Button } from '@arco-design/web-react'
import { IconMenuFold, IconMenuUnfold } from '@arco-design/web-react/icon'
import mainLogo from '../../assets/images/品牌/主logo.png'
import SidebarMenu from './SidebarMenu'
import BottomMenu from './BottomMenu'
import UserAvatar from './UserAvatar'

const { Sider } = Layout

export default function Sidebar({ 
  collapsed, 
  onCollapse, 
  currentPage, 
  onPageChange, 
  isLoggedIn, 
  userInfo, 
  onUserAvatarClick 
}) {
  return (
    <Sider 
      breakpoint="lg" 
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{ 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderRight: '1px solid #e5e6eb'
      }}
      width={240}
      collapsedWidth={64}
      collapsible
    >
      {/* Logo区域 */}
      <div style={{ 
        padding: collapsed ? '20px 8px' : '20px 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid #f2f3f5',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
      }}>
        {!collapsed && (
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
          icon={collapsed ? <IconMenuUnfold /> : <IconMenuFold />}
          onClick={() => onCollapse(!collapsed)}
          style={{
            color: '#86909c',
            fontSize: 16,
            // padding: '4px',
            minWidth: 'auto'
          }}
        />
      </div>
      
      {/* 主菜单 */}
      <SidebarMenu currentPage={currentPage} onPageChange={onPageChange} />
      
      {/* 底部菜单 */}
      <BottomMenu currentPage={currentPage} onPageChange={onPageChange} collapsed={collapsed} />
      
      {/* 用户头像 */}
      <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16 }}>
        <UserAvatar
          isLoggedIn={isLoggedIn}
          userInfo={userInfo}
          collapsed={collapsed}
          onClick={onUserAvatarClick}
        />
      </div>
    </Sider>
  )
}

