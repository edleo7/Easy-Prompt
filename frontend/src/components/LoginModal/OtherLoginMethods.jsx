import React from 'react'
import { Divider, Link, Message } from '@arco-design/web-react'

export default function OtherLoginMethods() {
  const handleWechatLogin = () => {
    Message.info('微信登录功能开发中...')
  };

  const handleSSOLogin = () => {
    Message.info('SSO登录功能开发中...')
  };

  const handleIAMLogin = () => {
    Message.info('IAM登录功能开发中...')
  };

  return (
    <>
      {/* 分割线 */}
      <div style={{ 
        position: 'relative',
        textAlign: 'center',
        margin: '24px 0'
      }}>
        <Divider style={{ 
          margin: 0,
          borderColor: '#e5e5e5'
        }} />
        <span style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          padding: '0 16px',
          color: '#86909c',
          fontSize: 14
        }}>
          其他登录方式
        </span>
      </div>

      {/* 其他登录方式 */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 16
      }}>
        <Link 
          onClick={handleWechatLogin}
          style={{ 
            color: '#000000',
            backgroundColor: '#f5f5f5',
            fontSize: 14,
            border: '1px solid #e5e5e5',
            borderRadius: 4,
            padding: '4px 12px',
            textDecoration: 'none'
          }}
        >
          微信
        </Link>
        <Link 
          onClick={handleSSOLogin}
          style={{ 
            color: '#000000',
            backgroundColor: '#f5f5f5',
            fontSize: 14,
            border: '1px solid #e5e5e5',
            borderRadius: 4,
            padding: '4px 12px',
            textDecoration: 'none'
          }}
        >
          SSO
        </Link>
        <Link 
          onClick={handleIAMLogin}
          style={{ 
            color: '#000000',
            backgroundColor: '#f5f5f5',
            fontSize: 14,
            border: '1px solid #e5e5e5',
            borderRadius: 4,
            padding: '4px 12px',
            textDecoration: 'none'
          }}
        >
          IAM
        </Link>
      </div>
    </>
  )
}

