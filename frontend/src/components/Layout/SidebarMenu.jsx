import React from 'react'
import { Menu } from '@arco-design/web-react'
import {
  IconFolder,
  IconThunderbolt,
  IconSettings,
  IconFile,
  IconMessage,
  IconBook
} from '@arco-design/web-react/icon'

export default function SidebarMenu({ currentPage, onPageChange }) {
  return (
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
        onClick={() => onPageChange('project-management')}
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
          onClick={() => onPageChange('prompt-generate')}
        >
          <IconThunderbolt style={{ marginRight: 8 }} />
          Prompt 生成
        </Menu.Item>
        <Menu.Item 
          key="variable-management" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('variable-management')}
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
            onClick={() => onPageChange('text-understanding')}
          >
            <IconFile style={{ marginRight: 8 }} />
            文本理解
          </Menu.Item>
          <Menu.Item 
            key="multi-turn-dialogue" 
            style={{ margin: '2px 8px', borderRadius: 4 }}
            onClick={() => onPageChange('multi-turn-dialogue')}
          >
            <IconMessage style={{ marginRight: 8 }} />
            多轮对话
          </Menu.Item>
        </Menu.SubMenu>
      </Menu.SubMenu>
        
      <Menu.Item 
        key="memory-management" 
        style={{ margin: '4px 8px', borderRadius: 6 }}
        onClick={() => onPageChange('memory-management')}
      >
        <IconBook style={{ marginRight: 8 }} />
        记忆管理
      </Menu.Item>
        
      <Menu.Item 
        key="knowledge-base" 
        style={{ margin: '4px 8px', borderRadius: 6 }}
        onClick={() => onPageChange('knowledge-base')}
      >
        <IconFile style={{ marginRight: 8 }} />
        知识库管理
      </Menu.Item>
    </Menu>
  )
}

