import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Map, Users, Radio,
  FileText, BookOpen, UserCog, ScrollText, ShieldCheck,
} from 'lucide-react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';

const NAV = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'SITREP' },
  { to:'/threats',      icon:AlertTriangle,   label:'THREATS' },
  { to:'/map',          icon:Map,             label:'MAP' },
  { to:'/stakeholders', icon:Users,           label:'AGENCIES' },
  { to:'/intel',        icon:Radio,           label:'INTEL' },
  { to:'/brief',        icon:FileText,        label:'BRIEF',  roles:['DIRECTOR','ANALYST'] },
  { to:'/reports',      icon:BookOpen,        label:'REPORTS' },
  { to:'/admin',        icon:ShieldCheck,     label:'ADMIN',  roles:['ADMIN','DIRECTOR'] },
  { to:'/admin/users',  icon:UserCog,         label:'USERS',  roles:['ADMIN','DIRECTOR'] },
  { to:'/admin/audit',  icon:ScrollText,      label:'AUDIT',  roles:['ADMIN','DIRECTOR'] },
];

function BottomNav() {
  const { user } = useAuth();
  const items = NAV.filter(item => !item.roles || item.roles.includes(user?.role));
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:20,
      background:'var(--panel)', borderTop:'1px solid var(--border)',
      display:'flex', alignItems:'stretch', height:'58px',
      boxShadow:'0 -4px 24px rgba(0,0,0,0.6)',
      overflowX:'auto', WebkitOverflowScrolling:'touch', scrollbarWidth:'none',
    }}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} style={{ textDecoration:'none', flex:'1 0 auto', minWidth:'50px', maxWidth:'80px' }}>
          {({ isActive }) => (
            <div style={{
              height:'100%', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:'3px',
              borderTop: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              background: isActive ? 'rgba(0,230,118,0.07)' : 'transparent',
              padding:'0 4px',
            }}>
              <Icon size={18} color={isActive ? 'var(--accent)' : '#4a6a58'} strokeWidth={isActive ? 2.2 : 1.75} />
              <span style={{
                fontSize:'8px', fontWeight:'700', letterSpacing:'0.4px',
                fontFamily:'var(--font-mono)', color: isActive ? 'var(--accent)' : '#4a6a58',
                textAlign:'center', lineHeight:1, whiteSpace:'nowrap',
                textShadow: isActive ? '0 0 6px rgba(0,230,118,0.4)' : 'none',
              }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Shell({ children, threatCount }) {
  const mobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <TopBar threatCount={threatCount} onMenuToggle={() => setSidebarOpen(p => !p)} />
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {!mobile && <Sidebar collapsed={!sidebarOpen} />}
        <main style={{
          flex:1, overflowY:'auto',
          padding: mobile ? '12px 10px' : '20px',
          paddingBottom: mobile ? '70px' : '20px',
        }}>
          {children}
        </main>
      </div>
      {mobile && <BottomNav />}
    </div>
  );
}
