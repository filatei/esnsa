import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Tag from './Tag';

function WATClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const wat = new Date(now.getTime() + (1 * 60 * 60 * 1000));
      setTime(wat.toUTCString().replace('GMT', 'WAT').slice(0, -7).slice(-8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontSize:'11px', color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{time} WAT</span>;
}

export default function TopBar({ threatCount = 0, onMenuToggle }) {
  const { user, logout } = useAuth();
  return (
    <div style={{
      height:'52px', background:'var(--panel)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 16px', position:'sticky', top:0, zIndex:10, flexShrink:0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        {onMenuToggle && (
          <button onClick={onMenuToggle} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:'18px', display:'none' }} className="mobile-menu-btn">☰</button>
        )}
        {/* Logo */}
        <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(212,146,10,0.15)', border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', fontSize:'14px', flexShrink:0 }}>⬡</div>
        <div style={{ display:'flex', flexDirection:'column' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'10px', letterSpacing:'3px', color:'var(--text-bright)', textTransform:'uppercase', lineHeight:1.2 }}>
            Office of the National Security Adviser
          </span>
          <span style={{ fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase' }}>
            Directorate of Energy Security
          </span>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
        <WATClock />
        {threatCount > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--red)', display:'inline-block', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:'10px', color:'var(--red)' }}>{threatCount} ACTIVE</span>
          </div>
        )}
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'10px', color:'var(--text-dim)' }}>{user.officer_id}</span>
            <Tag value={user.role} />
            <button onClick={logout} style={{ background:'none', border:'1px solid var(--border-bright)', borderRadius:'4px', color:'var(--text-dim)', cursor:'pointer', fontSize:'9px', letterSpacing:'1px', padding:'3px 8px', fontFamily:'var(--font-mono)' }}>
              LOGOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
