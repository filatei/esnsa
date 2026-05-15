export default function LoadingSpinner({ label = 'PROCESSING...' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px', padding:'48px' }}>
      <div style={{ width:'32px', height:'32px', border:'2px solid var(--border)', borderTop:`2px solid var(--accent)`, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize:'11px', letterSpacing:'3px', color:'var(--text-dim)' }}>{label}</span>
    </div>
  );
}
