import React from 'react'
import { Checkbox, Link } from '@arco-design/web-react'

export default function PolicyAgreement({ checked, onChange }) {
  return (
    <div style={{ 
      textAlign: 'center',
      marginTop: 16,
      fontSize: 14
    }}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        style={{ 
          marginRight: 8,
          verticalAlign: 'middle'
        }}
      />
      <span style={{ verticalAlign: 'middle' }}>
        登录即表示同意
      </span>
      <Link 
        style={{ 
          color: '#165dff',
          verticalAlign: 'middle'
        }}
      >
        《用户协议》
      </Link>
      <span style={{ 
        verticalAlign: 'middle',
        margin: '0 4px'
      }}>
        和
      </span>
      <Link 
        style={{ 
          color: '#165dff',
          verticalAlign: 'middle'
        }}
      >
        《隐私政策》
      </Link>
    </div>
  )
}

