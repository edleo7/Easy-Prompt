import React from 'react'
import { Pagination as ArcoPagination, Select, Space, Typography } from '@arco-design/web-react'

const { Text } = Typography

export default function Pagination({
  current = 1,
  total = 0,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal = true,
  onChange,
  onPageSizeChange,
  simple = false,
  ...props
}) {
  const totalPages = Math.ceil(total / pageSize)

  const handleChange = (page, size) => {
    if (onChange) {
      onChange(page, size || pageSize)
    }
  }

  const handlePageSizeChange = (current, size) => {
    if (onPageSizeChange) {
      onPageSizeChange(current, size)
    }
  }

  const renderTotal = () => {
    if (!showTotal) return null
    
    const start = (current - 1) * pageSize + 1
    const end = Math.min(current * pageSize, total)
    
    return (
      <Text type="secondary" style={{ marginRight: 16 }}>
        共 {total} 条记录，显示第 {start}-{end} 条
      </Text>
    )
  }

  const renderPageSizeChanger = () => {
    if (!showSizeChanger) return null
    
    return (
      <Space>
        <Text type="secondary">每页显示</Text>
        <Select
          value={pageSize}
          onChange={(value) => handlePageSizeChange(1, value)}
          style={{ width: 80 }}
          size="small"
        >
          {pageSizeOptions.map(size => (
            <Select.Option key={size} value={size}>
              {size}
            </Select.Option>
          ))}
        </Select>
        <Text type="secondary">条</Text>
      </Space>
    )
  }

  if (simple) {
    return (
      <ArcoPagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={handleChange}
        simple
        {...props}
      />
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginTop: 16,
      padding: '16px 0'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {renderTotal()}
        {renderPageSizeChanger()}
      </div>
      
      <ArcoPagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={handleChange}
        showQuickJumper={showQuickJumper}
        {...props}
      />
    </div>
  )
}
