import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import Btn from '../components/Btn';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

export default function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showCompose,  setShowCompose]  = useState(false);
  const [msgForm,      setMsgForm]      = useState({ to_stakeholder:'', subject:'', body:'', classification:'RESTRICTED' });

  const load = async () => {
    const [s, m] = await Promise.all([api.get('/stakeholders'), api.get('/messages')]);
    setStakeholders(s.data); setMessages(m.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const sendMsg = async (e) => {
    e.preventDefault();
    await api.post('/messages', msgForm);
    setShowCompose(false); load();
  };

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  const selectStyle = { background:'var(--panel)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 8px', fontSize:'10px', fontFamily:'var(--font-mono)', borderRadius:'3px', outline:'none' };

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
          <SectionHeader title="Stakeholder Hub" subtitle="INTER-AGENCY COORDINATION" />
          <Btn onClick={() => setShowCompose(true)}>+ COMPOSE MESSAGE</Btn>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px', marginBottom:'16px' }}>
          {stakeholders.map(s => (
            <div key={s.id} style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px', padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                <span style={{ fontSize:'12px', color:'var(--text-bright)', fontWeight:'bold' }}>{s.name}</span>
                {s.unread_count > 0 && (
                  <span style={{ background:'var(--red)', color:'#fff', borderRadius:'10px', padding:'1px 6px', fontSize:'11px' }}>{s.unread_count}</span>
                )}
              </div>
              <div style={{ fontSize:'10px', color:'var(--text-dim)', marginBottom:'8px' }}>{s.role}</div>
              <Tag value={s.status} />
              {s.last_contact && <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'6px' }}>Last: {new Date(s.last_contact).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>

        <Panel title="RECENT COMMUNICATIONS" badge={<span style={{ fontSize:'11px', color:'var(--text-dim)' }}>{messages.length} MESSAGES</span>}>
          {messages.slice(0, 20).map(m => (
            <div key={m.id} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ display:'flex', gap:'6px', alignItems:'center', marginBottom:'5px' }}>
                <Tag value={m.classification} />
                <span style={{ fontSize:'10px', color:'var(--accent)' }}>{m.from_name}</span>
                <span style={{ fontSize:'10px', color:'var(--text-dim)' }}>→ {m.to_stakeholder_name}</span>
                <span style={{ fontSize:'11px', color:'var(--text-dim)', marginLeft:'auto' }}>{new Date(m.sent_at).toLocaleString()}</span>
              </div>
              <div style={{ fontSize:'12px', color:'var(--text-bright)', marginBottom:'4px' }}>{m.subject}</div>
              <p style={{ margin:0, fontSize:'11px', fontFamily:'var(--font-body)', color:'var(--text)', lineHeight:1.6 }}>{m.body.slice(0, 200)}{m.body.length > 200 ? '…' : ''}</p>
            </div>
          ))}
        </Panel>

        {showCompose && (
          <Modal title="Compose Message" onClose={() => setShowCompose(false)}>
            <form onSubmit={sendMsg} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>To Agency</label>
                <select required style={{ ...selectStyle, width:'100%', padding:'8px' }} value={msgForm.to_stakeholder} onChange={e => setMsgForm(f => ({...f, to_stakeholder:e.target.value}))}>
                  <option value="">Select Agency</option>
                  {stakeholders.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Classification</label>
                <select style={{ ...selectStyle, width:'100%', padding:'8px' }} value={msgForm.classification} onChange={e => setMsgForm(f => ({...f, classification:e.target.value}))}>
                  {['TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Subject</label>
                <input required style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-mono)', outline:'none' }}
                  value={msgForm.subject} onChange={e => setMsgForm(f => ({...f, subject:e.target.value}))} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', fontFamily:'var(--font-mono)', letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'4px', textTransform:'uppercase' }}>Message</label>
                <textarea required rows={5} style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'4px', padding:'8px', color:'var(--text)', fontSize:'12px', fontFamily:'var(--font-body)', lineHeight:1.7, outline:'none', resize:'vertical' }}
                  value={msgForm.body} onChange={e => setMsgForm(f => ({...f, body:e.target.value}))} />
              </div>
              <Btn type="submit" style={{ width:'100%' }}>TRANSMIT MESSAGE</Btn>
            </form>
          </Modal>
        )}
      </div>
    </Shell>
  );
}
