import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import ThreatRow from '../components/ThreatRow';
import ThreatDetail from '../components/ThreatDetail';
import Btn from '../components/Btn';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const TYPES = ['Pipeline Breach','Illegal Refinery','Maritime Intrusion','Pipeline Vandalism','Militant Threat','Gas Pipeline Sabotage','Bunkering','Cyber Threat'];
const STATES = ['Abia','Akwa Ibom','Bayelsa','Borno','Cross River','Delta','Edo','Imo','Lagos','Ondo','Rivers','Sokoto','Offshore'];

export default function ThreatsPage() {
  const { user } = useAuth();
  const [threats,   setThreats]   = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [filters,   setFilters]   = useState({ severity:'', status:'' });
  const [form,      setForm]      = useState({ type:'Pipeline Breach', location:'', state:'', severity:'HIGH', status:'ACTIVE', loss_estimate:'', description:'' });

  const loadThreats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.status)   params.set('status',   filters.status);
      const res = await api.get(`/threats?${params}`);
      setThreats(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadThreats(); }, [filters]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/threats', form);
      setShowAdd(false);
      loadThreats();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const canAdd = ['DIRECTOR','ANALYST'].includes(user?.role);
  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 8px', fontSize:'10px', fontFamily:'var(--font-mono)', borderRadius:'3px', outline:'none' };

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
          <SectionHeader title="Threat Registry" subtitle={`${threats.length} INCIDENTS ON RECORD`} />
          {canAdd && <Btn onClick={() => setShowAdd(true)} color="var(--accent)">+ NEW INCIDENT</Btn>}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
          <select style={selectStyle} value={filters.severity} onChange={e => setFilters(f => ({...f, severity:e.target.value}))}>
            <option value="">ALL SEVERITY</option>
            {['CRITICAL','HIGH','MEDIUM','LOW'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={selectStyle} value={filters.status} onChange={e => setFilters(f => ({...f, status:e.target.value}))}>
            <option value="">ALL STATUS</option>
            {['ACTIVE','MONITORING','CONTAINED','RESOLVED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap:'12px' }}>
          <Panel title="INCIDENTS">
            {threats.length === 0
              ? <div style={{ padding:'32px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px' }}>NO INCIDENTS MATCH FILTERS</div>
              : threats.map(t => <ThreatRow key={t.id} threat={t} onClick={setSelected} active={selected?.id === t.id} />)
            }
          </Panel>
          {selected && (
            <ThreatDetail
              threat={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

        {showAdd && (
          <Modal title="New Incident" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { label:'Type', field:'type', as:'select', options:TYPES },
                { label:'Location', field:'location', placeholder:'e.g. Bonny-Forcados Corridor' },
                { label:'State', field:'state', as:'select', options:STATES },
                { label:'Severity', field:'severity', as:'select', options:['CRITICAL','HIGH','MEDIUM','LOW'] },
                { label:'Status', field:'status', as:'select', options:['ACTIVE','MONITORING','CONTAINED','RESOLVED'] },
                { label:'Loss Estimate', field:'loss_estimate', placeholder:'e.g. 12,400 bbl/day' },
              ].map(({ label, field, as, options, placeholder }) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>{label}</label>
                  {as === 'select'
                    ? <select style={{ ...selectStyle, width:'100%', padding:'8px' }} value={form[field]} onChange={e => setForm(f => ({...f, [field]:e.target.value}))}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    : <input style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-mono)', outline:'none' }}
                        value={form[field]} onChange={e => setForm(f => ({...f, [field]:e.target.value}))} placeholder={placeholder} />
                  }
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Description</label>
                <textarea rows={3} style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-body)', lineHeight:1.6, outline:'none', resize:'vertical' }}
                  value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} />
              </div>
              <Btn type="submit" style={{ width:'100%' }}>LOG INCIDENT</Btn>
            </form>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
