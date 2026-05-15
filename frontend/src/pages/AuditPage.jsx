import { useState, useEffect, useCallback } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMobile } from '../hooks/useMobile';
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import api from '../api/axios';

const PAGE_SIZE = 50;

const ACTION_META = (action = '') => {
  const a = action.toUpperCase();
  if (a.includes('FAIL') || a.includes('INVALID') || a.includes('DENIED') || a.includes('BLOCK'))
    return { color:'#d63a3a', label:'FAILURE', bg:'rgba(214,58,58,0.1)' };
  if (a.includes('LOGIN'))
    return { color:'#00e676', label:'LOGIN',   bg:'rgba(0,230,118,0.08)' };
  if (a.includes('LOGOUT'))
    return { color:'#8db8a0', label:'LOGOUT',  bg:'transparent' };
  if (a.includes('CREATE') || a.includes('REGISTER'))
    return { color:'#2a7fd4', label:'CREATE',  bg:'rgba(42,127,212,0.08)' };
  if (a.includes('UPDATE') || a.includes('EDIT') || a.includes('RESET') || a.includes('CHANGE'))
    return { color:'#e0981a', label:'UPDATE',  bg:'rgba(224,152,26,0.08)' };
  if (a.includes('DELETE') || a.includes('SUSPEND') || a.includes('REMOVE'))
    return { color:'#d63a3a', label:'DELETE',  bg:'rgba(214,58,58,0.08)' };
  if (a.includes('VIEW') || a.includes('GET') || a.includes('ACCESS'))
    return { color:'#8db8a0', label:'ACCESS',  bg:'transparent' };
  return { color:'#5a7a68', label:'EVENT', bg:'transparent' };
};

function exportCSV(logs) {
  const headers = ['Timestamp','Officer ID','Action','IP Address'];
  const rows = logs.map(l => [
    new Date(l.created_at).toISOString(),
    l.officer_id || '',
    `"${(l.action || '').replace(/"/g,'""')}"`,
    l.ip_address || '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `esnsa-audit-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const mobile = useMobile();
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);

  /* Filters */
  const [search,    setSearch]    = useState('');
  const [filterUser,setFilterUser]= useState('');
  const [filterDate,setFilterDate]= useState('');
  const [users,     setUsers]     = useState([]); // for dropdown

  /* Load officers list once */
  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit',  PAGE_SIZE);
    params.set('offset', page * PAGE_SIZE);
    if (search)     params.set('action',  search);
    if (filterUser) params.set('user_id', filterUser);
    api.get(`/audit?${params}`)
      .then(r => {
        let rows = r.data;
        /* Client-side date filter (if set) */
        if (filterDate) {
          const d = new Date(filterDate);
          const next = new Date(d); next.setDate(next.getDate()+1);
          rows = rows.filter(l => {
            const t = new Date(l.created_at);
            return t >= d && t < next;
          });
        }
        setLogs(rows);
        setTotal(r.data.length + page * PAGE_SIZE); // rough
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, filterUser, filterDate]);

  useEffect(() => { load(); }, [load]);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(); }, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const failCount  = logs.filter(l => ACTION_META(l.action).label === 'FAILURE').length;
  const loginCount = logs.filter(l => ACTION_META(l.action).label === 'LOGIN').length;

  const inputSt = {
    background:'var(--bg)', border:'1px solid var(--border-bright)',
    color:'#ffffff', borderRadius:'5px', fontFamily:'var(--font-mono)',
    fontSize:'12px', outline:'none', padding:'8px 12px',
  };

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
          <SectionHeader title="Access Audit Log" subtitle="SYSTEM ACCESS & ACTION RECORD" />
          <button onClick={() => exportCSV(logs)} style={{
            background:'none', border:'1px solid var(--border-bright)', borderRadius:'5px',
            color:'var(--text-dim)', cursor:'pointer', padding:'7px 12px',
            display:'flex', alignItems:'center', gap:'6px',
            fontFamily:'var(--font-mono)', fontSize:'11px', letterSpacing:'1px',
          }}>
            <Download size={13}/> EXPORT CSV
          </button>
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center' }}>
          {/* Action search */}
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:'160px' }}>
            <Search size={13} color="var(--text-dim)"
              style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)' }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search action..."
              style={{ ...inputSt, width:'100%', paddingLeft:'30px', boxSizing:'border-box' }}/>
          </div>
          {/* Officer filter */}
          <select value={filterUser} onChange={e=>{ setFilterUser(e.target.value); setPage(0); }}
            style={{ ...inputSt, flex:'1 1 160px', minWidth:'130px' }}>
            <option value="">All Officers</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.officer_id} · {u.name}</option>)}
          </select>
          {/* Date filter */}
          <input type="date" value={filterDate} onChange={e=>{ setFilterDate(e.target.value); setPage(0); }}
            style={{ ...inputSt, colorScheme:'dark', flex:'1 1 140px', minWidth:'130px' }}/>
          {/* Clear */}
          {(search||filterUser||filterDate) && (
            <button onClick={()=>{ setSearch(''); setFilterUser(''); setFilterDate(''); setPage(0); }}
              style={{ background:'none', border:'1px solid var(--border-bright)', borderRadius:'5px',
                color:'var(--red)', cursor:'pointer', padding:'7px 12px',
                fontFamily:'var(--font-mono)', fontSize:'11px', letterSpacing:'1px', whiteSpace:'nowrap' }}>
              ✕ CLEAR
            </button>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'12px', flexWrap:'wrap' }}>
          {[
            { label:'Shown',   value:logs.length,  color:'var(--accent)' },
            { label:'Logins',  value:loginCount,   color:'var(--green)' },
            { label:'Failures',value:failCount,    color: failCount > 0 ? 'var(--red)' : 'var(--text-dim)' },
          ].map(({ label, value, color }) => (
            <span key={label} style={{ fontSize:'11px', fontFamily:'var(--font-mono)' }}>
              <span style={{ color, fontWeight:'700' }}>{value}</span>
              <span style={{ color:'var(--text-dim)', marginLeft:'4px' }}>{label}</span>
            </span>
          ))}
        </div>

        <Panel title="AUDIT TRAIL"
          badge={<span style={{ fontSize:'10px', fontWeight:'600', color:'var(--text-dim)',
            fontFamily:'var(--font-mono)' }}>PAGE {page+1}</span>}>
          {loading ? (
            <LoadingSpinner label="LOADING AUDIT..." />
          ) : logs.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px' }}>
              NO AUDIT RECORDS MATCH FILTERS
            </div>
          ) : logs.map(log => {
            const meta = ACTION_META(log.action);
            return (
              <div key={log.id} style={{
                padding: mobile ? '10px 12px' : '10px 14px',
                borderBottom:'1px solid var(--border)',
                background: meta.bg,
                display:'flex', gap:'10px', alignItems:'flex-start',
                flexWrap: mobile ? 'wrap' : 'nowrap',
              }}>
                {/* Color indicator */}
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:meta.color,
                  flexShrink:0, marginTop:'5px', boxShadow:`0 0 5px ${meta.color}66` }}/>

                {/* Timestamp */}
                <span style={{ fontSize:'11px', color:'var(--text-dim)', flexShrink:0,
                  fontFamily:'var(--font-mono)', width: mobile ? '100%' : '150px' }}>
                  {new Date(log.created_at).toLocaleString()}
                </span>

                {/* Officer */}
                <span style={{ fontSize:'12px', fontWeight:'700', color:'var(--accent)',
                  fontFamily:'var(--font-mono)', flexShrink:0, letterSpacing:'0.5px',
                  width: mobile ? 'auto' : '72px' }}>
                  {log.officer_id || '—'}
                </span>

                {/* Action type badge */}
                <span style={{
                  background: `${meta.color}18`, color: meta.color,
                  border: `1px solid ${meta.color}44`, borderRadius:'3px',
                  padding:'1px 7px', fontSize:'9px', fontFamily:'var(--font-mono)',
                  letterSpacing:'1px', flexShrink:0, alignSelf:'center', whiteSpace:'nowrap',
                }}>{meta.label}</span>

                {/* Action text */}
                <span style={{ flex:1, fontSize:'12px', color:'#e8f5ee', lineHeight:1.5, minWidth:0 }}>
                  {log.action}
                </span>

                {/* IP */}
                {!mobile && (
                  <span style={{ fontSize:'11px', color:'var(--text-dim)', flexShrink:0,
                    fontFamily:'var(--font-mono)', textAlign:'right' }}>
                    {log.ip_address || '—'}
                  </span>
                )}
              </div>
            );
          })}
        </Panel>

        {/* Pagination */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          marginTop:'12px', padding:'0 4px' }}>
          <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
            style={{ background:'none', border:'1px solid var(--border-bright)', borderRadius:'5px',
              color: page===0 ? 'var(--text-dim)' : 'var(--accent)',
              cursor: page===0 ? 'default' : 'pointer', padding:'7px 14px',
              display:'flex', alignItems:'center', gap:'6px',
              fontFamily:'var(--font-mono)', fontSize:'11px', letterSpacing:'1px',
              opacity: page===0 ? 0.4 : 1,
            }}>
            <ChevronLeft size={14}/> PREV
          </button>
          <span style={{ fontSize:'11px', color:'var(--text-dim)', fontFamily:'var(--font-mono)' }}>
            Showing {page*PAGE_SIZE+1}–{page*PAGE_SIZE+logs.length}
          </span>
          <button onClick={() => setPage(p => p+1)} disabled={logs.length < PAGE_SIZE}
            style={{ background:'none', border:'1px solid var(--border-bright)', borderRadius:'5px',
              color: logs.length < PAGE_SIZE ? 'var(--text-dim)' : 'var(--accent)',
              cursor: logs.length < PAGE_SIZE ? 'default' : 'pointer', padding:'7px 14px',
              display:'flex', alignItems:'center', gap:'6px',
              fontFamily:'var(--font-mono)', fontSize:'11px', letterSpacing:'1px',
              opacity: logs.length < PAGE_SIZE ? 0.4 : 1,
            }}>
            NEXT <ChevronRight size={14}/>
          </button>
        </div>
      </div>
    </Shell>
  );
}
