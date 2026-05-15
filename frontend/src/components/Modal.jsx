export default function Modal({ title, onClose, children, width = '520px' }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'var(--panel)', border:'1px solid var(--border-bright)', borderRadius:'8px', width:'100%', maxWidth:width, maxHeight:'90vh', overflow:'auto', animation:'fadeIn 0.2s ease' }}>
        <div style={{ background:'var(--header)', borderBottom:'1px solid var(--border)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-display)', fontSize:'13px', letterSpacing:'3px', color:'var(--text-bright)', textTransform:'uppercase' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'16px' }}>{children}</div>
      </div>
    </div>
  );
}
