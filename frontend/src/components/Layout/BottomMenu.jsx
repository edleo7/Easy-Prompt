import React from 'react'
import { Menu } from '@arco-design/web-react'
import {
  IconLink,
  IconCloud,
  IconUser,
  IconShareAlt
} from '@arco-design/web-react/icon'

export default function BottomMenu({ currentPage, onPageChange, collapsed }) {
  if (collapsed) return null

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: 80, 
      left: 16, 
      right: 16
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
          onClick={() => onPageChange('api-docs')}
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
          onClick={() => onPageChange('open-platform')}
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
          onClick={() => onPageChange('account-center')}
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
          onClick={() => onPageChange('my-subscription')}
        >
          <IconShareAlt style={{ marginRight: 8 }} />
          我的订阅
        </Menu.Item>
      </Menu>
    </div>
  )
}

