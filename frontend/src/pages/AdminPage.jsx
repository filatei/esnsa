import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '../components/Shell';
import Panel from '../components/Panel';
import Tag from '../components/Tag';
import LoadingSpinner from '../components/LoadingSpinner';
import { useMobile } from '../hooks/useMobile';
import { Users, ScrollText, ShieldCheck, UserCheck, UserX, Activity, AlertTriangle, LogIn } from 'lucide-react';
import api from '../api/axios';

const ACTION_COLOR = (action = '') => {
  const a = action.toUpperCase();
  if (a.includes('FAIL') || a.includes('INVALID') || a.includes('DENIED')) return '#d63a3a';
  if (a.includes('LOGIN'))   return '#00e676';
  if (a.includes('LOGOUT'))  return '#8db8a0';
  if (a.includes('CREATE'))  return '#2a7fd4';
  if (a.includes('UPDATE') || a.includes('RESET')) return '#e0981a';
  if (a.includes('DELETE') || a.includes('SUSPEND')) return '#d63a3a';
  return '#8db8a0';
};

function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)', onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && onClick ? 'var(--panel-hover)' : 'var(--panel)',
        border: `1px solid var(--border)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '8px', padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px',
          color: 'var(--text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '28px', fontFamily: 'var(--font-mono)', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '5px' }}>{sub}</div>}
    </div>
  );
}

function RoleBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{count} · {pct}%</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px',
          boxShadow: `0 0 8px ${color}66`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const mobile   = useMobile();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      api.get('/users/stats').then(r => setStats(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Shell><LoadingSpinner label="LOADING ADMIN PANEL..." /></Shell>;

  const total = parseInt(stats?.total || 0);

  return (
    <Shell>
      <div className="fade-in">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800',
            letterSpacing: '3px', color: '#ffffff', textTransform: 'uppercase' }}>
            Admin Control Panel
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1.5px',
            color: 'var(--text-dim)', marginTop: '4px' }}>
            USER PRIVILEGES · ACCESS LOGS · SYSTEM OVERSIGHT
          </div>
        </div>

        {/* Stat cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(160px,1fr))',
          gap: mobile ? '8px' : '12px', marginBottom: mobile ? '12px' : '16px',
        }}>
          <StatCard icon={Users}     label="Total Personnel" value={total}
            sub={`${stats?.active} active · ${stats?.suspended || 0} suspended`}
            color="var(--accent)" onClick={() => navigate('/admin/users')} />
          <StatCard icon={UserCheck} label="Active Accounts"  value={stats?.active || 0}
            sub="Currently enabled"    color="var(--green)"  onClick={() => navigate('/admin/users')} />
          <StatCard icon={LogIn}     label="Logins Today"     value={stats?.logins_today || 0}
            sub="Last 24 hours"        color="var(--blue)"   onClick={() => navigate('/admin/audit')} />
          <StatCard icon={AlertTriangle} label="Auth Failures" value={stats?.failed_today || 0}
            sub="Last 24 hours"        color={parseInt(stats?.failed_today) > 3 ? 'var(--red)' : 'var(--yellow)'}
            onClick={() => navigate('/admin/audit')} />
          <StatCard icon={Activity}  label="Events Today"     value={stats?.events_today || 0}
            sub="All actions logged"   color="var(--accent)"  onClick={() => navigate('/admin/audit')} />
          <StatCard icon={UserX}     label="Suspended"        value={stats?.suspended || 0}
            sub="Blocked access"       color={parseInt(stats?.suspended) > 0 ? 'var(--red)' : 'var(--text-dim)'}
            onClick={() => navigate('/admin/users')} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : '1fr 1fr',
          gap: mobile ? '12px' : '16px',
        }}>
          {/* Role distribution */}
          <Panel title="PERSONNEL BY ROLE"
            headerActions={
              <button onClick={() => navigate('/admin/users')} style={{
                background: 'none', border: '1px solid var(--border-bright)', borderRadius: '4px',
                color: 'var(--text-dim)', cursor: 'pointer', fontSize: '10px',
                fontFamily: 'var(--font-mono)', letterSpacing: '1.5px', padding: '3px 9px',
              }}>MANAGE →</button>
            }>
            <div style={{ padding: '16px' }}>
              {[
                { label: 'DIRECTOR',  key: 'directors',  color: '#00c853' },
                { label: 'ADMIN',     key: 'admins',     color: '#2a7fd4' },
                { label: 'ANALYST',   key: 'analysts',   color: '#e0981a' },
                { label: 'OFFICER',   key: 'officers',   color: '#8db8a0' },
                { label: 'LIAISON',   key: 'liaisons',   color: '#4a6a58' },
              ].map(({ label, key, color }) => (
                <RoleBar key={key} label={label}
                  count={parseInt(stats?.[key] || 0)}
                  total={total} color={color} />
              ))}

              {/* Legend chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                {[
                  { role: 'DIRECTOR', desc: 'Full access, AI brief, all admin functions' },
                  { role: 'ADMIN',    desc: 'User management, audit log access' },
                  { role: 'ANALYST',  desc: 'Intel, threats, AI brief, reports' },
                  { role: 'OFFICER',  desc: 'Operational read/write access' },
                  { role: 'LIAISON',  desc: 'Agency communications only' },
                ].map(({ role, desc }) => (
                  <div key={role} title={desc} style={{ display: 'flex', alignItems: 'center', gap: '5px',
                    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px',
                    padding: '4px 8px', cursor: 'default' }}>
                    <Tag value={role} />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* Recent activity */}
          <Panel title="RECENT SYSTEM ACTIVITY"
            badge={<span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)' }}>LIVE</span>}
            headerActions={
              <button onClick={() => navigate('/admin/audit')} style={{
                background: 'none', border: '1px solid var(--border-bright)', borderRadius: '4px',
                color: 'var(--text-dim)', cursor: 'pointer', fontSize: '10px',
                fontFamily: 'var(--font-mono)', letterSpacing: '1.5px', padding: '3px 9px',
              }}>FULL LOG →</button>
            }>
            {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '11px' }}>
                NO RECENT ACTIVITY
              </div>
            ) : stats.recent_activity.map(log => {
              const color = ACTION_COLOR(log.action);
              return (
                <div key={log.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color,
                    flexShrink: 0, marginTop: '5px', boxShadow: `0 0 5px ${color}` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color, fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {log.officer_id || 'SYSTEM'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#ffffff', flex: 1 }}>{log.action}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)' }}>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      {log.ip_address && <span>· {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </Panel>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <button onClick={() => navigate('/admin/users')} style={{
            background: 'rgba(0,230,118,0.06)', border: '1px solid var(--border-bright)',
            borderRadius: '8px', padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.12)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,230,118,0.06)'; e.currentTarget.style.borderColor = 'var(--border-bright)'; }}>
            <ShieldCheck size={28} color="var(--accent)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff',
                fontFamily: 'var(--font-display)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                User Privilege Management
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                Create accounts · Assign roles · Suspend access · Reset passwords
              </div>
            </div>
          </button>
          <button onClick={() => navigate('/admin/audit')} style={{
            background: 'rgba(42,127,212,0.06)', border: '1px solid var(--border-bright)',
            borderRadius: '8px', padding: '18px 20px', cursor: 'pointer', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(42,127,212,0.12)'; e.currentTarget.style.borderColor = 'var(--blue)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(42,127,212,0.06)'; e.currentTarget.style.borderColor = 'var(--border-bright)'; }}>
            <ScrollText size={28} color="var(--blue)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff',
                fontFamily: 'var(--font-display)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                Access Audit Log
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '3px' }}>
                Search by user · Filter by action · Date range · Export records
              </div>
            </div>
          </button>
        </div>
      </div>
    </Shell>
  );
}
