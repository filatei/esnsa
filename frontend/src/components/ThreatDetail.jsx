import Tag from './Tag';
import Field from './Field';
import Btn from './Btn';
export default function ThreatDetail({ threat, onClose }) {
  if (!threat) return null;
  return (
    <div style={{ background:'var(--panel)', border:'1px solid var(--border-bright)', borderRadius:'8px', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ background:'var(--header)', borderBottom:'1px solid var(--border)', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <span style={{ color:'var(--accent)', fontFamily:'var(--font-mono)', fontSize:'12px' }}>{threat.incident_id}</span>
          <Tag value={threat.severity} />
          <Tag value={threat.status} />
        </div>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:'18px' }}>×</button>}
      </div>
      <div style={{ padding:'14px', overflowY:'auto', flex:1 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'14px', letterSpacing:'2px', color:'var(--text-bright)', marginBottom:'12px', textTransform:'uppercase' }}>{threat.type}</div>
        <Field label="Location" value={threat.location} />
        <Field label="State" value={threat.state} />
        <Field label="Loss Estimate" value={threat.loss_estimate} accent />
        <Field label="Logged" value={threat.logged_at ? new Date(threat.logged_at).toLocaleString() : '—'} />
        {threat.agencies?.length > 0 && (
          <div style={{ marginTop:'12px' }}>
            <div style={{ fontSize:'9px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'6px', textTransform:'uppercase' }}>Assigned Agencies</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
              {threat.agencies.map(a => <Tag key={a} value={a} />)}
            </div>
          </div>
        )}
        {threat.description && (
          <div style={{ marginTop:'12px' }}>
            <div style={{ fontSize:'9px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'6px', textTransform:'uppercase' }}>Description</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:'12px', lineHeight:1.7, color:'var(--text)', margin:0 }}>{threat.description}</p>
          </div>
        )}
        {threat.notes?.length > 0 && (
          <div style={{ marginTop:'12px' }}>
            <div style={{ fontSize:'9px', color:'var(--text-dim)', letterSpacing:'2px', marginBottom:'6px', textTransform:'uppercase' }}>Timeline / Notes</div>
            {threat.notes.map(n => (
              <div key={n.id} style={{ padding:'8px', background:'var(--bg)', borderRadius:'4px', marginBottom:'6px' }}>
                <div style={{ fontSize:'9px', color:'var(--text-dim)', marginBottom:'4px' }}>{n.author_name} · {new Date(n.created_at).toLocaleString()}</div>
                <div style={{ fontSize:'12px', color:'var(--text)' }}>{n.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
