import React from 'react'
import ReactDOM from 'react-dom/client'

function Diagnostic() {
  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
      padding: 24
    }}>
      <h1>诊断入口已渲染</h1>
      <p>如果你能看到这段文字，说明 Vite 与 React 挂载链路正常。</p>
    </div>
  )
}

const rootEl = document.getElementById('root') || (() => {
  const el = document.createElement('div')
  el.id = 'root'
  document.body.appendChild(el)
  return el
})()

ReactDOM.createRoot(rootEl).render(<Diagnostic />)


