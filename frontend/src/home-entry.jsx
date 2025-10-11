import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/Home.jsx'
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
  return <Home />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ArcoProvider>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </ArcoProvider>
)