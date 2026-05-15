import Tag from './Tag';
export default function ThreatRow({ threat, onClick, active }) {
  return (
    <div
      onClick={() => onClick?.(threat)}
      style={{
        padding:'11px 14px', borderBottom:'1px solid var(--border)',
        cursor:'pointer', display:'flex', gap:'10px', alignItems:'center',
        background: active ? 'var(--panel-hover)' : 'transparent',
        transition:'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--panel-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = active ? 'var(--panel-hover)' : 'transparent'}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'4px' }}>
          <span style={{ color:'var(--accent)', fontSize:'11px', fontWeight:'700', fontFamily:'var(--font-mono)', letterSpacing:'0.5px', flexShrink:0 }}>{threat.incident_id}</span>
          <Tag value={threat.severity} />
          <Tag value={threat.status} />
        </div>
        <div style={{ color:'#ffffff', fontSize:'13px', fontWeight:'600', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'0.2px' }}>{threat.type}</div>
        <div style={{ color:'var(--text-dim)', fontSize:'11px', fontWeight:'500', marginTop:'2px', fontFamily:'var(--font-mono)' }}>{threat.location}{threat.state ? ` · ${threat.state}` : ''}</div>
      </div>
    </div>
  );
}
