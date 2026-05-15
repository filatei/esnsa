export default function Field({ label, value, accent }) {
  return (
    <div style={{ padding:'8px 0', borderBottom:'1px solid var(--border)', display:'flex', gap:'12px', justifyContent:'space-between', alignItems:'flex-start' }}>
      <span style={{ fontSize:'10px', fontWeight:'600', fontFamily:'var(--font-mono)', color:'var(--text-dim)', letterSpacing:'1.5px', textTransform:'uppercase', flexShrink:0 }}>{label}</span>
      <span style={{ color: accent ? 'var(--accent)' : '#ffffff', textAlign:'right', fontSize:'13px', fontWeight:'500' }}>{value ?? '—'}</span>
    </div>
  );
}
