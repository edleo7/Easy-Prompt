import React, { useState } from 'react'
import { Tree, Dropdown, Menu, Modal, Input, Message } from '@arco-design/web-react'
import { IconFolder, IconFile, IconFolderAdd, IconEdit, IconDelete, IconPlus } from '@arco-design/web-react/icon'

const TreeNode = Tree.Node

export default function FolderTree({ 
  folders = [], 
  files = [], 
  selectedKey,
  onSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFile
}) {
  const [contextMenuVisible, setContextMenuVisible] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [contextMenuData, setContextMenuData] = useState(null)
  const [renameModalVisible, setRenameModalVisible] = useState(false)
  const [newName, setNewName] = useState('')
  const [createFolderModalVisible, setCreateFolderModalVisible] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [createFileModalVisible, setCreateFileModalVisible] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  // 构建树形数据
  const buildTreeData = () => {
    const treeData = []

    // 添加文件夹
    const renderFolder = (folder) => ({
      key: `folder-${folder.id}`,
      title: folder.name,
      icon: <IconFolder />,
      children: [
        ...(folder.children || []).map(renderFolder),
        ...(folder.files || []).map(file => ({
          key: `file-${file.id}`,
          title: file.name,
          icon: <IconFile />,
          isLeaf: true,
          data: file
        }))
      ],
      data: folder
    })

    treeData.push(...folders.map(renderFolder))

    // 添加根目录下的文件
    treeData.push(...files.map(file => ({
      key: `file-${file.id}`,
      title: file.name,
      icon: <IconFile />,
      isLeaf: true,
      data: file
    })))

    return treeData
  }

  // 右键菜单
  const handleContextMenu = (e, node) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuData(node)
    setContextMenuVisible(true)
  }

  // 创建文件夹
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      Message.warning('文件夹名称不能为空')
      return
    }

    const parentId = contextMenuData?.key.startsWith('folder-') 
      ? contextMenuData.data.id 
      : null

    onCreateFolder?.({ name: newFolderName, parentId })
    setNewFolderName('')
    setCreateFolderModalVisible(false)
  }

  // 重命名
  const handleRename = () => {
    if (!newName.trim()) {
      Message.warning('名称不能为空')
      return
    }

    const isFolder = contextMenuData.key.startsWith('folder-')
    if (isFolder) {
      onRenameFolder?.(contextMenuData.data.id, newName)
    }
    setNewName('')
    setRenameModalVisible(false)
  }

  // 删除
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${contextMenuData.title} 吗？`,
      onOk: () => {
        const isFolder = contextMenuData.key.startsWith('folder-')
        if (isFolder) {
          onDeleteFolder?.(contextMenuData.data.id)
        }
      }
    })
  }

  // 创建文档
  const handleCreateFile = () => {
    if (!newFileName.trim()) {
      Message.warning('文档名称不能为空')
      return
    }

    const folderId = contextMenuData?.key.startsWith('folder-')
      ? contextMenuData.data.id
      : null

    onCreateFile?.({ name: newFileName, folderId })
    setNewFileName('')
    setCreateFileModalVisible(false)
  }

  const dropList = (
    <Menu>
      <Menu.Item 
        key="newFolder" 
        onClick={() => {
          setCreateFolderModalVisible(true)
          setContextMenuVisible(false)
        }}
      >
        <IconFolderAdd style={{ marginRight: 8 }} />
        新建文件夹
      </Menu.Item>
      <Menu.Item 
        key="newFile" 
        onClick={() => {
          setCreateFileModalVisible(true)
          setContextMenuVisible(false)
        }}
      >
        <IconPlus style={{ marginRight: 8 }} />
        新建文档
      </Menu.Item>
      {contextMenuData?.key.startsWith('folder-') && (
        <>
          <Menu.Item 
            key="rename" 
            onClick={() => {
              setNewName(contextMenuData.title)
              setRenameModalVisible(true)
              setContextMenuVisible(false)
            }}
          >
            <IconEdit style={{ marginRight: 8 }} />
            重命名
          </Menu.Item>
          <Menu.Item 
            key="delete" 
            onClick={() => {
              handleDelete()
              setContextMenuVisible(false)
            }}
          >
            <IconDelete style={{ marginRight: 8 }} />
            删除
          </Menu.Item>
        </>
      )}
    </Menu>
  )

  return (
    <>
      <Tree
        blockNode
        selectedKeys={selectedKey ? [selectedKey] : []}
        onSelect={(keys, extra) => {
          const node = extra.node
          if (node.key.startsWith('file-')) {
            onSelect?.({ type: 'file', data: node.data })
          } else {
            onSelect?.({ type: 'folder', data: node.data })
          }
        }}
        treeData={buildTreeData()}
        renderExtra={(node) => (
          <span
            onClick={(e) => {
              e.stopPropagation()
              handleContextMenu(e, node)
            }}
            style={{ 
              padding: '0 4px',
              cursor: 'pointer',
              opacity: 0
            }}
            className="tree-extra-icon"
          >
            <IconPlus />
          </span>
        )}
      />

      {/* 添加CSS让hover时显示操作图标 */}
      <style>{`
        .arco-tree-node:hover .tree-extra-icon {
          opacity: 1 !important;
        }
      `}</style>

      {/* 右键菜单 */}
      <Dropdown
        droplist={dropList}
        position="bl"
        trigger="click"
        popupVisible={contextMenuVisible}
        onVisibleChange={setContextMenuVisible}
      >
        <div 
          style={{ 
            position: 'fixed',
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
            width: 0,
            height: 0
          }} 
        />
      </Dropdown>

      {/* 创建文件夹对话框 */}
      <Modal
        title="新建文件夹"
        visible={createFolderModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => {
          setCreateFolderModalVisible(false)
          setNewFolderName('')
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文件夹名称"
          value={newFolderName}
          onChange={setNewFolderName}
          onPressEnter={handleCreateFolder}
          autoFocus
        />
      </Modal>

      {/* 重命名对话框 */}
      <Modal
        title="重命名"
        visible={renameModalVisible}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalVisible(false)
          setNewName('')
        }}
        okText="确定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入新名称"
          value={newName}
          onChange={setNewName}
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>

      {/* 创建文档对话框 */}
      <Modal
        title="新建文档"
        visible={createFileModalVisible}
        onOk={handleCreateFile}
        onCancel={() => {
          setCreateFileModalVisible(false)
          setNewFileName('')
        }}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="请输入文档名称"
          value={newFileName}
          onChange={setNewFileName}
          onPressEnter={handleCreateFile}
          autoFocus
        />
      </Modal>
    </>
  )
}

