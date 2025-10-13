import React from 'react';

const VariableLibrary = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>变量库</h1>
      <p>在这里您可以管理和使用变量，以便在Prompt中进行动态替换。</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #e5e6eb',
        borderRadius: '6px',
        backgroundColor: '#f7f8fa'
      }}>
        <h2>功能特性</h2>
        <ul>
          <li>创建和管理变量</li>
          <li>在Prompt中使用变量</li>
          <li>变量分组管理</li>
          <li>变量版本控制</li>
          <li>变量共享与复用</li>
        </ul>
      </div>
      
      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #e5e6eb',
        borderRadius: '6px',
        backgroundColor: '#f7f8fa'
      }}>
        <h2>使用说明</h2>
        <p>变量库允许您定义可在多个Prompt中复用的变量。通过使用变量，您可以轻松创建动态和个性化的Prompt模板，提高工作效率。</p>
      </div>
    </div>
  );
};

export default VariableLibrary;