import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, KeyRound, ShieldCheck } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../api/axios';

export default function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate  = useNavigate();

  const [authMode,   setAuthMode]   = useState('password');
  const [officerId,  setOfficerId]  = useState('');
  const [password,   setPassword]   = useState('');
  const [status,     setStatus]     = useState('idle');
  const [error,      setError]      = useState('');
  const [showBioReg, setShowBioReg] = useState(false);

  const biometricAvailable = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  const btnColor = (s) =>
    s === 'granted' ? '#00e676' : s === 'failed' ? '#d63a3a' : '#00e676';
  const btnBg = (s) =>
    s === 'granted' ? 'rgba(0,230,118,0.18)' : s === 'failed' ? 'rgba(214,58,58,0.15)' : 'rgba(0,230,118,0.12)';

  /* ── Password login ── */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatus('verifying'); setError('');
    try {
      await login(officerId, password);
      setStatus('granted');
      if (biometricAvailable) { setShowBioReg(true); }
      else { setTimeout(() => navigate('/dashboard'), 1200); }
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  /* ── Register biometric post-login ── */
  const handleRegisterBiometric = async () => {
    try {
      const optRes = await api.post('/auth/webauthn/register-options');
      const attResp = await startRegistration(optRes.data);
      await api.post('/auth/webauthn/register', attResp);
    } catch (_) {}
    navigate('/dashboard');
  };

  /* ── Biometric login ── */
  const handleBiometricLogin = async () => {
    if (!officerId.trim()) { setError('ENTER OFFICER ID FIRST'); return; }
    setStatus('verifying'); setError('');
    try {
      const optRes   = await api.post('/auth/webauthn/authenticate-options', { officer_id: officerId });
      const assertion = await startAuthentication(optRes.data);
      const authRes  = await api.post('/auth/webauthn/authenticate', { officer_id: officerId, ...assertion });
      loginWithToken(authRes.data.token, authRes.data.user);
      setStatus('granted');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setStatus('failed');
      const raw = err.response?.data?.error || err.message || '';
      setError(raw.includes('timed out') || raw.includes('not allowed')
        ? 'BIOMETRIC CANCELLED OR UNAVAILABLE' : raw || 'BIOMETRIC AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  /* ── Face ID registration prompt ── */
  if (showBioReg) {
    return (
      <div style={{ minHeight:'100vh', background:'#030508', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ width:'100%', maxWidth:'420px', animation:'fadeIn 0.4s ease' }}>
          <div style={{
            background:'#080d0b', borderRadius:'12px', padding:'40px 36px',
            border:'1px solid #00e676',
            boxShadow:'0 0 40px rgba(0,230,118,0.2), 0 0 80px rgba(0,230,118,0.06)',
            textAlign:'center',
          }}>
            <div style={{
              width:'80px', height:'80px', borderRadius:'50%',
              background:'rgba(0,230,118,0.1)', border:'2px solid #00e676',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 24px',
              boxShadow:'0 0 30px rgba(0,230,118,0.35)',
            }}>
              <Fingerprint size={38} color='#00e676' />
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'14px', letterSpacing:'3px', color:'#ffffff', marginBottom:'10px', textTransform:'uppercase' }}>
              Enable Biometric Login
            </div>
            <div style={{ fontSize:'12px', color:'#7a9a88', letterSpacing:'1px', marginBottom:'32px', lineHeight:1.8 }}>
              Register Face ID, Touch ID or Windows Hello<br/>for passwordless access in future sessions.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <button onClick={handleRegisterBiometric} style={{
                background:'rgba(0,230,118,0.12)', border:'1px solid #00e676',
                borderRadius:'6px', padding:'16px', color:'#00e676',
                fontFamily:'var(--font-mono)', fontSize:'12px', letterSpacing:'3px',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                boxShadow:'0 0 16px rgba(0,230,118,0.2)',
              }}>
                <Fingerprint size={18} /> REGISTER FACE ID
              </button>
              <button onClick={() => navigate('/dashboard')} style={{
                background:'transparent', border:'1px solid #1a3d28',
                borderRadius:'6px', color:'#7a9a88', padding:'14px',
                fontFamily:'var(--font-mono)', fontSize:'10px', letterSpacing:'2px', cursor:'pointer',
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
      minHeight:'100vh', background:'#030508',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'20px', position:'relative', overflow:'hidden',
    }}>
      {/* Animated scanline */}
      <div style={{
        position:'absolute', left:0, right:0, height:'2px', pointerEvents:'none',
        background:'linear-gradient(to right, transparent, #00e676, transparent)',
        opacity:0.4, animation:'scandown 3s linear infinite',
      }} />

      {/* Grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06, pointerEvents:'none' }}>
        {Array.from({ length: 30 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${i*3.5}%`} x2="100%" y2={`${i*3.5}%`} stroke="#00e676" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 40 }, (_, i) => (
          <line key={`v${i}`} x1={`${i*2.5}%`} y1="0" x2={`${i*2.5}%`} y2="100%" stroke="#00e676" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Corner brackets */}
      {[{top:20,left:20},{top:20,right:20},{bottom:20,left:20},{bottom:20,right:20}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:'28px', height:'28px', pointerEvents:'none',
          borderTop:    i < 2  ? '2px solid #00c853' : 'none',
          borderBottom: i >= 2 ? '2px solid #00c853' : 'none',
          borderLeft:   (i===0||i===2) ? '2px solid #00c853' : 'none',
          borderRight:  (i===1||i===3) ? '2px solid #00c853' : 'none',
          ...pos,
        }} />
      ))}

      <div style={{ width:'100%', maxWidth:'420px', animation:'fadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'36px' }}>
          <div style={{
            width:'72px', height:'72px', borderRadius:'50%',
            background:'rgba(0,230,118,0.1)', border:'2px solid #00e676',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 20px', color:'#00e676',
            boxShadow:'0 0 30px rgba(0,230,118,0.4), 0 0 60px rgba(0,230,118,0.15)',
          }}>
            <ShieldCheck size={34} />
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'12px', letterSpacing:'4px', color:'#ffffff', textTransform:'uppercase', lineHeight:1.7 }}>
            Office of the National Security Adviser
          </div>
          <div style={{ fontSize:'10px', letterSpacing:'3px', color:'#7a9a88', textTransform:'uppercase', marginTop:'4px' }}>
            Directorate of Energy Security
          </div>
          <div style={{ fontSize:'9px', letterSpacing:'2px', color:'#00c853', marginTop:'10px', opacity:0.8 }}>
            ◈ RESTRICTED SYSTEM · AUTHORISED ACCESS ONLY ◈
          </div>
        </div>

        {/* Form panel */}
        <div style={{
          background:'#080d0b', border:'1px solid #1a3d28', borderRadius:'10px', overflow:'hidden',
          boxShadow:'0 0 40px rgba(0,230,118,0.08)',
        }}>
          {/* Panel header + mode tabs */}
          <div style={{
            background:'#060b08', borderBottom:'1px solid #1a3d28',
            padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676', display:'inline-block', boxShadow:'0 0 6px #00e676' }} />
              <span style={{ fontSize:'9px', letterSpacing:'3px', color:'#7a9a88', textTransform:'uppercase' }}>
                AUTHENTICATION REQUIRED
              </span>
            </div>
            {biometricAvailable && (
              <div style={{ display:'flex', gap:'4px' }}>
                {[['password','PASSWORD', KeyRound], ['biometric','FACE ID', Fingerprint]].map(([mode, label, Icon]) => (
                  <button key={mode} onClick={() => { setAuthMode(mode); setError(''); setStatus('idle'); }} style={{
                    background: authMode===mode ? 'rgba(0,230,118,0.15)' : 'transparent',
                    border: `1px solid ${authMode===mode ? '#00e676' : '#1a3d28'}`,
                    borderRadius:'4px', padding:'4px 9px', cursor:'pointer',
                    color: authMode===mode ? '#00e676' : '#7a9a88',
                    fontSize:'8px', fontFamily:'var(--font-mono)', letterSpacing:'1px',
                    display:'flex', alignItems:'center', gap:'4px',
                    boxShadow: authMode===mode ? '0 0 8px rgba(0,230,118,0.2)' : 'none',
                  }}>
                    <Icon size={9}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Officer ID — shared */}
          <div style={{ padding:'22px 24px 0' }}>
            <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'#7a9a88', marginBottom:'7px', textTransform:'uppercase' }}>
              Officer ID
            </label>
            <input
              className="login-input"
              style={{
                width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
                borderRadius:'5px', padding:'13px 15px', color:'#ffffff', fontSize:'14px',
                fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box', letterSpacing:'3px',
                transition:'border-color 0.2s, box-shadow 0.2s',
              }}
              value={officerId}
              onChange={e => setOfficerId(e.target.value.toUpperCase())}
              placeholder="DIR001"
              autoComplete="username"
            />
          </div>

          {/* Password mode */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} style={{ padding:'16px 24px 26px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px', color:'#7a9a88', marginBottom:'7px', textTransform:'uppercase' }}>
                  Access Code
                </label>
                <input
                  className="login-input"
                  style={{
                    width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
                    borderRadius:'5px', padding:'13px 15px', color:'#ffffff', fontSize:'14px',
                    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box', letterSpacing:'3px',
                    transition:'border-color 0.2s, box-shadow 0.2s',
                  }}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)', borderRadius:'5px', padding:'11px 14px', fontSize:'11px', color:'#d63a3a', letterSpacing:'1px' }}>
                  ⚠ {error}
                </div>
              )}
              <button
                type="submit"
                disabled={status==='verifying'||status==='granted'}
                style={{
                  background: btnBg(status),
                  border: `1px solid ${btnColor(status)}`,
                  borderRadius:'6px', padding:'15px', width:'100%',
                  color: btnColor(status),
                  fontSize:'12px', fontFamily:'var(--font-mono)', letterSpacing:'4px',
                  cursor:(status==='verifying'||status==='granted')?'wait':'pointer',
                  transition:'all 0.2s', fontWeight:'bold',
                  boxShadow: status!=='failed' ? `0 0 20px rgba(0,230,118,0.25)` : 'none',
                }}
              >
                {status==='verifying'?'VERIFYING...'
                  :status==='granted'?'✓ ACCESS GRANTED'
                  :status==='failed'?'AUTHENTICATION FAILED'
                  :'AUTHENTICATE'}
              </button>
            </form>
          ) : (
            /* Biometric mode */
            <div style={{ padding:'16px 24px 26px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)', borderRadius:'5px', padding:'11px 14px', fontSize:'11px', color:'#d63a3a', letterSpacing:'1px' }}>
                  ⚠ {error}
                </div>
              )}
              <button
                onClick={handleBiometricLogin}
                disabled={status==='verifying'||status==='granted'}
                style={{
                  background: btnBg(status),
                  border: `1px solid ${btnColor(status)}`,
                  borderRadius:'6px', padding:'20px', width:'100%',
                  color: btnColor(status),
                  fontSize:'12px', fontFamily:'var(--font-mono)', letterSpacing:'3px',
                  cursor:(status==='verifying'||status==='granted')?'wait':'pointer',
                  transition:'all 0.2s', fontWeight:'bold',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
                  boxShadow:`0 0 24px rgba(0,230,118,0.3)`,
                }}
              >
                <Fingerprint size={22}/>
                {status==='verifying'?'SCANNING...'
                  :status==='granted'?'✓ ACCESS GRANTED'
                  :status==='failed'?'BIOMETRIC FAILED'
                  :'AUTHENTICATE WITH FACE ID'}
              </button>
              <div style={{ textAlign:'center', fontSize:'9px', color:'#7a9a88', letterSpacing:'1px' }}>
                Face ID · Touch ID · Windows Hello
              </div>
            </div>
          )}
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop:'16px', background:'rgba(8,13,11,0.9)', border:'1px solid #0f2018', borderRadius:'8px', padding:'14px 16px' }}>
          <div style={{ fontSize:'8px', letterSpacing:'2px', color:'#7a9a88', marginBottom:'10px', textTransform:'uppercase' }}>
            Demo Credentials
          </div>
          {[
            { id:'DIR001', pwd:'onsa2026', role:'DIRECTOR' },
            { id:'ANL002', pwd:'analyst',  role:'ANALYST'  },
            { id:'OPS003', pwd:'ops123',   role:'OFFICER'  },
          ].map(c => (
            <div key={c.id}
              style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'6px', cursor:'pointer', padding:'3px 0' }}
              onClick={() => { setOfficerId(c.id); setPassword(c.pwd); setAuthMode('password'); }}>
              <span style={{ fontSize:'11px', color:'#00e676', width:'64px', fontFamily:'var(--font-mono)' }}>{c.id}</span>
              <span style={{ fontSize:'11px', color:'#ffffff', fontFamily:'var(--font-mono)' }}>{c.pwd}</span>
              <span style={{ fontSize:'8px', color:'#7a9a88', marginLeft:'auto', letterSpacing:'1px' }}>{c.role}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign:'center', marginTop:'16px', fontSize:'8px', color:'#1a3d28', letterSpacing:'1px' }}>
          esnsa.torama.money · ONSA/ES/OPS · CLASSIFIED
        </div>
      </div>
    </div>
  );
}
