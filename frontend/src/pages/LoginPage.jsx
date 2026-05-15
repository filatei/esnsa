import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, KeyRound } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../api/axios';

export default function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate  = useNavigate();

  const [authMode,   setAuthMode]   = useState('password'); // 'password' | 'biometric'
  const [officerId,  setOfficerId]  = useState('');
  const [password,   setPassword]   = useState('');
  const [status,     setStatus]     = useState('idle');  // idle|verifying|granted|failed
  const [error,      setError]      = useState('');
  const [showBioReg, setShowBioReg] = useState(false);

  const biometricAvailable = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  /* ── Styles ── */
  const inputStyle = {
    width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-bright)',
    borderRadius:'4px', padding:'12px 14px', color:'#ffffff', fontSize:'13px',
    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box', letterSpacing:'2px',
  };

  const btnBase = (s) => ({
    border:`1px solid ${s==='granted'?'var(--green)':s==='failed'?'var(--red)':'var(--accent)'}`,
    background: s==='granted'?'rgba(0,200,83,0.15)':s==='failed'?'rgba(214,58,58,0.15)':'rgba(0,200,83,0.12)',
    color: s==='granted'?'var(--green)':s==='failed'?'var(--red)':'var(--accent)',
    borderRadius:'4px', padding:'14px', width:'100%',
    fontSize:'11px', fontFamily:'var(--font-mono)', letterSpacing:'3px',
    cursor:(s==='verifying'||s==='granted')?'wait':'pointer', transition:'all 0.2s',
    display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
  });

  /* ── Password login ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatus('verifying'); setError('');
    try {
      await login(officerId, password);
      setStatus('granted');
      if (biometricAvailable) {
        setShowBioReg(true);           // offer Face ID registration
      } else {
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  /* ── Register biometric (post-password-login) ── */
  const handleRegisterBiometric = async () => {
    try {
      const optRes = await api.post('/auth/webauthn/register-options');
      const attResp = await startRegistration(optRes.data);
      await api.post('/auth/webauthn/register', attResp);
    } catch (_) {
      // user cancelled or device doesn't support it — that's fine
    }
    navigate('/dashboard');
  };

  /* ── Biometric login ── */
  const handleBiometricLogin = async () => {
    if (!officerId.trim()) { setError('ENTER OFFICER ID FIRST'); return; }
    setStatus('verifying'); setError('');
    try {
      const optRes = await api.post('/auth/webauthn/authenticate-options', { officer_id: officerId });
      const assertion = await startAuthentication(optRes.data);
      const authRes  = await api.post('/auth/webauthn/authenticate', { officer_id: officerId, ...assertion });
      loginWithToken(authRes.data.token, authRes.data.user);
      setStatus('granted');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setStatus('failed');
      const raw = err.response?.data?.error || err.message || '';
      setError(raw.includes('timed out') || raw.includes('not allowed')
        ? 'BIOMETRIC CANCELLED OR UNAVAILABLE'
        : raw || 'BIOMETRIC AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  /* ── Post-login biometric registration prompt ── */
  if (showBioReg) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ width:'100%', maxWidth:'400px', animation:'fadeIn 0.4s ease' }}>
          <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px', padding:'36px', textAlign:'center' }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:'rgba(0,200,83,0.12)', border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 30px rgba(0,200,83,0.2)' }}>
              <Fingerprint size={32} color='var(--accent)' />
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'13px', letterSpacing:'2px', color:'#ffffff', marginBottom:'10px', textTransform:'uppercase' }}>
              Enable Biometric Login
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-dim)', letterSpacing:'1px', marginBottom:'28px', lineHeight:1.7 }}>
              Register Face ID, Touch ID or Windows Hello for faster, passwordless access in future sessions.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button onClick={handleRegisterBiometric} style={btnBase('idle')}>
                <Fingerprint size={16} /> REGISTER FACE ID
              </button>
              <button onClick={() => navigate('/dashboard')} style={{
                background:'transparent', border:'1px solid var(--border)', borderRadius:'4px',
                color:'var(--text-dim)', padding:'12px', fontFamily:'var(--font-mono)',
                fontSize:'10px', letterSpacing:'2px', cursor:'pointer',
              }}>
                SKIP FOR NOW
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main login page ── */
  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'20px', position:'relative', overflow:'hidden',
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
      {[{top:20,left:20},{top:20,right:20},{bottom:20,left:20},{bottom:20,right:20}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:'20px', height:'20px', pointerEvents:'none',
          borderTop:    i < 2  ? '2px solid var(--accent-dim)' : 'none',
          borderBottom: i >= 2 ? '2px solid var(--accent-dim)' : 'none',
          borderLeft:   (i===0||i===2) ? '2px solid var(--accent-dim)' : 'none',
          borderRight:  (i===1||i===3) ? '2px solid var(--accent-dim)' : 'none',
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
          <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'4px', color:'#ffffff', textTransform:'uppercase', lineHeight:1.6 }}>
            Office of the National Security Adviser
          </div>
          <div style={{ fontSize:'9px', letterSpacing:'3px', color:'var(--text-dim)', textTransform:'uppercase', marginTop:'4px' }}>
            Directorate of Energy Security
          </div>
          <div style={{ fontSize:'9px', letterSpacing:'2px', color:'var(--accent-dim)', marginTop:'8px' }}>
            RESTRICTED SYSTEM · AUTHORISED ACCESS ONLY
          </div>
        </div>

        {/* Form panel */}
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'8px', overflow:'hidden' }}>

          {/* Panel header + mode tabs */}
          <div style={{ background:'var(--header)', borderBottom:'1px solid var(--border)', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'9px', letterSpacing:'3px', color:'var(--text-dim)', textTransform:'uppercase' }}>
              AUTHENTICATION REQUIRED
            </span>
            {biometricAvailable && (
              <div style={{ display:'flex', gap:'4px' }}>
                {[['password','PASSWORD', KeyRound], ['biometric','FACE ID', Fingerprint]].map(([mode, label, Icon]) => (
                  <button key={mode} onClick={() => { setAuthMode(mode); setError(''); setStatus('idle'); }} style={{
                    background: authMode===mode ? 'rgba(0,200,83,0.15)' : 'transparent',
                    border: `1px solid ${authMode===mode ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius:'3px', padding:'3px 8px', cursor:'pointer',
                    color: authMode===mode ? 'var(--accent)' : 'var(--text-dim)',
                    fontSize:'8px', fontFamily:'var(--font-mono)', letterSpacing:'1px',
                    display:'flex', alignItems:'center', gap:'3px',
                  }}>
                    <Icon size={9}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Officer ID - shared */}
          <div style={{ padding:'20px 24px 0' }}>
            <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'6px', textTransform:'uppercase' }}>Officer ID</label>
            <input
              style={inputStyle}
              value={officerId}
              onChange={e => setOfficerId(e.target.value.toUpperCase())}
              placeholder="DIR001"
              autoComplete="username"
            />
          </div>

          {/* Password mode */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} style={{ padding:'16px 24px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
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
              <button type="submit" disabled={status==='verifying'||status==='granted'} style={btnBase(status)}>
                {status==='verifying'?'VERIFYING...':status==='granted'?'ACCESS GRANTED':status==='failed'?'AUTHENTICATION FAILED':'AUTHENTICATE'}
              </button>
            </form>
          ) : (
            /* Biometric mode */
            <div style={{ padding:'16px 24px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.4)', borderRadius:'4px', padding:'10px 12px', fontSize:'11px', color:'var(--red)', letterSpacing:'1px' }}>
                  ⚠ {error}
                </div>
              )}
              <button onClick={handleBiometricLogin} disabled={status==='verifying'||status==='granted'} style={{...btnBase(status), padding:'18px'}}>
                <Fingerprint size={20}/>
                {status==='verifying'?'VERIFYING...':status==='granted'?'ACCESS GRANTED':status==='failed'?'BIOMETRIC FAILED':'AUTHENTICATE WITH FACE ID'}
              </button>
              <div style={{ textAlign:'center', fontSize:'9px', color:'var(--text-dim)', letterSpacing:'1px' }}>
                Uses Face ID · Touch ID · Windows Hello
              </div>
            </div>
          )}
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop:'16px', background:'rgba(12,16,24,0.8)', border:'1px solid var(--border)', borderRadius:'6px', padding:'12px 14px' }}>
          <div style={{ fontSize:'8px', letterSpacing:'2px', color:'var(--text-dim)', marginBottom:'8px', textTransform:'uppercase' }}>Demo Credentials</div>
          {[
            { id:'DIR001', pwd:'onsa2026', role:'DIRECTOR' },
            { id:'ANL002', pwd:'analyst',  role:'ANALYST' },
            { id:'OPS003', pwd:'ops123',   role:'OFFICER' },
          ].map(c => (
            <div key={c.id}
              style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'4px', cursor:'pointer' }}
              onClick={() => { setOfficerId(c.id); setPassword(c.pwd); setAuthMode('password'); }}>
              <span style={{ fontSize:'10px', color:'var(--accent)', width:'60px' }}>{c.id}</span>
              <span style={{ fontSize:'10px', color:'#ffffff' }}>{c.pwd}</span>
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
