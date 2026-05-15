import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import LoadingSpinner from '../components/LoadingSpinner';
import NigeriaMap from '../components/NigeriaMap';
import ThreatDetail from '../components/ThreatDetail';
import api from '../api/axios';

function MetricCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{ background:'var(--panel)', border:`1px solid var(--border)`, borderRadius:'8px', padding:'14px 16px', borderTop:`2px solid ${color}` }}>
      <div style={{ fontSize:'10px', fontWeight:'600', letterSpacing:'1.5px', color:'var(--text-dim)', textTransform:'uppercase', marginBottom:'8px', fontFamily:'var(--font-mono)' }}>{label}</div>
      <div style={{ fontSize:'24px', fontFamily:'var(--font-mono)', fontWeight:'bold', color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:'10px', fontWeight:'500', color:'var(--text-dim)', marginTop:'5px' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [metrics,  setMetrics]  = useState(null);
  const [threats,  setThreats]  = useState([]);
  const [intel,    setIntel]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  const loadData = async () => {
    try {
      const [m, t, i] = await Promise.all([
        api.get('/dashboard/metrics'),
        api.get('/threats?limit=10'),
        api.get('/intel?limit=7'),
      ]);
      setMetrics(m.data);
      setThreats(t.data);
      setIntel(i.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 60000);
    return () => clearInterval(id);
  }, []);

  const activeCount = threats.filter(t => t.status === 'ACTIVE').length;

  if (loading) return <Shell><LoadingSpinner label="LOADING SITREP..." /></Shell>;

  return (
    <Shell threatCount={activeCount}>
      <div className="fade-in">
        {/* Metric cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'12px', marginBottom:'16px' }}>
          <MetricCard label="Active Threats" value={metrics?.active_threats ?? 0} color="var(--red)" />
          <MetricCard label="Production BPD" value={metrics ? (metrics.production_bpd / 1000000).toFixed(2) + 'M' : '—'} sub={`Target: ${metrics ? (metrics.target_bpd/1000000).toFixed(2)+'M' : '—'}`} color="var(--accent)" />
          <MetricCard label="Daily Loss $" value={metrics ? '$' + (metrics.daily_loss_usd / 1000000).toFixed(1) + 'M' : '—'} color="var(--yellow)" />
          <MetricCard label="Incidents MTD" value={metrics?.incidents_mtd ?? 0} color="var(--blue)" />
          <MetricCard label="Response Rate" value={`${metrics?.response_rate ?? 0}%`} color="var(--green)" />
          <MetricCard label="Agencies Active" value={metrics?.agencies_active ?? 0} color="var(--accent)" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'12px', marginBottom:'12px' }}>
          {/* Threat map */}
          <Panel title="GEO-THREAT MAP" style={{ minHeight:'400px' }}>
            <div style={{ padding:'8px', height:'400px' }}>
              <NigeriaMap threats={threats} onThreatClick={setSelected} />
            </div>
          </Panel>

          {/* Intel feed */}
          <Panel title="INTELLIGENCE FEED" badge={<span style={{ fontSize:'10px', fontWeight:'600', color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>LAST 7</span>}>
            {intel.map(item => (
              <div key={item.id} style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ display:'flex', gap:'6px', marginBottom:'5px', alignItems:'center' }}>
                  <Tag value={item.classification} />
                  <span style={{ fontSize:'10px', fontWeight:'600', color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{item.source}</span>
                </div>
                <p style={{ margin:0, fontSize:'12px', fontWeight:'500', fontFamily:'var(--font-body)', lineHeight:1.65, color:'#e8f5ee' }}>{item.content}</p>
                <div style={{ fontSize:'10px', color:'var(--text-dim)', marginTop:'5px', fontFamily:'var(--font-mono)' }}>
                  {new Date(item.logged_at).toLocaleString()}
                </div>
              </div>
            ))}
          </Panel>
        </div>

        {/* Active incidents + selected detail */}
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap:'12px' }}>
          <Panel title="ACTIVE INCIDENTS">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1px', background:'var(--border)' }}>
              {threats.filter(t => ['ACTIVE','MONITORING'].includes(t.status)).map(t => (
                <div key={t.id} onClick={() => setSelected(t)} style={{ background:'var(--panel)', padding:'12px 14px', cursor:'pointer', transition:'background 0.1s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--panel-hover)'}
                  onMouseLeave={e=>e.currentTarget.style.background='var(--panel)'}>
                  <div style={{ display:'flex', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', fontWeight:'700', color:'var(--accent)', fontFamily:'var(--font-mono)', letterSpacing:'1px' }}>{t.incident_id}</span>
                    <Tag value={t.severity} /><Tag value={t.status} />
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'4px', letterSpacing:'0.3px' }}>{t.type}</div>
                  <div style={{ fontSize:'11px', fontWeight:'500', color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>{t.location}</div>
                </div>
              ))}
            </div>
          </Panel>
          {selected && <ThreatDetail threat={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </Shell>
  );
}
