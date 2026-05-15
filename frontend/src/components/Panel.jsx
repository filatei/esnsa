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
            <span style={{ fontSize:'10px', fontWeight:'700', letterSpacing:'2.5px', color:'#c0d8ca', textTransform:'uppercase', fontFamily:'var(--font-mono)' }}>
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
