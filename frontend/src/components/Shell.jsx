import { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

export default function Shell({ children, threatCount }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <TopBar threatCount={threatCount} onMenuToggle={() => setSidebarOpen(p => !p)} />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar collapsed={!sidebarOpen} />
        <main style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
