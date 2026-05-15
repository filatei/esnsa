export default function Panel({ title, badge, children, style, headerActions }) {
  return (
    <div style={{
      background:   'var(--panel)',
      border:       '1px solid var(--border)',
      borderRadius: '8px',
      overflow:     'hidden',
      ...style,
    }}>
      {title && (
        <div style={{
          background:  'var(--header)',
          borderBottom:'1px solid var(--border)',
          padding:     '9px 14px',
          display:     'flex',
          alignItems:  'center',
          justifyContent:'space-between',
          gap:         '8px',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'9px', letterSpacing:'3px', color:'var(--text-dim)', textTransform:'uppercase' }}>
              {title}
            </span>
            {badge}
          </div>
          {headerActions}
        </div>
      )}
      {children}
    </div>
  );
}
