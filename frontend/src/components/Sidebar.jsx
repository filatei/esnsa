import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map, Users, Radio, FileText, BookOpen, UserCog, ScrollText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to:'/dashboard',    icon:LayoutDashboard, label:'SITREP' },
  { to:'/threats',      icon:AlertTriangle,   label:'THREATS' },
  { to:'/map',          icon:Map,             label:'GEO MAP' },
  { to:'/stakeholders', icon:Users,           label:'AGENCIES' },
  { to:'/intel',        icon:Radio,           label:'INTEL' },
  { to:'/brief',        icon:FileText,        label:'AI BRIEF', roles:['DIRECTOR','ANALYST'] },
  { to:'/reports',      icon:BookOpen,        label:'REPORTS' },
  { to:'/admin',        icon:ShieldCheck,     label:'ADMIN',    roles:['ADMIN','DIRECTOR'] },
  { to:'/admin/users',  icon:UserCog,         label:'USERS',    roles:['ADMIN','DIRECTOR'] },
  { to:'/admin/audit',  icon:ScrollText,      label:'AUDIT',    roles:['ADMIN','DIRECTOR'] },
];

export default function Sidebar({ collapsed }) {
  const { user } = useAuth();
  return (
    <div style={{
      width: collapsed ? '0' : '72px',
      overflow: 'hidden',
      background:'var(--panel)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', alignItems:'center',
      padding:'10px 0', gap:'2px', flexShrink:0, transition:'width 0.2s',
    }}>
      {NAV.filter(item => !item.roles || item.roles.includes(user?.role)).map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} title={label} style={{ textDecoration:'none', width:'58px' }}>
          {({ isActive }) => (
            <div style={{
              width:'58px', height:'54px', borderRadius:'8px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center', gap:'5px',
              background: isActive ? 'rgba(0,230,118,0.10)' : 'transparent',
              border: isActive ? '1px solid rgba(0,230,118,0.30)' : '1px solid transparent',
              boxShadow: isActive ? '0 0 10px rgba(0,230,118,0.08)' : 'none',
              transition:'all 0.15s', cursor:'pointer',
            }}>
              <Icon
                size={19}
                color={isActive ? 'var(--accent)' : '#5a7a68'}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span style={{
                fontSize:'8px', fontWeight:'700', letterSpacing:'0.8px',
                fontFamily:'var(--font-mono)',
                color: isActive ? 'var(--accent)' : '#4a6a58',
                textAlign:'center', lineHeight:1,
                textShadow: isActive ? '0 0 6px rgba(0,230,118,0.4)' : 'none',
              }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
