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
          <span style={{ color:'var(--accent)', fontSize:'10px', flexShrink:0 }}>{threat.incident_id}</span>
          <Tag value={threat.severity} />
          <Tag value={threat.status} />
        </div>
        <div style={{ color:'var(--text-bright)', fontSize:'12px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{threat.type}</div>
        <div style={{ color:'var(--text-dim)', fontSize:'10px', marginTop:'2px' }}>{threat.location}{threat.state ? ` · ${threat.state}` : ''}</div>
      </div>
    </div>
  );
}
