import React, { useState, Suspense, lazy } from 'react'
import { Typography, Grid } from '@arco-design/web-react'
import AppLayout from '../components/AppLayout'
import Loading from '../components/Loading'

// 懒加载页面组件
const PromptGenerate = lazy(() => import('./PromptGenerate'))
const MemoryManagement = lazy(() => import('./MemoryManagement'))
const KnowledgeBaseManagement = lazy(() => import('./KnowledgeBaseManagement'))
const ProjectManagement = lazy(() => import('./ProjectManagement'))
const VariableManagement = lazy(() => import('./VariableManagement'))

const { Title, Text } = Typography
const { Row, Col } = Grid

export default function Home() {
  const [currentPage, setCurrentPage] = useState('project-management')

  // 页面组件映射
  const pageComponents = {
    'project-management': ProjectManagement,
    'prompt-generate': PromptGenerate,
    'variable-management': VariableManagement,
    'memory-management': MemoryManagement,
    'knowledge-base': KnowledgeBaseManagement,
    'text-understanding': null, // 待实现
    'multi-turn-dialogue': null, // 待实现
    'api-docs': null, // 待实现
    'open-platform': null, // 待实现
    'account-center': null, // 待实现
    'my-subscription': null // 待实现
  }

  const CurrentComponent = pageComponents[currentPage]

  // 如果选择了其他页面，渲染对应组件
  if (CurrentComponent) {
    return (
      <Suspense fallback={<Loading />}>
        <CurrentComponent currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </Suspense>
    )
  }

  // 如果选择了未实现的页面，显示占位内容
  if (!CurrentComponent) {
    return (
      <AppLayout 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        pageTitle="功能开发中"
        pageSubtitle="该功能正在紧张开发中，敬请期待"
      >
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg,#6aa1ff,#165dff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 48,
            color: 'white'
          }}>
            🚧
          </div>
          <Title heading={3} style={{ margin: 0, marginBottom: 12, color: '#1d2129' }}>
            功能开发中
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            该功能正在紧张开发中，敬请期待
          </Text>
        </div>
      </AppLayout>
    )
  }

  // 这个return永远不会执行，因为所有页面都有对应的组件
  return null
}


