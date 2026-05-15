import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map, Users, Radio, FileText, BookOpen, ClipboardList, UserCog, ScrollText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'SITREP' },
  { to:'/threats',      icon:AlertTriangle,   label:'THREATS' },
  { to:'/map',          icon:Map,             label:'GEO MAP' },
  { to:'/stakeholders', icon:Users,           label:'AGENCIES' },
  { to:'/intel',        icon:Radio,           label:'INTEL' },
  { to:'/brief',        icon:FileText,        label:'AI BRIEF', roles:['DIRECTOR','ANALYST'] },
  { to:'/reports',      icon:BookOpen,        label:'REPORTS' },
  { to:'/admin/users',  icon:UserCog,         label:'USERS',    roles:['ADMIN','DIRECTOR'] },
  { to:'/admin/audit',  icon:ScrollText,      label:'AUDIT',    roles:['ADMIN','DIRECTOR'] },
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  return (
    <div style={{
      width: collapsed ? '0' : '66px',
      overflow: 'hidden',
      background:'var(--panel)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'8px 0', gap:'2px', flexShrink:0, transition:'width 0.2s',
    }}>
      {NAV.filter(item => !item.roles || item.roles.includes(user?.role)).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} title={label} style={{ textDecoration:'none', width:'50px' }}>
          {({ isActive }) => (
            <div style={{
              width:'50px', height:'50px', borderRadius:'8px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:'4px',
              background: isActive ? 'rgba(0,200,83,0.10)' : 'transparent',
              border: isActive ? '1px solid rgba(0,200,83,0.25)' : '1px solid transparent',
              transition:'all 0.15s', cursor:'pointer',
            }}>
              <Icon size={16} color={isActive ? 'var(--accent)' : 'var(--text-dim)'} />
              <span style={{ fontSize:'7px', letterSpacing:'0.5px', color: isActive ? 'var(--accent)' : 'var(--text-dim)', textAlign:'center', lineHeight:1 }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
