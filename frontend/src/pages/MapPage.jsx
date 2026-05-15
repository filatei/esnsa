import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import NigeriaMap from '../components/NigeriaMap';
import Tag from '../components/Tag';
import ThreatDetail from '../components/ThreatDetail';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

export default function MapPage() {
  const [threats,  setThreats]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');

  useEffect(() => {
    api.get('/threats').then(r => setThreats(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const displayed = filter ? threats.filter(t => t.severity === filter || t.status === filter) : threats;
  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 8px', fontSize:'10px', fontFamily:'var(--font-mono)', borderRadius:'3px', outline:'none' };

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', flexWrap:'wrap', gap:'8px' }}>
          <SectionHeader title="Geo-Threat Map" subtitle="NIGERIA ENERGY INFRASTRUCTURE — INCIDENT OVERLAY" />
          <select style={selectStyle} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">ALL INCIDENTS</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="MONITORING">MONITORING</option>
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr 200px', gap:'12px' }}>
          <Panel title="THREAT OVERLAY" style={{ minHeight:'500px' }}>
            <div style={{ height:'500px', padding:'8px' }}>
              <NigeriaMap threats={displayed} onThreatClick={setSelected} />
            </div>
          </Panel>

          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {selected ? (
              <ThreatDetail threat={selected} onClose={() => setSelected(null)} />
            ) : (
              <Panel title="LEGEND">
                <div style={{ padding:'12px' }}>
                  {[['CRITICAL','#d63a3a'],['HIGH','#e0981a'],['MEDIUM','#d4920a'],['LOW','#1fba68']].map(([s,c]) => (
                    <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                      <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }} />
                      <span style={{ fontSize:'10px', color:c }}>{s}</span>
                    </div>
                  ))}
                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:'10px', marginTop:'6px' }}>
                    <div style={{ fontSize:'9px', color:'var(--text-dim)', marginBottom:'6px', letterSpacing:'2px' }}>STATUS</div>
                    {[['ACTIVE','pulsing ring'],['MONITORING','steady ring'],['CONTAINED','dot only'],['RESOLVED','dot only']].map(([s,d]) => (
                      <div key={s} style={{ marginBottom:'6px' }}>
                        <Tag value={s} />
                        <span style={{ fontSize:'8px', color:'var(--text-dim)', marginLeft:'6px' }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            )}
            <Panel title="INCIDENTS">
              <div style={{ maxHeight:'300px', overflowY:'auto' }}>
                {displayed.map(t => (
                  <div key={t.id} onClick={() => setSelected(t)} style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--panel-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{ display:'flex', gap:'5px', marginBottom:'3px' }}>
                      <span style={{ color:'var(--accent)', fontSize:'10px' }}>{t.incident_id}</span>
                      <Tag value={t.severity} />
                    </div>
                    <div style={{ fontSize:'10px', color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.location}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </Shell>
  );
}
