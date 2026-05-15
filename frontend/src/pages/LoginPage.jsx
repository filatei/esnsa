import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [officerId, setOfficerId] = useState('');
  const [password,  setPassword]  = useState('');
  const [status,    setStatus]    = useState('idle'); // idle | verifying | granted | failed
  const [error,     setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('verifying');
    setError('');
    try {
      await login(officerId, password);
      setStatus('granted');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-bright)',
    borderRadius:'4px', padding:'12px 14px', color:'var(--text-bright)', fontSize:'13px',
    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box',
    letterSpacing:'2px',
  };

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', position:'relative', overflow:'hidden',
    }}>
      {/* Scanline */}
      <div style={{
        position:'absolute', left:0, right:0, height:'3px', pointerEvents:'none',
        background:'linear-gradient(to bottom, transparent, rgba(0,200,83,0.08), transparent)',
        animation:'scandown 4s linear infinite',
      }} />

      {/* Grid background */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.07, pointerEvents:'none' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${i*3.5}%`} x2="100%" y2={`${i*3.5}%`} stroke="#2a3a52" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 40 }, (_, i) => (
          <line key={`v${i}`} x1={`${i*2.5}%`} y1="0" x2={`${i*2.5}%`} y2="100%" stroke="#2a3a52" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Corner brackets */}
      {[{top:20,left:20}, {top:20,right:20}, {bottom:20,left:20}, {bottom:20,right:20}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:'20px', height:'20px',
          borderTop: i < 2 ? '2px solid var(--accent-dim)' : 'none',
          borderBottom: i >= 2 ? '2px solid var(--accent-dim)' : 'none',
          borderLeft: (i===0||i===2) ? '2px solid var(--accent-dim)' : 'none',
          borderRight: (i===1||i===3) ? '2px solid var(--accent-dim)' : 'none',
          ...pos,
        }} />
      ))}

      <div style={{ width:'100%', maxWidth:'400px', animation:'fadeIn 0.4s ease' }}>
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{
            width:'64px', height:'64px', borderRadius:'50%',
            background:'rgba(0,200,83,0.12)', border:'2px solid var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', fontSize:'28px', color:'var(--accent)',
            boxShadow:'0 0 30px rgba(0,200,83,0.15)',
          }}>⬡</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'4px', color:'var(--text-bright)', textTransform:'uppercase', lineHeight:1.6 }}>
            Office of the National Security Adviser
          </div>
          <div style={{ fontSize:'9px', letterSpacing:'3px', color:'var(--text-dim)', textTransform:'uppercase', marginTop:'4px' }}>
            Directorate of Energy Security
          </div>
          <div style={{ fontSize:'9px', letterSpacing:'2px', color:'var(--accent-dim)', marginTop:'8px' }}>
            RESTRICTED SYSTEM · AUTHORISED ACCESS ONLY
          </div>
        </div>

        {/* Form */}
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden' }}>
          <div style={{ background:'var(--header)', borderBottom:'1px solid var(--border)', padding:'10px 16px' }}>
            <span style={{ fontSize:'9px', letterSpacing:'3px', color:'var(--text-dim)', textTransform:'uppercase' }}>
              AUTHENTICATION REQUIRED
            </span>
          </div>
          <form onSubmit={handleSubmit} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
            <div>
              <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'6px', textTransform:'uppercase' }}>Officer ID</label>
              <input
                style={inputStyle}
                value={officerId}
                onChange={e => setOfficerId(e.target.value.toUpperCase())}
                placeholder="DIR001"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'6px', textTransform:'uppercase' }}>Access Code</label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.4)', borderRadius:'4px', padding:'10px 12px', fontSize:'11px', color:'var(--red)', letterSpacing:'1px' }}>
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'verifying' || status === 'granted'}
              style={{
                background: status === 'granted' ? 'rgba(31,186,104,0.15)' : status === 'failed' ? 'rgba(214,58,58,0.15)' : 'rgba(0,200,83,0.12)',
                border: `1px solid ${status === 'granted' ? 'var(--green)' : status === 'failed' ? 'var(--red)' : 'var(--accent)'}`,
                borderRadius:'4px', padding:'13px', width:'100%',
                color: status === 'granted' ? 'var(--green)' : status === 'failed' ? 'var(--red)' : 'var(--accent)',
                fontSize:'11px', fontFamily:'var(--font-mono)', letterSpacing:'3px',
                cursor: status === 'verifying' ? 'wait' : 'pointer', transition:'all 0.2s',
              }}
            >
              {status === 'verifying' ? 'VERIFYING...' : status === 'granted' ? 'ACCESS GRANTED' : status === 'failed' ? 'AUTHENTICATION FAILED' : 'AUTHENTICATE'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop:'16px', background:'rgba(26,34,50,0.5)', border:'1px solid var(--border)', borderRadius:'6px', padding:'12px 14px' }}>
          <div style={{ fontSize:'8px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'8px', textTransform:'uppercase' }}>Demo Credentials</div>
          {[
            { id:'DIR001', pwd:'onsa2026', role:'DIRECTOR' },
            { id:'ANL002', pwd:'analyst',  role:'ANALYST' },
            { id:'OPS003', pwd:'ops123',   role:'OFFICER' },
          ].map(c => (
            <div key={c.id} style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'4px', cursor:'pointer' }}
              onClick={() => { setOfficerId(c.id); setPassword(c.pwd); }}>
              <span style={{ fontSize:'10px', color:'var(--accent)', width:'60px' }}>{c.id}</span>
              <span style={{ fontSize:'10px', color:'var(--text-dim)' }}>{c.pwd}</span>
              <span style={{ fontSize:'8px', color:'var(--text-dim)', marginLeft:'auto' }}>{c.role}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:'16px', fontSize:'8px', color:'var(--text-dim)', letterSpacing:'1px' }}>
          esnsa.torama.money · ONSA/ES/OPS · CLASSIFIED
        </div>
      </div>
    </div>
  );
}
