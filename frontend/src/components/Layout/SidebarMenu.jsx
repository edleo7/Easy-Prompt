import React from 'react'
import { Menu } from '@arco-design/web-react'
import {
  IconFolder,
  IconThunderbolt,
  IconSettings,
  IconFile,
  IconMessage,
  IconBook,
  IconUserGroup
} from '@arco-design/web-react/icon'

export default function SidebarMenu({ currentPage, onPageChange }) {
  return (
    <Menu 
      // selectedKeys={['prompt-generate']} // 默认选中 Prompt生成
      style={{ 
        border: 'none', 
        background: 'transparent',
        padding: '0'
      }}
    >
      <Menu.Item 
        key="prompt-generate" 
        style={{  borderRadius: 6,overflow: 'hidden' }}
        onClick={() => onPageChange('prompt-generate')}
      >
        <IconThunderbolt style={{ marginRight: 8 }} />
        Prompt 生成
      </Menu.Item>

      <Menu.SubMenu 
        key="project-management" 
        title={(
          <span>
            <IconFolder style={{ marginRight: 8 }} />
            项目管理
          </span>
        )}
        style={{  borderRadius: 6 }}
      >
        <Menu.Item 
          key="new-project" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('new-project')}
        >
          新建项目
        </Menu.Item>
        <Menu.Item 
          key="project-a" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('project-a')}
        >
          项目A
        </Menu.Item>
        <Menu.Item 
          key="project-b" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('project-b')}
        >
          项目B
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.SubMenu 
        key="information-management" 
        title={(
          <span>
            <IconBook style={{ marginRight: 8 }} />
            信息管理
          </span>
        )}
        style={{  borderRadius: 6 }}
      >
        <Menu.Item 
          key="knowledge-base" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('knowledge-base')}
        >
          <IconFile style={{ marginRight: 8 }} />
          知识库
        </Menu.Item>
        <Menu.Item 
          key="memory-management" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('memory-management')}
        >
          <IconBook style={{ marginRight: 8 }} />
          记忆库
        </Menu.Item>
        <Menu.Item 
          key="variable-library" 
          style={{ margin: '2px 4px', borderRadius: 4 }}
          onClick={() => onPageChange('variable-library')}
        >
          <IconSettings style={{ marginRight: 8 }} />
          变量库
        </Menu.Item>
      </Menu.SubMenu>

      <Menu.Item 
        key="collaboration-space" 
        style={{  borderRadius: 6 }}
        onClick={() => onPageChange('collaboration-space')}
      >
        <IconUserGroup style={{ marginRight: 8 }} />
        协作空间
      </Menu.Item>

      <Menu.Item 
        key="conversation-management" 
        style={{  borderRadius: 6 }}
        onClick={() => onPageChange('conversation-management')}
      >
        <IconMessage style={{ marginRight: 8 }} />
        会话管理
      </Menu.Item>
    </Menu>
  )
}
