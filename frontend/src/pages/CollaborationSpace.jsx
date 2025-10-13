import React from 'react';

const CollaborationSpace = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>协作空间</h1>
      <p>在这里您可以与团队成员协作，共同管理和编辑项目内容。</p>
      
      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #e5e6eb',
        borderRadius: '6px',
        backgroundColor: '#f7f8fa'
      }}>
        <h2>功能特性</h2>
        <ul>
          <li>团队成员管理</li>
          <li>共享项目和资源</li>
          <li>实时协作编辑</li>
          <li>权限控制</li>
          <li>协作历史记录</li>
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
        <p>协作空间允许您邀请团队成员加入项目，共同编辑和管理内容。您可以设置不同成员的权限级别，确保项目安全。</p>
      </div>
    </div>
  );
};

export default CollaborationSpace;