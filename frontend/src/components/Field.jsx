export default function Field({ label, value, accent }) {
  return (
    <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:'12px', justifyContent:'space-between', alignItems:'flex-start' }}>
      <span style={{ fontSize:'9px', color:'var(--text-dim)', letterSpacing:'2px', textTransform:'uppercase', flexShrink:0 }}>{label}</span>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--text-bright)', textAlign:'right', fontSize:'12px' }}>{value ?? '—'}</span>
    </div>
  );
}
