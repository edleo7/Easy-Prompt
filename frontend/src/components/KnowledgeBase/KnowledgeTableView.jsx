/**
 * 知识表格视图组件
 * 以表格形式展示文件和文件夹，支持排序和筛选
 */

import React, { useState, useMemo } from 'react'
import { Table, Tag, Button, Dropdown, Menu, Input, Select, Space, Typography } from '@arco-design/web-react'
import { IconFile, IconFolder, IconMore, IconEdit, IconDelete, IconDownload, IconEye, IconSearch } from '@arco-design/web-react/icon'
import { formatFileSize, formatDate } from '../../utils/format'

const { Text } = Typography
const { Option } = Select

const KnowledgeTableView = ({ 
  items = [], 
  onItemClick, 
  onEdit, 
  onDelete, 
  onDownload,
  selectedItem,
  loading = false 
}) => {
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortField, setSortField] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')

  // 获取文件类型标签
  const getFileTypeTag = (item) => {
    if (item.type === 'folder') {
      return <Tag color="blue">文件夹</Tag>
    }
    
    const ext = item.name.split('.').pop()?.toLowerCase()
    const typeMap = {
      pdf: { color: 'red', text: 'PDF' },
      docx: { color: 'blue', text: 'Word' },
      doc: { color: 'blue', text: 'Word' },
      pptx: { color: 'orange', text: 'PPT' },
      ppt: { color: 'orange', text: 'PPT' },
      xlsx: { color: 'green', text: 'Excel' },
      xls: { color: 'green', text: 'Excel' },
      jpg: { color: 'purple', text: '图片' },
      jpeg: { color: 'purple', text: '图片' },
      png: { color: 'purple', text: '图片' },
      gif: { color: 'purple', text: '图片' },
      mp3: { color: 'cyan', text: '音频' },
      wav: { color: 'cyan', text: '音频' },
      mp4: { color: 'magenta', text: '视频' },
      mov: { color: 'magenta', text: '视频' },
      txt: { color: 'gray', text: '文本' },
      md: { color: 'gray', text: 'Markdown' }
    }
    
    const type = typeMap[ext] || { color: 'default', text: '文件' }
    return <Tag color={type.color}>{type.text}</Tag>
  }

  // 操作菜单
  const getActionMenu = (item) => (
    <Menu>
      <Menu.Item key="view" icon={<IconEye />} onClick={() => onItemClick(item)}>
        查看
      </Menu.Item>
      <Menu.Item key="edit" icon={<IconEdit />} onClick={() => onEdit(item)}>
        编辑
      </Menu.Item>
      {item.type !== 'folder' && (
        <Menu.Item key="download" icon={<IconDownload />} onClick={() => onDownload(item)}>
          下载
        </Menu.Item>
      )}
      <Menu.Item key="delete" icon={<IconDelete />} onClick={() => onDelete(item)}>
        删除
      </Menu.Item>
    </Menu>
  )

  // 筛选和排序数据
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // 搜索筛选
      if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false
      }
      
      // 类型筛选
      if (typeFilter !== 'all') {
        if (typeFilter === 'folder' && item.type !== 'folder') {
          return false
        }
        if (typeFilter !== 'folder' && item.type === 'folder') {
          return false
        }
        if (typeFilter !== 'folder' && typeFilter !== 'all') {
          const ext = item.name.split('.').pop()?.toLowerCase()
          if (ext !== typeFilter) {
            return false
          }
        }
      }
      
      return true
    })

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (sortField === 'size') {
        aValue = aValue || 0
        bValue = bValue || 0
      } else if (sortField === 'name') {
        aValue = aValue?.toLowerCase() || ''
        bValue = bValue?.toLowerCase() || ''
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [items, searchText, typeFilter, sortField, sortOrder])

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (name, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.type === 'folder' ? (
            <IconFolder style={{ color: '#1890ff' }} />
          ) : (
            <IconFile style={{ color: '#666' }} />
          )}
          <Text 
            style={{ 
              cursor: 'pointer',
              color: selectedItem?.id === record.id ? '#1890ff' : 'inherit'
            }}
            onClick={() => onItemClick(record)}
          >
            {name}
          </Text>
        </div>
      ),
      sorter: true,
      sortOrder: sortField === 'name' ? sortOrder : null,
      onSort: () => {
        setSortField('name')
        setSortOrder(sortField === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (_, record) => getFileTypeTag(record),
      filters: [
        { text: '文件夹', value: 'folder' },
        { text: 'PDF', value: 'pdf' },
        { text: 'Word', value: 'docx' },
        { text: 'Excel', value: 'xlsx' },
        { text: 'PPT', value: 'pptx' },
        { text: '图片', value: 'jpg' },
        { text: '音频', value: 'mp3' },
        { text: '视频', value: 'mp4' }
      ],
      onFilter: (value, record) => {
        if (value === 'folder') return record.type === 'folder'
        const ext = record.name.split('.').pop()?.toLowerCase()
        return ext === value
      }
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => size ? formatFileSize(size) : '-',
      sorter: true,
      sortOrder: sortField === 'size' ? sortOrder : null,
      onSort: () => {
        setSortField('size')
        setSortOrder(sortField === 'size' && sortOrder === 'asc' ? 'desc' : 'asc')
      }
    },
    {
      title: '修改时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (date, record) => formatDate(date || record.createdAt),
      sorter: true,
      sortOrder: sortField === 'updatedAt' ? sortOrder : null,
      onSort: () => {
        setSortField('updatedAt')
        setSortOrder(sortField === 'updatedAt' && sortOrder === 'asc' ? 'desc' : 'asc')
      }
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags) => (
        <Space size={4} wrap>
          {tags && tags.slice(0, 3).map(tag => (
            <Tag key={tag} size="small" color="gray">
              {tag}
            </Tag>
          ))}
          {tags && tags.length > 3 && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              +{tags.length - 3}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown
          droplist={getActionMenu(record)}
          trigger="click"
          position="br"
        >
          <Button
            type="text"
            icon={<IconMore />}
            size="small"
          />
        </Dropdown>
      )
    }
  ]

  return (
    <div className="knowledge-table-view">
      {/* 搜索和筛选栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Input
          placeholder="搜索文件..."
          prefix={<IconSearch />}
          value={searchText}
          onChange={setSearchText}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="筛选类型"
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 120 }}
        >
          <Option value="all">全部</Option>
          <Option value="folder">文件夹</Option>
          <Option value="pdf">PDF</Option>
          <Option value="docx">Word</Option>
          <Option value="xlsx">Excel</Option>
          <Option value="pptx">PPT</Option>
          <Option value="jpg">图片</Option>
          <Option value="mp3">音频</Option>
          <Option value="mp4">视频</Option>
        </Select>
        <Text type="secondary" style={{ marginLeft: 'auto' }}>
          共 {filteredAndSortedItems.length} 项
        </Text>
      </div>

      {/* 表格 */}
      <Table
        loading={loading}
        data={filteredAndSortedItems}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showTotal: true,
          showJumper: true,
          showPageSize: true
        }}
        rowClassName={(record) => 
          selectedItem?.id === record.id ? 'selected-row' : ''
        }
        style={{
          '--color-bg-2': selectedItem ? '#f7f8fa' : 'transparent'
        }}
      />
    </div>
  )
}

export default KnowledgeTableView
