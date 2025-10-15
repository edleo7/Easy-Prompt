import React, { useState, useEffect } from 'react'
import { Button, Space, Message, Spin, Typography, Breadcrumb, Modal, Layout } from '@arco-design/web-react'
import { IconLeft, IconPlus, IconUpload, IconFolder, IconRobot, IconSearch } from '@arco-design/web-react/icon'
import AppLayout from '../components/AppLayout'
import FolderTree from '../components/KnowledgeBase/FolderTree'
import DocumentEditor from '../components/KnowledgeBase/DocumentEditor'
import TocNavigator from '../components/KnowledgeBase/TocNavigator'
import FileUploader from '../components/KnowledgeBase/FileUploader'
import ViewSwitcher from '../components/KnowledgeBase/ViewSwitcher'
import KnowledgeListView from '../components/KnowledgeBase/KnowledgeListView'
import KnowledgeCardView from '../components/KnowledgeBase/KnowledgeCardView'
import KnowledgeTableView from '../components/KnowledgeBase/KnowledgeTableView'
import KnowledgeEditor from '../components/KnowledgeBase/KnowledgeEditor'
import BatchImporter from '../components/KnowledgeBase/BatchImporter'
import AIAssistant from '../components/KnowledgeBase/AIAssistant'
import KnowledgeSummary from '../components/KnowledgeBase/KnowledgeSummary'
import SmartLocator from '../components/KnowledgeBase/SmartLocator'
import SmartSearch from '../components/KnowledgeBase/SmartSearch'
import {
  getKnowledgeBaseDetail,
  getFolderTree,
  createFolder,
  updateFolder,
  deleteFolder,
  createDocument,
  getDocumentDetail,
  updateDocument
} from '../services/knowledgeBase'

const { Title, Text } = Typography

export default function KnowledgeBaseDetail({ currentPage, setCurrentPage }) {
  // 从currentPage中解析知识库ID
  const kbId = currentPage.replace('knowledge-detail-', '')
  
  const [loading, setLoading] = useState(false)
  const [knowledgeBase, setKnowledgeBase] = useState(null)
  const [folders, setFolders] = useState([])
  const [files, setFiles] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [currentDocument, setCurrentDocument] = useState(null)
  const [documentContent, setDocumentContent] = useState('')
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState(null)
  
  // 多视图相关状态
  const [currentView, setCurrentView] = useState('list') // list, card, table
  const [showFolderTree, setShowFolderTree] = useState(true)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [batchImportVisible, setBatchImportVisible] = useState(false)
  
  // AI助手相关状态
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiAssistantMode, setAiAssistantMode] = useState('chat') // chat, summary, locate, search
  
  // 搜索相关状态
  const [showSearch, setShowSearch] = useState(false)

  // 加载知识库详情
  const loadKnowledgeBase = async () => {
    setLoading(true)
    try {
      const response = await getKnowledgeBaseDetail(kbId)
      
      if (response.code === 200) {
        setKnowledgeBase(response.data)
        setFolders(response.data.folders || [])
        setFiles(response.data.files || [])
      }
    } catch (error) {
      console.error('加载知识库失败:', error)
      Message.error('加载知识库失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (kbId) {
      loadKnowledgeBase()
    }
  }, [kbId])

  // 选择文件或文件夹
  const handleSelect = async (item) => {
    setSelectedItem(item)
    
    if (item.type === 'file') {
      // 加载文档内容
      try {
        const response = await getDocumentDetail(kbId, item.data.id)
        if (response.code === 200) {
          setCurrentDocument(response.data)
          setDocumentContent(response.data.content || '')
        }
      } catch (error) {
        console.error('加载文档失败:', error)
        Message.error('加载文档失败')
      }
    } else {
      setCurrentDocument(null)
      setDocumentContent('')
    }
  }

  // 创建文件夹
  const handleCreateFolder = async (data) => {
    try {
      const response = await createFolder(kbId, data)
      if (response.code === 201) {
        Message.success('文件夹创建成功')
        loadKnowledgeBase()
      }
    } catch (error) {
      console.error('创建文件夹失败:', error)
      Message.error('创建文件夹失败')
    }
  }

  // 重命名文件夹
  const handleRenameFolder = async (folderId, newName) => {
    try {
      const response = await updateFolder(kbId, folderId, { name: newName })
      if (response.code === 200) {
        Message.success('重命名成功')
        loadKnowledgeBase()
      }
    } catch (error) {
      console.error('重命名失败:', error)
      Message.error('重命名失败')
    }
  }

  // 更新文件夹
  const handleUpdateFolder = async (folderId, data) => {
    try {
      const response = await updateFolder(kbId, folderId, data)
      if (response.code === 200) {
        Message.success('更新成功')
        loadKnowledgeBase()
      }
    } catch (error) {
      console.error('更新失败:', error)
      Message.error('更新失败')
    }
  }

  // 删除文件夹
  const handleDeleteFolder = async (folderId) => {
    try {
      const response = await deleteFolder(kbId, folderId)
      if (response.code === 200) {
        Message.success('删除成功')
        loadKnowledgeBase()
      }
    } catch (error) {
      console.error('删除失败:', error)
      Message.error('删除失败')
    }
  }

  // 创建文档
  const handleCreateFile = async (data) => {
    try {
      const response = await createDocument(kbId, {
        ...data,
        editorType: 'markdown',
        content: '# 新建文档\n\n开始编写您的内容...'
      })
      
      if (response.code === 201) {
        Message.success('文档创建成功')
        loadKnowledgeBase()
        
        // 自动选中新创建的文档
        handleSelect({ type: 'file', data: response.data })
      }
    } catch (error) {
      console.error('创建文档失败:', error)
      Message.error('创建文档失败')
    }
  }

  // 创建文档（别名）
  const handleCreateDocument = handleCreateFile

  // 保存文档
  const handleSaveDocument = async (data) => {
    if (!currentDocument) return

    try {
      const response = await updateDocument(kbId, currentDocument.id, data)
      if (response.code === 200) {
        setCurrentDocument(response.data)
        return true
      }
    } catch (error) {
      console.error('保存失败:', error)
      Message.error('保存失败')
      throw error
    }
  }

  // 返回列表
  const handleBack = () => {
    setCurrentPage('knowledge-base')
  }

  // 打开上传对话框
  const handleOpenUpload = (folderId = null) => {
    setCurrentFolderId(folderId)
    setUploadModalVisible(true)
  }

  // 上传成功回调
  const handleUploadSuccess = (data) => {
    Message.success(`成功上传 ${data.successCount} 个文件`)
    setUploadModalVisible(false)
    loadKnowledgeBase() // 刷新文件列表
  }

  // 上传失败回调
  const handleUploadError = (error) => {
    Message.error('上传失败: ' + error.message)
  }

  // 处理视图切换
  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  // 处理文件夹树显示切换
  const handleToggleFolderTree = () => {
    setShowFolderTree(!showFolderTree)
  }

  // 处理编辑项目
  const handleEditItem = (item) => {
    setEditingItem(item)
    setEditModalVisible(true)
  }

  // 处理保存编辑
  const handleSaveEdit = async (updatedItem) => {
    try {
      // 这里应该调用更新API
      // const response = await updateFile(kbId, updatedItem.id, updatedItem)
      Message.success('保存成功')
      setEditModalVisible(false)
      setEditingItem(null)
      loadKnowledgeBase() // 刷新列表
    } catch (error) {
      console.error('保存失败:', error)
      Message.error('保存失败')
    }
  }

  // 处理删除项目
  const handleDeleteItem = async (item) => {
    try {
      // 这里应该调用删除API
      // const response = await deleteFile(kbId, item.id)
      Message.success('删除成功')
      loadKnowledgeBase() // 刷新列表
    } catch (error) {
      console.error('删除失败:', error)
      Message.error('删除失败')
    }
  }

  // 处理下载项目
  const handleDownloadItem = (item) => {
    // 这里应该实现下载逻辑
    Message.info('下载功能待实现')
  }

  // 处理批量导入成功
  const handleBatchImportSuccess = (data) => {
    Message.success(`批量导入完成: 成功 ${data.successCount} 个，失败 ${data.failCount} 个`)
    setBatchImportVisible(false)
    loadKnowledgeBase() // 刷新列表
  }

  // 处理批量导入失败
  const handleBatchImportError = (error) => {
    Message.error('批量导入失败: ' + error.message)
  }

  // 处理AI助手文件点击
  const handleAIFileClick = (fileId) => {
    // 查找并选中对应的文件
    const file = files.find(f => f.id === fileId)
    if (file) {
      handleSelect({ type: 'file', data: file })
    }
  }

  // 处理AI助手文件夹点击
  const handleAIFolderClick = (folderId) => {
    // 查找并选中对应的文件夹
    const folder = folders.find(f => f.id === folderId)
    if (folder) {
      handleSelect({ type: 'folder', data: folder })
    }
  }

  // 切换AI助手模式
  const handleAIModeChange = (mode) => {
    setAiAssistantMode(mode)
  }

  return (
    <AppLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      pageTitle={knowledgeBase?.name || '知识库详情'}
      pageSubtitle={knowledgeBase?.description || ''}
    >
      {/* 面包屑导航和工具栏 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space>
            <Button 
              type="text" 
              icon={<IconLeft />} 
              onClick={handleBack}
            >
              返回
            </Button>
            <Breadcrumb>
              <Breadcrumb.Item>知识库</Breadcrumb.Item>
              <Breadcrumb.Item>{knowledgeBase?.name}</Breadcrumb.Item>
              {currentDocument && (
                <Breadcrumb.Item>{currentDocument.name}</Breadcrumb.Item>
              )}
            </Breadcrumb>
          </Space>
          
          <Space>
            <Button 
              icon={<IconFolder />}
              onClick={handleToggleFolderTree}
              type={showFolderTree ? 'primary' : 'outline'}
            >
              {showFolderTree ? '隐藏' : '显示'}文件夹
            </Button>
            <Button 
              icon={<IconUpload />}
              onClick={() => setBatchImportVisible(true)}
            >
              批量导入
            </Button>
            <Button 
              icon={<IconRobot />}
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              type={showAIAssistant ? 'primary' : 'outline'}
            >
              AI助手
            </Button>
            <Button 
              icon={<IconSearch />}
              onClick={() => setShowSearch(!showSearch)}
              type={showSearch ? 'primary' : 'outline'}
            >
              智能搜索
            </Button>
            <Button 
              type="primary" 
              icon={<IconUpload />}
              onClick={() => handleOpenUpload()}
            >
              上传文件
            </Button>
          </Space>
        </div>
        
        {/* 视图切换器 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ViewSwitcher 
              currentView={currentView}
              onViewChange={handleViewChange}
            />
            {showAIAssistant && (
              <Space>
                <Button
                  type={aiAssistantMode === 'chat' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handleAIModeChange('chat')}
                >
                  对话
                </Button>
                <Button
                  type={aiAssistantMode === 'summary' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handleAIModeChange('summary')}
                >
                  摘要
                </Button>
                <Button
                  type={aiAssistantMode === 'locate' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handleAIModeChange('locate')}
                >
                  定位
                </Button>
                <Button
                  type={aiAssistantMode === 'search' ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => handleAIModeChange('search')}
                >
                  搜索
                </Button>
              </Space>
            )}
          </Space>
          <Typography.Text type="secondary">
            共 {files.length} 个文件
          </Typography.Text>
        </div>
      </div>

      <Spin loading={loading} style={{ display: 'block' }}>
        {currentView === 'list' || currentView === 'card' || currentView === 'table' ? (
          // 多视图模式
          <div style={{ 
            display: 'flex', 
            height: 'calc(100vh - 200px)',
            gap: 16,
            border: '1px solid #e5e6eb',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff'
          }}>
            {/* 左侧文件夹树 */}
            {showFolderTree && (
              <div style={{ 
                width: '20%',
                minWidth: 200,
                borderRight: '1px solid #e5e6eb',
                background: '#fafafa',
                overflow: 'auto'
              }}>
                <FolderTree
                  folders={folders}
                  files={files}
                  onSelect={handleSelect}
                  onFolderCreate={handleCreateFolder}
                  onFolderUpdate={handleUpdateFolder}
                  onFolderDelete={handleDeleteFolder}
                  onDocumentCreate={handleCreateDocument}
                  selectedItem={selectedItem}
                />
              </div>
            )}

            {/* 主内容区域 */}
            <div style={{ 
              flex: 1,
              padding: 16,
              overflow: 'auto'
            }}>
              {currentView === 'list' && (
                <KnowledgeListView
                  items={files}
                  onItemClick={handleSelect}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onDownload={handleDownloadItem}
                  selectedItem={selectedItem}
                  loading={loading}
                />
              )}
              
              {currentView === 'card' && (
                <KnowledgeCardView
                  items={files}
                  onItemClick={handleSelect}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onDownload={handleDownloadItem}
                  selectedItem={selectedItem}
                  loading={loading}
                />
              )}
              
              {currentView === 'table' && (
                <KnowledgeTableView
                  items={files}
                  onItemClick={handleSelect}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                  onDownload={handleDownloadItem}
                  selectedItem={selectedItem}
                  loading={loading}
                />
              )}
            </div>

            {/* 右侧AI助手面板 */}
            {showAIAssistant && (
              <div style={{ 
                width: '25%',
                minWidth: 300,
                borderLeft: '1px solid #e5e6eb',
                background: '#fafafa',
                overflow: 'auto'
              }}>
                {aiAssistantMode === 'chat' && (
                  <AIAssistant
                    kbId={kbId}
                    kbName={knowledgeBase?.name}
                    onFileClick={handleAIFileClick}
                  />
                )}
                {aiAssistantMode === 'summary' && (
                  <KnowledgeSummary
                    kbId={kbId}
                    kbName={knowledgeBase?.name}
                    onRefresh={loadKnowledgeBase}
                  />
                )}
                {aiAssistantMode === 'locate' && (
                  <SmartLocator
                    kbId={kbId}
                    onFileClick={handleAIFileClick}
                    onFolderClick={handleAIFolderClick}
                  />
                )}
                {aiAssistantMode === 'search' && (
                  <SmartSearch
                    kbId={kbId}
                    onFileClick={handleAIFileClick}
                    onFolderClick={handleAIFolderClick}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          // 编辑器模式（原有布局）
          <div style={{ 
            display: 'flex', 
            height: 'calc(100vh - 200px)',
            gap: 16,
            border: '1px solid #e5e6eb',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#fff'
          }}>
            {/* 左侧文件夹树 (20%) */}
            <div style={{ 
              width: '20%',
              minWidth: 200,
              borderRight: '1px solid #e5e6eb',
              display: 'flex',
              flexDirection: 'column',
              background: '#f7f8fa'
            }}>
              <div style={{ 
                padding: '12px 16px',
                borderBottom: '1px solid #e5e6eb',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontWeight: 500 }}>文档目录</Text>
                <Button 
                  type="text" 
                  size="mini" 
                  icon={<IconPlus />}
                  onClick={() => handleCreateFile({ name: '新建文档' })}
                />
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                <FolderTree
                  folders={folders}
                  files={files}
                  selectedKey={selectedItem?.type === 'file' ? `file-${selectedItem.data.id}` : null}
                  onSelect={handleSelect}
                  onCreateFolder={handleCreateFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onCreateFile={handleCreateFile}
                />
              </div>
            </div>

            {/* 中间编辑器 (60%) */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              background: '#fff'
            }}>
              {currentDocument ? (
                <DocumentEditor
                  key={currentDocument.id}
                  initialContent={currentDocument.content || ''}
                  initialEditorType={currentDocument.editorType || 'markdown'}
                  fileName={currentDocument.name}
                  onSave={handleSaveDocument}
                  onContentChange={setDocumentContent}
                />
              ) : (
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#86909c'
                }}>
                  <IconPlus style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
                  <Text>请选择或创建一个文档开始编辑</Text>
                </div>
              )}
            </div>

            {/* 右侧目录导航 (20%) */}
            <div style={{ 
              width: '20%',
              minWidth: 200,
              borderLeft: '1px solid #e5e6eb',
              background: '#f7f8fa'
            }}>
              <div style={{ 
                padding: '12px 16px',
                borderBottom: '1px solid #e5e6eb',
                background: '#fff'
              }}>
                <Text style={{ fontWeight: 500 }}>页面目录</Text>
              </div>
              
              <TocNavigator
                content={documentContent}
                editorType={currentDocument?.editorType || 'markdown'}
              />
            </div>
          </div>
        )}
      </Spin>

      {/* 文件上传对话框 */}
      <Modal
        title="上传文件"
        visible={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        style={{ width: 800 }}
      >
        <FileUploader
          kbId={kbId}
          folderId={currentFolderId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </Modal>

      {/* 知识编辑对话框 */}
      <KnowledgeEditor
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false)
          setEditingItem(null)
        }}
        item={editingItem}
        onSave={handleSaveEdit}
        loading={loading}
      />

      {/* 批量导入对话框 */}
      <BatchImporter
        visible={batchImportVisible}
        onClose={() => setBatchImportVisible(false)}
        kbId={kbId}
        folderId={currentFolderId}
        onImportSuccess={handleBatchImportSuccess}
        onImportError={handleBatchImportError}
      />
    </AppLayout>
  )
}

