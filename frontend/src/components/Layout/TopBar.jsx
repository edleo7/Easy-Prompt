import React from 'react';
import { Input, Button } from '@arco-design/web-react';

const TopBar = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      borderBottom: '1px solid #e5e6eb'
    }}>
      <div>你好，XXX</div>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Input placeholder="请输入" style={{ marginBottom: '8px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="default">知识库</Button>
          <Button type="default">变量库</Button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;