import React from 'react';
import SidebarMenu from './components/Layout/SidebarMenu';
import BottomMenu from './components/Layout/BottomMenu';
import TopBar from './components/Layout/TopBar'; // 引入 TopBar

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar /> {/* 使用 TopBar */}
      <div style={{ flex: 1, display: 'flex' }}>
        <SidebarMenu currentPage="prompt-generate" onPageChange={() => {}} />
        {/* 主要内容区域 */}
      </div>
      <BottomMenu currentPage="api-key" onPageChange={() => {}} collapsed={false} />
    </div>
  );
}

export default App;