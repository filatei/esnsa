import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

export default function AuditPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit?limit=100').then(r => setLogs(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <SectionHeader title="Audit Log" subtitle="SYSTEM ACCESS & ACTION RECORD" />
        <Panel title="AUDIT TRAIL">
          {logs.map(log => (
            <div key={log.id} style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontSize:'11px', color:'var(--text-dim)', width:'150px', flexShrink:0 }}>{new Date(log.created_at).toLocaleString()}</span>
              <span style={{ color:'var(--accent)', fontSize:'10px', width:'70px', flexShrink:0 }}>{log.officer_id || '—'}</span>
              <span style={{ color:'var(--text-bright)', fontSize:'11px', flex:1 }}>{log.action}</span>
              <span style={{ fontSize:'11px', color:'var(--text-dim)' }}>{log.ip_address}</span>
            </div>
          ))}
          {logs.length === 0 && <div style={{ padding:'32px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px' }}>NO AUDIT RECORDS</div>}
        </Panel>
      </div>
    </Shell>
  );
}
