export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:'18px', letterSpacing:'4px', color:'var(--text-bright)', margin:0, textTransform:'uppercase' }}>{title}</h1>
      {subtitle && <p style={{ color:'var(--text-dim)', fontSize:'10px', letterSpacing:'2px', margin:'4px 0 0' }}>{subtitle}</p>}
    </div>
  );
}
