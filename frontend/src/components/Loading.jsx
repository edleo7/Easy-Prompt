import React from 'react'
import { Spin } from '@arco-design/web-react'

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '400px',
      width: '100%'
    }}>
      <Spin size={40} />
    </div>
  )
}

