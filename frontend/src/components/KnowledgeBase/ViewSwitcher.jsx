/**
 * 视图切换器组件
 * 支持列表视图、卡片视图、表格视图切换
 */

import React from 'react'
import { Button, Space, Tooltip } from '@arco-design/web-react'
import { IconList, IconApps, IconOrderedList } from '@arco-design/web-react/icon'

const ViewSwitcher = ({ currentView, onViewChange, className = '' }) => {
  const views = [
    {
      key: 'list',
      icon: <IconList />,
      tooltip: '列表视图',
      label: '列表'
    },
    {
      key: 'card',
      icon: <IconApps />,
      tooltip: '卡片视图',
      label: '卡片'
    },
    {
      key: 'table',
      icon: <IconOrderedList />,
      tooltip: '表格视图',
      label: '表格'
    }
  ]

  return (
    <div className={`view-switcher ${className}`}>
      <Space>
        {views.map(view => (
          <Tooltip key={view.key} content={view.tooltip}>
            <Button
              type={currentView === view.key ? 'primary' : 'outline'}
              icon={view.icon}
              onClick={() => onViewChange(view.key)}
              size="small"
            >
              {view.label}
            </Button>
          </Tooltip>
        ))}
      </Space>
    </div>
  )
}

export default ViewSwitcher
