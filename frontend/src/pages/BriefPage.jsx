import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Btn from '../components/Btn';
import Tag from '../components/Tag';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

const BRIEF_TYPES = [
  { value:'DAILY_SITREP',  label:'Daily SITREP' },
  { value:'WEEKLY_SUMMARY',label:'Weekly Summary' },
  { value:'NSC_BRIEF',     label:'NSC Presentation Brief' },
  { value:'INCIDENT',      label:'Incident-Specific Brief' },
];

export default function BriefPage() {
  const [briefType, setBriefType] = useState('DAILY_SITREP');
  const [generating, setGenerating] = useState(false);
  const [brief,      setBrief]      = useState(null);
  const [history,    setHistory]    = useState([]);
  const [error,      setError]      = useState('');

  const loadHistory = () => api.get('/brief/history').then(r => setHistory(r.data)).catch(console.error);
  useEffect(() => { loadHistory(); }, []);

  const generate = async () => {
    setGenerating(true); setError(''); setBrief(null);
    try {
      const res = await api.post('/brief/generate', { brief_type: briefType, date: new Date().toISOString().split('T')[0] });
      setBrief(res.data.brief);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'BRIEF GENERATION FAILED');
    } finally { setGenerating(false); }
  };

  const updateStatus = async (id, status) => {
    await api.put(`/brief/${id}/status`, { status });
    loadHistory();
    if (brief?.id === id) setBrief(b => ({...b, status}));
  };

  const loadBrief = async (id) => {
    const res = await api.get(`/brief/${id}`);
    setBrief(res.data);
  };

  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontSize:'11px', fontFamily:'var(--font-mono)', borderRadius:'4px', outline:'none', width:'100%' };

  return (
    <Shell>
      <div className="fade-in">
        <SectionHeader title="AI Brief Generator" subtitle="POWERED BY ANTHROPIC CLAUDE — CLASSIFIED OUTPUT" />

        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'12px' }}>
          {/* Control panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <Panel title="GENERATE BRIEF">
              <div style={{ padding:'14px', display:'flex', flexDirection:'column', gap:'12px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'6px', textTransform:'uppercase' }}>Brief Type</label>
                  <select style={selectStyle} value={briefType} onChange={e => setBriefType(e.target.value)}>
                    {BRIEF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div style={{ fontSize:'9px', color:'var(--text-dim)', lineHeight:1.6 }}>
                  Claude will pull all active threats and last 24hr intel from the database and generate a classified brief.
                </div>
                <Btn onClick={generate} disabled={generating} style={{ width:'100%' }} color="var(--accent)">
                  {generating ? 'GENERATING...' : 'GENERATE BRIEF'}
                </Btn>
                {error && <div style={{ fontSize:'10px', color:'var(--red)', padding:'8px', background:'rgba(214,58,58,0.1)', borderRadius:'3px' }}>{error}</div>}
              </div>
            </Panel>

            <Panel title="BRIEF HISTORY">
              <div style={{ maxHeight:'400px', overflowY:'auto' }}>
                {history.map(h => (
                  <div key={h.id} onClick={() => loadBrief(h.id)} style={{ padding:'10px 12px', borderBottom:'1px solid var(--border)', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--panel-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                      <Tag value={h.status} />
                    </div>
                    <div style={{ fontSize:'10px', color:'var(--text)' }}>{h.brief_type.replace(/_/g,' ')}</div>
                    <div style={{ fontSize:'9px', color:'var(--text-dim)', marginTop:'3px' }}>{new Date(h.generated_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Brief display */}
          <Panel title="CLASSIFIED BRIEF" badge={brief ? <Tag value="SECRET" /> : null}
            headerActions={brief ? (
              <div style={{ display:'flex', gap:'6px' }}>
                <Btn size="small" color="var(--green)"  onClick={() => updateStatus(brief.id,'REVIEWED')}>MARK REVIEWED</Btn>
                <Btn size="small" color="var(--accent)" onClick={() => updateStatus(brief.id,'SENT')}>SEND TO NSA</Btn>
                <Btn size="small" color="var(--text-dim)" onClick={() => updateStatus(brief.id,'ARCHIVED')}>ARCHIVE</Btn>
              </div>
            ) : null}
          >
            {generating ? (
              <LoadingSpinner label="GENERATING CLASSIFIED BRIEF..." />
            ) : brief ? (
              <div style={{ padding:'20px' }}>
                <pre style={{
                  fontFamily:'var(--font-mono)', fontSize:'11px', color:'var(--text)',
                  lineHeight:1.9, whiteSpace:'pre-wrap', wordBreak:'break-word', margin:0,
                  borderLeft:'2px solid var(--accent-dim)', paddingLeft:'16px',
                }}>{brief.content}</pre>
              </div>
            ) : (
              <div style={{ padding:'48px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px', letterSpacing:'2px' }}>
                SELECT BRIEF TYPE AND GENERATE
              </div>
            )}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
