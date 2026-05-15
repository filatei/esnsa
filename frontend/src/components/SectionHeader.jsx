export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:'20px', fontWeight:'800', letterSpacing:'3px', color:'#ffffff', margin:0, textTransform:'uppercase' }}>{title}</h1>
      {subtitle && <p style={{ color:'var(--text-dim)', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px', margin:'4px 0 0', fontFamily:'var(--font-body)' }}>{subtitle}</p>}
    </div>
  );
}
