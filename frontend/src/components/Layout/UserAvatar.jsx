import React from 'react'
import { Avatar } from '@arco-design/web-react'
import pureLogo from '../../assets/images/品牌/纯logo.png'

export default function UserAvatar({ 
  isLoggedIn, 
  userInfo, 
  collapsed, 
  onClick 
}) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: collapsed ? 0 : 12, 
        padding: collapsed ? '8px' : '12px', 
        background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)', 
        borderRadius: 12,
        border: '1px solid #e5e6eb',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #e8f0ff 0%, #d6e4ff 100%)'
        e.currentTarget.style.borderColor = '#165dff'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 93, 255, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)'
        e.currentTarget.style.borderColor = '#e5e6eb'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <Avatar 
        size={collapsed ? 32 : 36} 
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
      {!collapsed && (
        <div style={{ flex: 1 }}>
          {isLoggedIn ? (
            <>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 500 }}>
                {userInfo?.username || userInfo?.name || '用户'}
              </div>
              <div style={{ fontSize: 11, color: '#86909c', marginTop: 2 }}>
                {userInfo?.email ? `已登录 • ${userInfo.email}` : '已登录'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 500 }}>
                点击登录
              </div>
              <div style={{ fontSize: 11, color: '#86909c', marginTop: 2 }}>
                未登录 • 体验完整功能
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

