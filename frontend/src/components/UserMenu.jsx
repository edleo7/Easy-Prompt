import React, { useState, useEffect } from 'react';
import { Modal, Menu, Button, Avatar, Divider } from '@arco-design/web-react';
import { 
  IconUser, 
  IconSettings,
  IconHistory,
  IconSubscribe,
  IconQuestionCircle,
  IconClose,
  IconPoweroff
} from '@arco-design/web-react/icon';
import pureLogo from '../assets/images/品牌/纯logo.png';
import Settings from './Layout/Settings.jsx';
import UsageDetails from './Layout/UsageDetails.jsx';

// 全局样式注入
const injectGlobalStyles = () => {
  const styleId = 'user-menu-modal-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* 移除 Modal 的白色边框和默认样式 */
    div.user-menu-modal-wrapper .arco-modal,
    .user-menu-modal-wrapper .arco-modal {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
    }
    div.user-menu-modal-wrapper .arco-modal-content,
    .user-menu-modal-wrapper .arco-modal-content {
      border-radius: 12px !important;
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
    }
    div.user-menu-modal-wrapper .arco-modal-body,
    .user-menu-modal-wrapper .arco-modal-body {
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
    }
    div.user-menu-modal-wrapper .arco-modal-wrapper,
    .user-menu-modal-wrapper .arco-modal-wrapper {
      padding: 0 !important;
      margin: 0 !important;
    }
    .user-menu-modal-wrapper .arco-modal-mask {
      background-color: rgba(0, 0, 0, 0.45) !important;
    }

    /* 美化滚动条 */
    .user-menu-scrollable::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .user-menu-scrollable::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    .user-menu-scrollable::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      transition: background 0.2s;
    }
    .user-menu-scrollable::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    /* 响应式设计 */
    @media screen and (max-width: 1024px) {
      .user-menu-modal-wrapper .arco-modal {
        width: 70vw !important;
      }
    }
    @media screen and (max-width: 768px) {
      .user-menu-modal-wrapper .arco-modal {
        width: 90vw !important;
        height: 80vh !important;
      }
      .user-menu-sidebar {
        width: 200px !important;
      }
      .user-menu-content {
        padding: 24px 20px !important;
      }
    }
    @media screen and (max-width: 480px) {
      .user-menu-modal-wrapper .arco-modal {
        width: 95vw !important;
        height: 90vh !important;
      }
      .user-menu-sidebar {
        width: 160px !important;
      }
      .user-menu-content {
        padding: 20px 16px !important;
      }
    }
  `;
  document.head.appendChild(style);
};

export default function UserMenu({ visible, onClose, userInfo, onLogout }) {
  const [selectedMenu, setSelectedMenu] = useState('account');
  const [theme, setTheme] = useState('system');

  // 注入全局样式 - 每次打开模态框时重新注入
  useEffect(() => {
    if (visible) {
      // 移除旧样式
      const oldStyle = document.getElementById('user-menu-modal-styles');
      if (oldStyle) {
        oldStyle.remove();
      }
      // 重新注入
      injectGlobalStyles();
    }
  }, [visible]);

  // 获取当前主题
  const getCurrentTheme = () => {
    if (theme === 'system') {
      // 检测系统主题
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  const currentTheme = getCurrentTheme();
  const isDark = currentTheme === 'dark';

  // 主题颜色配置
  const themeColors = {
    light: {
      sidebar: '#fafafa',
      sidebarText: '#1d2129',
      sidebarHover: '#e8e9eb',
      content: '#fff',
      contentText: '#1d2129',
      border: '#e5e6eb',
      menuSelected: '#e6f4ff',
      menuSelectedText: '#165dff',
      inputBg: '#f7f8fa',
      closeButtonBg: '#f2f3f5',
      closeButtonHover: '#e5e6eb',
    },
    dark: {
      sidebar: '#1f1f1f',
      sidebarText: '#a9b7c6',
      sidebarHover: '#3c3f41',
      content: '#2a2a2a',
      contentText: '#e0e0e0',
      border: '#404040',
      menuSelected: '#2c5bb3',
      menuSelectedText: '#fff',
      inputBg: '#1a1a1a',
      closeButtonBg: '#3c3f41',
      closeButtonHover: '#505355',
    }
  };

  const colors = themeColors[isDark ? 'dark' : 'light'];

  // 获取菜单项样式
  const getMenuItemStyle = (key) => ({
    color: selectedMenu === key ? colors.menuSelectedText : colors.sidebarText,
    background: selectedMenu === key ? colors.menuSelected : 'transparent',
    margin: '2px 8px',
    borderRadius: 8
  });

  // 渲染右侧内容
  const renderContent = () => {
    switch (selectedMenu) {
      case 'account':
        return (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: colors.contentText }}>
              账号
            </h2>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar size={64} style={{ backgroundColor: '#165dff' }}>
                  <img 
                    src={pureLogo} 
                    alt="User" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </Avatar>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500, color: colors.contentText, marginBottom: 4 }}>
                  {userInfo?.username || userInfo?.name || '用户名'}
                </div>
                <div style={{ fontSize: 14, color: '#86909c' }}>
                  {userInfo?.email || 'user@example.com'}
                </div>
              </div>
              </div>
              
              <Divider style={{ margin: '24px 0' }} />
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#4e5969', marginBottom: 8 }}>用户名</div>
                <div style={{ fontSize: 14, color: colors.contentText, padding: '8px 12px', background: colors.inputBg, borderRadius: 8 }}>
                  {userInfo?.username || userInfo?.name || '用户名'}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#4e5969', marginBottom: 8 }}>邮箱</div>
                <div style={{ fontSize: 14, color: colors.contentText, padding: '8px 12px', background: colors.inputBg, borderRadius: 8 }}>
                  {userInfo?.email || 'user@example.com'}
                </div>
              </div>
              
              <Button type="primary" style={{ marginTop: 16 }}>
                编辑个人资料
              </Button>
            </div>
          </div>
        );
        
      case 'settings':
        return (
          <Settings 
            theme={theme}
            onThemeChange={setTheme}
            language="zh-CN"
            onLanguageChange={(lang) => console.log('Language changed to:', lang)}
          />
        );
        
      case 'usage-details':
        return <UsageDetails />;
        
      case 'subscription':
        return (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: colors.contentText }}>
              我的订阅
            </h2>
            <div style={{ padding: 40, textAlign: 'center', color: '#86909c' }}>
              <IconSubscribe style={{ fontSize: 48, marginBottom: 16 }} />
              <div>订阅管理功能开发中...</div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      footer={null}
      wrapClassName="user-menu-modal-wrapper"
      style={{ 
        width: '60vw',
        height: '60vh',
        maxWidth: 1200,
        maxHeight: '90vh'
      }}
      bodyStyle={{ 
        padding: 0, 
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
      closable={false}
    >
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '60vh',
        overflow: 'hidden',
        boxSizing: 'border-box',
        borderRadius: 12,
        backgroundColor: colors.content
      }}>
        {/* 左侧导航栏 */}
        <div className="user-menu-sidebar" style={{ 
          width: 240, 
          background: colors.sidebar, 
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: `1px solid ${colors.border}`,
          height: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box',
          flexShrink: 0,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12
        }}>
          {/* Logo */}
        <div style={{ 
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0
          }}>
            <img 
              src={pureLogo} 
              alt="Manus" 
              style={{ width: 24, height: 24 }} 
            />
            <span style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              color: colors.sidebarText,
              fontFamily: 'Georgia, serif'
            }}>
              EasyPrompt
            </span>
      </div>
      
          {/* 菜单项 */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
      <Menu
              mode="vertical"
              selectedKeys={[selectedMenu]}
              onClickMenuItem={(key) => setSelectedMenu(key)}
        style={{
                background: 'transparent',
          border: 'none',
                color: colors.sidebarText
        }}
      >
              <Menu.Item key="account" style={getMenuItemStyle('account')}>
                <IconUser style={{ marginRight: 8 }} />
                账号
              </Menu.Item>
              
              <Menu.Item key="settings" style={getMenuItemStyle('settings')}>
                <IconSettings style={{ marginRight: 8 }} />
                设置
              </Menu.Item>
              
              <Menu.Item key="usage-details" style={getMenuItemStyle('usage-details')}>
                <IconHistory style={{ marginRight: 8 }} />
                使用明细
              </Menu.Item>
              
              <Menu.Item key="subscription" style={getMenuItemStyle('subscription')}>
                <IconSubscribe style={{ marginRight: 8 }} />
                我的订阅
              </Menu.Item>
      </Menu>
    </div>
          
          {/* 弹性空间 - 将底部菜单推到底部 */}
          {/* <div style={{ flex: 1 }}></div> */}
          
          {/* 底部菜单 */}
          <div style={{ 
            padding: '12px 8px', 
            borderTop: `1px solid ${colors.border}`,
            flexShrink: 0 
          }}>
            <div 
              onClick={() => {
                // 打开帮助文档
                window.open('https://docs.example.com', '_blank');
              }}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                color: colors.sidebarText,
                cursor: 'pointer',
                borderRadius: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.sidebarHover;
                e.currentTarget.style.color = colors.menuSelectedText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.sidebarText;
              }}
            >
              <IconQuestionCircle style={{ marginRight: 8 }} />
              获取帮助
            </div>
            
            <div 
              onClick={onLogout}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                color: colors.sidebarText,
                cursor: 'pointer',
                borderRadius: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.sidebarHover;
                e.currentTarget.style.color = colors.menuSelectedText;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.sidebarText;
              }}
            >
              <IconPoweroff style={{ marginRight: 8 }} />
              退出登录
            </div>
          </div>
        </div>
        
        {/* 右侧内容区域 */}
        <div style={{ 
          flex: 1, 
          background: colors.content, 
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          minWidth: 0,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12
        }}>
          {/* 关闭按钮 */}
          <div 
            onClick={onClose}
            style={{ 
              position: 'absolute',
              top: 20,
              right: 20,
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 0.2s',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.closeButtonHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <IconClose style={{ fontSize: 16, color: '#86909c' }} />
          </div>
          
          {/* 内容区域 */}
          <div className="user-menu-content user-menu-scrollable" style={{ 
            padding: '40px 48px',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            boxSizing: 'border-box'
          }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
