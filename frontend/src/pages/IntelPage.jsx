import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import Btn from '../components/Btn';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SOURCES = ['NIA SIGINT','NIA HUMINT','DSS FIELD','ARMY J2','NNPCL OPS','NIMASA'];

export default function IntelPage() {
  const { user } = useAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ classification:'', source:'' });
  const [form,    setForm]    = useState({ classification:'SECRET', source:'NIA SIGINT', content:'' });

  const load = async () => {
    const params = new URLSearchParams();
    if (filters.classification) params.set('classification', filters.classification);
    if (filters.source)         params.set('source', filters.source);
    const res = await api.get(`/intel?${params}&limit=100`);
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/intel', form);
    setShowAdd(false);
    load();
  };

  const canAdd = ['DIRECTOR','ANALYST'].includes(user?.role);
  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 8px', fontSize:'10px', fontFamily:'var(--font-mono)', borderRadius:'3px', outline:'none' };

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
          <SectionHeader title="Intelligence Feed" subtitle={`${items.length} ITEMS ON RECORD`} />
          {canAdd && <Btn onClick={() => setShowAdd(true)}>+ ADD INTEL</Btn>}
        </div>
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
          <select style={selectStyle} value={filters.classification} onChange={e => setFilters(f => ({...f, classification:e.target.value}))}>
            <option value="">ALL CLASSIFICATIONS</option>
            {['TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={selectStyle} value={filters.source} onChange={e => setFilters(f => ({...f, source:e.target.value}))}>
            <option value="">ALL SOURCES</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Panel title="INTEL ITEMS">
          {items.map(item => (
            <div key={item.id} style={{ padding:'14px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'8px' }}>
                <Tag value={item.classification} />
                <span style={{ fontSize:'9px', color:'var(--accent)', letterSpacing:'1px' }}>{item.source}</span>
                {item.is_actioned && <Tag value="ACTIONED" />}
                <span style={{ fontSize:'9px', color:'var(--text-dim)', marginLeft:'auto' }}>{new Date(item.logged_at).toLocaleString()}</span>
              </div>
              <p style={{ margin:0, fontSize:'12px', fontFamily:'var(--font-body)', lineHeight:1.7, color:'var(--text)' }}>{item.content}</p>
              {item.logged_by_name && <div style={{ fontSize:'9px', color:'var(--text-dim)', marginTop:'6px' }}>Logged by {item.logged_by_name}</div>}
            </div>
          ))}
        </Panel>
        {showAdd && (
          <Modal title="Add Intelligence Item" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { label:'Classification', field:'classification', as:'select', options:['TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED'] },
                { label:'Source', field:'source', as:'select', options:SOURCES },
              ].map(({ label, field, as, options }) => (
                <div key={field}>
                  <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>{label}</label>
                  <select style={{ ...selectStyle, width:'100%', padding:'8px' }} value={form[field]} onChange={e => setForm(f => ({...f, [field]:e.target.value}))}>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Intelligence Content</label>
                <textarea required rows={5} style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-body)', lineHeight:1.7, outline:'none', resize:'vertical' }}
                  value={form.content} onChange={e => setForm(f => ({...f, content:e.target.value}))} placeholder="Enter intelligence item..." />
              </div>
              <Btn type="submit" style={{ width:'100%' }}>LOG INTEL ITEM</Btn>
            </form>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
