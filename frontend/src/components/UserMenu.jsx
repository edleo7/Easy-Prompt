import React from 'react';
import { Menu, Avatar } from '@arco-design/web-react';
import { 
  IconUser, 
  IconSettings, 
  IconSafe, 
  IconLock, 
  IconApps,
  IconPoweroff,
  IconFile,
  IconIdcard
} from '@arco-design/web-react/icon';
import pureLogo from '../assets/images/品牌/纯logo.png';

export default function UserMenu({ userInfo, onLogout, onMenuItemClick }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 16px',
      background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
      borderRadius: 12,
      border: '1px solid #e5e6eb'
    }}>
      {/* 用户头像和信息 */}
      <Avatar 
        size={64} 
        style={{ 
          padding: 4,
          marginBottom: 12,
          background: '#fff',
          border: '1px solid #e5e6eb'
        }}
      >
        <img 
          src="https://placehold.co/64x64?text=U" // 使用占位图片
          alt="User Avatar" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderRadius: '50%'
          }} 
        />
      </Avatar>
      
      <div style={{ 
        textAlign: 'center',
        marginBottom: 20
      }}>
        <div style={{ 
          fontSize: 16, 
          color: '#1d2129', 
          fontWeight: 500,
          marginBottom: 4
        }}>
          {userInfo?.username || userInfo?.name || 'Kevin Zhang'}
        </div>
        <div style={{ 
          fontSize: 12, 
          color: '#86909c'
        }}>
          {userInfo?.email || 'kevin@example.com'}
        </div>
      </div>
      
      {/* 菜单选项 */}
      <Menu
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent'
        }}
        onClickMenuItem={onMenuItemClick}
      >
        <Menu.Item key="profile">
          <IconUser style={{ marginRight: 8 }} />
          个人资料
        </Menu.Item>
        <Menu.Item key="security">
          <IconSafe style={{ marginRight: 8 }} />
          安全设置
        </Menu.Item>
        <Menu.Item key="tickets">
          <IconIdcard style={{ marginRight: 8 }} />
          工单
        </Menu.Item>
        <Menu.Item key="privacy">
          <IconLock style={{ marginRight: 8 }} />
          隐私权限
        </Menu.Item>
        <Menu.Item key="preferences">
          <IconApps style={{ marginRight: 8 }} />
          操作设置
        </Menu.Item>
        <Menu.Item key="help">
          <IconFile style={{ marginRight: 8 }} />
          帮助文档
        </Menu.Item>
        <Menu.Item key="enterprise">
          <IconSettings style={{ marginRight: 8 }} />
          企业认证
        </Menu.Item>
        
        <Menu.Item key="divider" disabled style={{ 
          borderTop: '1px solid #e5e6eb', 
          margin: '8px 0',
          padding: 0
        }} />
        
        <Menu.Item key="logout" onClick={onLogout}>
          <IconPoweroff style={{ marginRight: 8 }} />
          退出登录
        </Menu.Item>
        
        <Menu.Item key="policy">
          <IconFile style={{ marginRight: 8 }} />
          隐私政策
        </Menu.Item>
      </Menu>
    </div>
  );
}
