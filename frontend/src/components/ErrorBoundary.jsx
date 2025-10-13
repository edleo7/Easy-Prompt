import React from 'react'
import { Result, Button } from '@arco-design/web-react'
import { IconFaceSmileFill } from '@arco-design/web-react/icon'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('渲染错误:', error, errorInfo)
    this.setState({ errorInfo })
    
    // 可选：上报错误到监控服务（如Sentry）
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 使用Arco Design的Result组件展示友好的错误页面
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f7f8fa',
          padding: '24px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '48px 32px',
            maxWidth: 600,
            width: '100%',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <Result
              status="error"
              title="页面出错了"
              subTitle="抱歉，页面渲染时出现了错误。您可以尝试刷新页面或联系技术支持。"
              extra={[
                <Button 
                  key="refresh" 
                  type="primary" 
                  onClick={this.handleReset}
                >
                  刷新页面
                </Button>,
                <Button 
                  key="back" 
                  onClick={() => window.history.back()}
                >
                  返回上一页
                </Button>
              ]}
            />
            
            {/* 开发环境下显示详细错误信息 */}
            {import.meta.env.DEV && this.state.error && (
              <details style={{ 
                marginTop: 24, 
                padding: 16, 
                background: '#f5f5f5', 
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  marginBottom: 12, 
                  fontWeight: 500,
                  color: '#f53f3f'
                }}>
                  查看错误详情（仅开发环境可见）
                </summary>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  color: '#4e5969',
                  marginBottom: 12
                }}>
                  <strong>错误信息:</strong>
                  <br />
                  {String(this.state.error)}
                </div>
                {this.state.errorInfo && (
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    color: '#4e5969'
                  }}>
                    <strong>错误堆栈:</strong>
                    <br />
                    {this.state.errorInfo.componentStack}
                  </div>
                )}
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

