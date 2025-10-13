import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './pages/Home.jsx'
import ArcoProvider from './config/arcoConfig'
import ErrorBoundary from './components/ErrorBoundary'
import '@arco-design/web-react/dist/css/arco.css'

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