import React from 'react'
import { Menu, Icon } from '@arco-design/web-react'
import { IconLink, IconShareAlt } from '@arco-design/web-react/icon' // 确保 IconLink 正确导入

export default function BottomMenu({ currentPage, onPageChange, collapsed }) {
  if (collapsed) return null

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: 80, 
      left: 16, 
      right: 16,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Menu
        mode="vertical"
        selectedKeys={[currentPage]}
        style={{ 
          border: 'none', 
          background: 'transparent',
          marginBottom: 16
        }}
      >
        <Menu.Item 
          key="api-key" 
          style={{ 
            margin: '2px 4px', 
            borderRadius: 4,
            height: '36px',
            lineHeight: '36px'
          }}
          onClick={() => onPageChange('api-key')}
        >
          <IconLink style={{ marginRight: 8 }} />
          API-Key
        </Menu.Item>
        
        <Menu.Item 
          key="subscription-management" 
          style={{ 
            margin: '2px 4px', 
            borderRadius: 4,
            height: '36px',
            lineHeight: '36px'
          }}
          onClick={() => onPageChange('subscription-management')}
        >
          <IconShareAlt style={{ marginRight: 8 }} />
          订阅与管理
        </Menu.Item>
      </Menu>
      
    </div>
  )
}