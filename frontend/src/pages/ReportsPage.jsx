import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import Btn from '../components/Btn';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

export default function ReportsPage() {
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [form,     setForm]     = useState({ title:'', type:'SITREP' });
  const [file,     setFile]     = useState(null);

  const load = () => api.get('/reports').then(r => { setReports(r.data); setLoading(false); }).catch(console.error);
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title);
    fd.append('type', form.type);
    await api.post('/reports/upload', fd, { headers: { 'Content-Type':'multipart/form-data' } });
    setShowUpload(false); load();
  };

  const download = (id) => window.open(`/api/reports/${id}/download`, '_blank');
  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 8px', fontSize:'10px', fontFamily:'var(--font-mono)', borderRadius:'3px', outline:'none' };

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
          <SectionHeader title="Reports & Briefings" subtitle="DOCUMENT REPOSITORY" />
          <Btn onClick={() => setShowUpload(true)}>+ UPLOAD DOCUMENT</Btn>
        </div>

        <Panel title="DOCUMENTS">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:'0', alignItems:'center' }}>
            <div style={{ padding:'9px 14px', background:'var(--header)', borderBottom:'1px solid var(--border)', fontSize:'8px', letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase' }}>Title</div>
            {['Type','Status','Author','Date','Action'].map(h => (
              <div key={h} style={{ padding:'9px 14px', background:'var(--header)', borderBottom:'1px solid var(--border)', fontSize:'8px', letterSpacing:'2px', color:'var(--text-dim)', textTransform:'uppercase' }}>{h}</div>
            ))}
            {reports.map(r => (
              <>
                <div key={r.id+'t'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:'12px', color:'var(--text-bright)' }}>{r.title}</div>
                <div key={r.id+'ty'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}><Tag value={r.type} /></div>
                <div key={r.id+'s'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}><Tag value={r.status} /></div>
                <div key={r.id+'a'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:'10px', color:'var(--text-dim)' }}>{r.author_name || '—'}</div>
                <div key={r.id+'d'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:'11px', color:'var(--text-dim)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                <div key={r.id+'ac'} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
                  {r.file_path && <Btn size="small" onClick={() => download(r.id)} color="var(--blue)">DOWNLOAD</Btn>}
                </div>
              </>
            ))}
          </div>
          {reports.length === 0 && <div style={{ padding:'32px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px' }}>NO DOCUMENTS ON FILE</div>}
        </Panel>

        {showUpload && (
          <Modal title="Upload Document" onClose={() => setShowUpload(false)}>
            <form onSubmit={handleUpload} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Title</label>
                <input required style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-mono)', outline:'none' }}
                  value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Document Type</label>
                <select style={{ ...selectStyle, width:'100%', padding:'8px' }} value={form.type} onChange={e => setForm(f => ({...f, type:e.target.value}))}>
                  {['SITREP','ANALYTICAL','OPERATIONAL','INTELLIGENCE','EXECUTIVE','STRATEGIC'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>File (PDF or DOCX)</label>
                <input required type="file" accept=".pdf,.docx" onChange={e => setFile(e.target.files[0])}
                  style={{ fontSize:'11px', color:'var(--text)', fontFamily:'var(--font-mono)' }} />
              </div>
              <Btn type="submit" style={{ width:'100%' }}>UPLOAD</Btn>
            </form>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
