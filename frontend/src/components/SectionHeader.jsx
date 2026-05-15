export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:'20px', fontWeight:'800', letterSpacing:'2px', color:'#ffffff', margin:0, textTransform:'uppercase' }}>{title}</h1>
      {subtitle && <p style={{ color:'#9abaa8', fontSize:'11px', fontWeight:'700', letterSpacing:'1px', margin:'4px 0 0', fontFamily:'var(--font-mono)' }}>{subtitle}</p>}
    </div>
  );
}
