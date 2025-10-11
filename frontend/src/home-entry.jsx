import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ArcoProvider from './config/arcoConfig'
import '@arco-design/web-react/dist/css/arco.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('渲染错误:', error, errorInfo)
    this.setState({ errorInfo })
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace' }}>
          <h2>页面渲染出错</h2>
          <h3>错误信息:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10 }}>
            {String(this.state.error)}
          </pre>
          <h3>错误堆栈:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button onClick={() => window.location.reload()}>
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// 主应用组件
function App() {
  // 检查是否在登录页面
  const isLoginPage = window.location.pathname === '/login' || 
                     window.location.hash === '#/login' ||
                     window.location.pathname === '/login.html'
  
  // 检查用户是否已登录
  const isLoggedIn = localStorage.getItem('token') && localStorage.getItem('user')
  
  // 如果未登录且不在登录页面，跳转到登录页面
  if (!isLoggedIn && !isLoginPage) {
    window.location.hash = '#/login'
  }
  
  // 如果已登录且在登录页面，跳转到主页
  if (isLoggedIn && isLoginPage) {
    window.location.hash = '#/'
  }
  
  // 嵌入式布局：始终显示主应用背景，登录时叠加对话框
  return (
    <>
      <Home />
      {isLoginPage && !isLoggedIn && <LoginPage />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ArcoProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ArcoProvider>
)


