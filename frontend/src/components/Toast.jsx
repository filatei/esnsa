import { useEffect } from 'react';
const COLORS = { success:'#1fba68', error:'#d63a3a', warning:'#e0981a', info:'#2a7fd4' };

export default function Toast({ message, type = 'info', onClose }) {
  const color = COLORS[type] || COLORS.info;
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position:'fixed', top:'20px', right:'20px', zIndex:1000,
      background:'var(--panel)', border:`1px solid ${color}`,
      borderLeft:`3px solid ${color}`, borderRadius:'4px',
      padding:'12px 16px', maxWidth:'320px',
      animation:'fadeIn 0.2s ease',
    }}>
      <div style={{ fontSize:'11px', color, letterSpacing:'2px', marginBottom:'4px', textTransform:'uppercase' }}>{type}</div>
      <div style={{ fontSize:'12px', color:'var(--text)' }}>{message}</div>
    </div>
  );
}
