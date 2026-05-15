import { useState, useEffect, useCallback } from 'react';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import SectionHeader from '../components/SectionHeader';
import Tag from '../components/Tag';
import Btn from '../components/Btn';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMobile } from '../hooks/useMobile';
import { UserPlus, Pencil, KeyRound, Power, Search } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLES      = ['DIRECTOR','ADMIN','ANALYST','OFFICER','LIAISON'];
const CLEARANCES = ['TOP SECRET','SECRET','CONFIDENTIAL','RESTRICTED','UNCLASSIFIED'];

const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'600', letterSpacing:'1.5px',
  color:'var(--text-dim)', marginBottom:'7px', fontFamily:'var(--font-mono)',
  textTransform:'uppercase',
};
const inputStyle = (extra={}) => ({
  width:'100%', background:'var(--bg)', border:'1px solid var(--border)',
  borderRadius:'5px', padding:'10px 12px', color:'#ffffff',
  fontSize:'13px', fontFamily:'var(--font-mono)', outline:'none',
  boxSizing:'border-box', ...extra,
});
const selectStyle = {
  width:'100%', background:'var(--bg)', border:'1px solid var(--border)',
  color:'#ffffff', padding:'10px 12px', fontSize:'12px',
  fontFamily:'var(--font-mono)', borderRadius:'5px', outline:'none',
};

/* ─── Add User Modal ─────────────────────────────────── */
function AddUserModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ officer_id:'', name:'', role:'OFFICER', clearance:'RESTRICTED', password:'' });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api.post('/users', { ...form, officer_id: form.officer_id.toUpperCase() });
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || 'FAILED TO CREATE USER');
      setBusy(false);
    }
  };

  return (
    <Modal title="Create New Account" onClose={onClose} width="460px">
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={labelStyle}>Officer ID</label>
            <input style={inputStyle()} value={form.officer_id} required
              onChange={e=>set('officer_id',e.target.value)} placeholder="DIR002" />
          </div>
          <div>
            <label style={labelStyle}>Full Name</label>
            <input style={inputStyle()} value={form.name} required
              onChange={e=>set('name',e.target.value)} placeholder="Jane Adeyemi" />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={selectStyle} value={form.role} onChange={e=>set('role',e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Clearance</label>
            <select style={selectStyle} value={form.clearance} onChange={e=>set('clearance',e.target.value)}>
              {CLEARANCES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Initial Access Code</label>
          <input style={inputStyle()} type="password" value={form.password} required minLength={6}
            onChange={e=>set('password',e.target.value)} placeholder="Min. 6 characters" />
        </div>
        {err && <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.4)',
          borderRadius:'5px', padding:'10px 12px', fontSize:'11px', color:'#d63a3a',
          fontFamily:'var(--font-mono)' }}>⚠ {err}</div>}
        {/* Role permission hints */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:'6px', padding:'10px 12px' }}>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--text-dim)',
            fontFamily:'var(--font-mono)', letterSpacing:'1.5px', marginBottom:'6px' }}>ROLE PERMISSIONS</div>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', lineHeight:1.7 }}>
            {form.role === 'DIRECTOR' && '🔐 Full system access · AI brief · All admin functions'}
            {form.role === 'ADMIN'    && '⚙️ User management · Audit log · System config'}
            {form.role === 'ANALYST'  && '🔍 Intel · Threats · AI brief · Reports'}
            {form.role === 'OFFICER'  && '📋 Operational read/write · No admin functions'}
            {form.role === 'LIAISON'  && '📡 Agency communications only · Read-only ops'}
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px' }}>
          <Btn onClick={onClose} color="var(--text-dim)" size="small">CANCEL</Btn>
          <Btn type="submit" disabled={busy} color="var(--accent)">
            {busy ? 'CREATING...' : '+ CREATE ACCOUNT'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Edit User Modal ────────────────────────────────── */
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user.name, role: user.role, clearance: user.clearance, is_active: user.is_active });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api.put(`/users/${user.id}`, form);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.error || 'UPDATE FAILED');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Edit · ${user.officer_id}`} onClose={onClose} width="460px">
      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <div>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle()} value={form.name} onChange={e=>set('name',e.target.value)} required />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={labelStyle}>Role</label>
            <select style={selectStyle} value={form.role} onChange={e=>set('role',e.target.value)}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Clearance Level</label>
            <select style={selectStyle} value={form.clearance} onChange={e=>set('clearance',e.target.value)}>
              {CLEARANCES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        {/* Account status toggle */}
        <div style={{ background:'var(--bg)', border:'1px solid var(--border)',
          borderRadius:'6px', padding:'12px 14px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:'12px', fontWeight:'700', color:'#ffffff', marginBottom:'2px' }}>Account Access</div>
            <div style={{ fontSize:'11px', color:'var(--text-dim)' }}>
              {form.is_active ? 'Active — officer can log in' : 'Suspended — login blocked'}
            </div>
          </div>
          <button type="button" onClick={() => set('is_active', !form.is_active)} style={{
            background: form.is_active ? 'rgba(0,200,83,0.15)' : 'rgba(214,58,58,0.15)',
            border: `1px solid ${form.is_active ? 'var(--green)' : 'var(--red)'}`,
            borderRadius:'6px', padding:'8px 14px', cursor:'pointer',
            color: form.is_active ? 'var(--green)' : 'var(--red)',
            fontFamily:'var(--font-mono)', fontSize:'11px', fontWeight:'700', letterSpacing:'1.5px',
            display:'flex', alignItems:'center', gap:'6px',
          }}>
            <Power size={13}/>
            {form.is_active ? 'ACTIVE' : 'SUSPENDED'}
          </button>
        </div>
        {/* Permission change hint */}
        {form.role !== user.role && (
          <div style={{ background:'rgba(0,230,118,0.06)', border:'1px solid rgba(0,230,118,0.25)',
            borderRadius:'5px', padding:'9px 12px', fontSize:'11px', color:'var(--accent)',
            fontFamily:'var(--font-mono)' }}>
            ⚡ Role change: {user.role} → {form.role}. New permissions apply at next login.
          </div>
        )}
        {err && <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.4)',
          borderRadius:'5px', padding:'10px 12px', fontSize:'11px', color:'#d63a3a',
          fontFamily:'var(--font-mono)' }}>⚠ {err}</div>}
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px' }}>
          <Btn onClick={onClose} color="var(--text-dim)" size="small">CANCEL</Btn>
          <Btn type="submit" disabled={busy} color="var(--accent)">
            {busy ? 'SAVING...' : 'SAVE CHANGES'}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Reset Password Modal ───────────────────────────── */
function ResetPwModal({ user, onClose }) {
  const [pw,   setPw]   = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err,  setErr]  = useState('');

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api.put(`/users/${user.id}/reset-password`, { password: pw });
      setDone(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'RESET FAILED');
      setBusy(false);
    }
  };

  return (
    <Modal title={`Reset Code · ${user.officer_id}`} onClose={onClose} width="380px">
      {done ? (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:'32px', marginBottom:'10px' }}>✓</div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'var(--accent)',
            fontFamily:'var(--font-mono)', letterSpacing:'2px' }}>ACCESS CODE RESET</div>
          <div style={{ fontSize:'11px', color:'var(--text-dim)', marginTop:'6px' }}>
            Inform the officer of their new access code securely.
          </div>
          <div style={{ marginTop:'16px' }}>
            <Btn onClick={onClose} color="var(--accent)">CLOSE</Btn>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'12px', color:'var(--text-dim)', marginBottom:'4px' }}>
            Set a new access code for <strong style={{ color:'#fff' }}>{user.name}</strong>.
            This will invalidate all current sessions.
          </div>
          <div>
            <label style={labelStyle}>New Access Code</label>
            <input style={inputStyle()} type="password" value={pw} required minLength={6}
              onChange={e=>setPw(e.target.value)} placeholder="Min. 6 characters" />
          </div>
          {err && <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.4)',
            borderRadius:'5px', padding:'10px 12px', fontSize:'11px', color:'#d63a3a',
            fontFamily:'var(--font-mono)' }}>⚠ {err}</div>}
          <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end' }}>
            <Btn onClick={onClose} color="var(--text-dim)" size="small">CANCEL</Btn>
            <Btn type="submit" disabled={busy} color="var(--yellow)">
              {busy ? 'RESETTING...' : 'RESET CODE'}
            </Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* ─── Main ───────────────────────────────────────────── */
export default function UsersPage() {
  const { user: me } = useAuth();
  const mobile = useMobile();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null); // null | {type, user}

  const load = useCallback((q='') => {
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    api.get(`/users${params}`)
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const close = () => { setModal(null); load(search); };

  const activeCount    = users.filter(u => u.is_active).length;
  const suspendedCount = users.length - activeCount;

  if (loading) return <Shell><LoadingSpinner label="LOADING PERSONNEL..." /></Shell>;

  return (
    <Shell>
      <div className="fade-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
          <div>
            <SectionHeader title="User Management" subtitle="AUTHORISED PERSONNEL REGISTRY" />
            {/* Stats row */}
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', marginTop:'-6px' }}>
              {[
                { label:'Total',     value:users.length,    color:'var(--accent)' },
                { label:'Active',    value:activeCount,     color:'var(--green)' },
                { label:'Suspended', value:suspendedCount,  color: suspendedCount > 0 ? 'var(--red)' : 'var(--text-dim)' },
              ].map(({ label, value, color }) => (
                <span key={label} style={{ fontSize:'11px', fontFamily:'var(--font-mono)' }}>
                  <span style={{ color, fontWeight:'700' }}>{value}</span>
                  <span style={{ color:'var(--text-dim)', marginLeft:'4px' }}>{label}</span>
                </span>
              ))}
            </div>
          </div>
          <Btn onClick={() => setModal({ type:'add' })} color="var(--accent)">
            <UserPlus size={14} style={{ marginRight:'6px', verticalAlign:'middle' }} />
            NEW ACCOUNT
          </Btn>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:'12px', maxWidth:'340px' }}>
          <Search size={14} color="var(--text-dim)" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)' }} />
          <input
            value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search officer ID or name..."
            style={{ ...inputStyle({ paddingLeft:'34px', fontSize:'12px' }), border:'1px solid var(--border-bright)' }}
          />
        </div>

        <Panel title="PERSONNEL REGISTRY"
          badge={<span style={{ fontSize:'10px', fontWeight:'600', color:'var(--text-dim)',
            fontFamily:'var(--font-mono)' }}>{users.length} RECORDS</span>}>
          {users.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--text-dim)', fontSize:'11px' }}>
              NO PERSONNEL RECORDS MATCH QUERY
            </div>
          ) : users.map(u => (
            <div key={u.id} style={{
              padding: mobile ? '12px' : '12px 14px',
              borderBottom:'1px solid var(--border)',
              display:'flex', gap:'10px', alignItems:'center',
              flexWrap: mobile ? 'wrap' : 'nowrap',
              opacity: u.is_active ? 1 : 0.55,
            }}>
              {/* Status dot */}
              <div style={{ width:'7px', height:'7px', borderRadius:'50%', flexShrink:0,
                background: u.is_active ? 'var(--green)' : 'var(--red)',
                boxShadow: u.is_active ? '0 0 5px var(--green)' : '0 0 5px var(--red)',
              }} />

              {/* ID + Name */}
              <span style={{ color:'var(--accent)', fontFamily:'var(--font-mono)', fontSize:'12px',
                fontWeight:'700', width:'70px', flexShrink:0, letterSpacing:'1px' }}>
                {u.officer_id}
              </span>
              <span style={{ flex:1, color:'#ffffff', fontSize:'13px', fontWeight:'600',
                minWidth: mobile ? '100%' : 'auto' }}>
                {u.name}
              </span>

              {/* Tags */}
              <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', flexShrink:0 }}>
                <Tag value={u.role} />
                <Tag value={u.clearance} />
                {!u.is_active && <Tag value="SUSPENDED" />}
              </div>

              {/* Last login */}
              {!mobile && (
                <span style={{ fontSize:'11px', color:'var(--text-dim)', width:'130px',
                  flexShrink:0, fontFamily:'var(--font-mono)', textAlign:'right' }}>
                  {u.last_login
                    ? new Date(u.last_login).toLocaleDateString()
                    : 'Never'}
                </span>
              )}

              {/* Actions — only non-self */}
              {u.officer_id !== me?.officer_id && (
                <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                  <button onClick={() => setModal({ type:'edit', user:u })}
                    title="Edit privileges" style={{
                      background:'none', border:'1px solid var(--border-bright)', borderRadius:'4px',
                      color:'var(--accent)', cursor:'pointer', padding:'5px 8px',
                      display:'flex', alignItems:'center',
                    }}>
                    <Pencil size={12}/>
                  </button>
                  <button onClick={() => setModal({ type:'reset', user:u })}
                    title="Reset access code" style={{
                      background:'none', border:'1px solid var(--border-bright)', borderRadius:'4px',
                      color:'var(--yellow)', cursor:'pointer', padding:'5px 8px',
                      display:'flex', alignItems:'center',
                    }}>
                    <KeyRound size={12}/>
                  </button>
                </div>
              )}
            </div>
          ))}
        </Panel>
      </div>

      {modal?.type === 'add'   && <AddUserModal onClose={close} onSaved={close} />}
      {modal?.type === 'edit'  && <EditUserModal  user={modal.user} onClose={close} onSaved={close} />}
      {modal?.type === 'reset' && <ResetPwModal   user={modal.user} onClose={close} />}
    </Shell>
  );
}
