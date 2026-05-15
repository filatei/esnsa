import { useState, useEffect } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import Btn from '../components/Btn';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';

export default function UsersPage() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Shell><LoadingSpinner /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <SectionHeader title="User Management" subtitle="AUTHORISED PERSONNEL REGISTRY" />
        <Panel title="USERS">
          {users.map(u => (
            <div key={u.id} style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', gap:'12px', alignItems:'center' }}>
              <span style={{ color:'var(--accent)', fontFamily:'var(--font-mono)', fontSize:'12px', width:'70px', flexShrink:0 }}>{u.officer_id}</span>
              <span style={{ flex:1, color:'var(--text-bright)', fontSize:'12px' }}>{u.name}</span>
              <Tag value={u.role} />
              <Tag value={u.clearance} />
              <Tag value={u.is_active ? 'ACTIVE' : 'INACTIVE'} />
              <span style={{ fontSize:'9px', color:'var(--text-dim)', minWidth:'120px' }}>
                {u.last_login ? `Last: ${new Date(u.last_login).toLocaleDateString()}` : 'Never logged in'}
              </span>
            </div>
          ))}
        </Panel>
      </div>
    </Shell>
  );
}
