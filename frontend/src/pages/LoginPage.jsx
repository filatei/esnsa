import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Fingerprint, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../api/axios';

/* ── Camera face-scan overlay ────────────────────────── */
function CameraView({ scanPhase, status }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState('');

  useEffect(() => {
    let active = true;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setReady(true);
    }).catch(() => setCamError('CAMERA PERMISSION DENIED'));

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  if (camError) return (
    <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#030508', border:'1px solid #1a3d28', borderRadius:'8px',
      color:'#d63a3a', fontSize:'11px', letterSpacing:'2px' }}>
      ⚠ {camError}
    </div>
  );

  const scanning = scanPhase === 'scanning';
  const done     = scanPhase === 'done' || status === 'granted';

  return (
    <div style={{ position:'relative', borderRadius:'8px', overflow:'hidden',
      border: done ? '2px solid #00e676' : '1px solid #1a3d28',
      animation: scanning ? 'glowPulse 1.2s ease-in-out infinite' : done ? 'none' : 'none',
      boxShadow: done ? '0 0 40px rgba(0,230,118,0.5)' : scanning ? '0 0 24px rgba(0,230,118,0.3)' : 'none',
      background:'#000',
    }}>
      {/* Live video */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ width:'100%', height:'220px', objectFit:'cover', display:'block',
          transform:'scaleX(-1)', opacity: ready ? 1 : 0, transition:'opacity 0.4s' }} />

      {!ready && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', background:'#030508', color:'#7a9a88', fontSize:'10px', letterSpacing:'2px' }}>
          INITIALISING CAMERA...
        </div>
      )}

      {/* Corner brackets */}
      {[{top:10,left:10},{top:10,right:10},{bottom:10,left:10},{bottom:10,right:10}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:'22px', height:'22px',
          borderTop:    i < 2  ? '2px solid #00e676' : 'none',
          borderBottom: i >= 2 ? '2px solid #00e676' : 'none',
          borderLeft:   (i===0||i===2) ? '2px solid #00e676' : 'none',
          borderRight:  (i===1||i===3) ? '2px solid #00e676' : 'none',
          animation: 'cornerPulse 2s ease-in-out infinite',
          ...pos,
        }} />
      ))}

      {/* Oval face guide */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:'120px', height:'150px', borderRadius:'50%',
        border: `2px solid ${done ? '#00e676' : 'rgba(0,230,118,0.4)'}`,
        boxShadow: done ? '0 0 20px rgba(0,230,118,0.6)' : 'none',
        pointerEvents:'none',
      }} />

      {/* Scanning line */}
      {scanning && (
        <div style={{
          position:'absolute', left:0, right:0, height:'2px',
          background:'linear-gradient(to right, transparent, #00e676, #69ff47, #00e676, transparent)',
          animation:'scanFace 1.4s linear infinite',
          boxShadow:'0 0 8px #00e676',
        }} />
      )}

      {/* Success overlay */}
      {done && (
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:'10px',
          background:'rgba(0,230,118,0.08)',
        }}>
          <CheckCircle2 size={44} color='#00e676' style={{ filter:'drop-shadow(0 0 12px #00e676)' }} />
          <span style={{ color:'#00e676', fontFamily:'var(--font-mono)', fontSize:'11px',
            letterSpacing:'3px', textShadow:'0 0 10px #00e676' }}>
            FACE VERIFIED
          </span>
        </div>
      )}

      {/* Label */}
      {!done && (
        <div style={{ position:'absolute', bottom:'10px', left:0, right:0, textAlign:'center' }}>
          <span style={{ fontSize:'9px', letterSpacing:'2px', color:'rgba(0,230,118,0.7)',
            fontFamily:'var(--font-mono)', textShadow:'0 0 6px #00e676' }}>
            {scanning ? '● SCANNING BIOMETRICS...' : 'ALIGN FACE IN FRAME'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main LoginPage ────────────────────────────────────── */
export default function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  const [authMode,   setAuthMode]   = useState('password');
  const [officerId,  setOfficerId]  = useState('DIR001');
  const [password,   setPassword]   = useState('onsa2026');
  const [status,     setStatus]     = useState('idle');
  const [error,      setError]      = useState('');
  const [scanPhase,  setScanPhase]  = useState('idle'); // idle|scanning|done
  const [showBioReg, setShowBioReg] = useState(false);

  const biometricAvailable = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  /* ── Password login ── */
  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    setStatus('verifying'); setError('');
    try {
      await login(officerId, password);
      setStatus('granted');
      if (biometricAvailable) setShowBioReg(true);
      else setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  /* ── Face scan → WebAuthn login ── */
  const handleFaceScan = async () => {
    if (!officerId.trim()) { setError('ENTER OFFICER ID FIRST'); return; }
    setScanPhase('scanning'); setError(''); setStatus('verifying');
    await new Promise(r => setTimeout(r, 2200));
    try {
      const optRes   = await api.post('/auth/webauthn/authenticate-options', { officer_id: officerId });
      const assertion = await startAuthentication(optRes.data);
      const authRes  = await api.post('/auth/webauthn/authenticate', { officer_id: officerId, ...assertion });
      loginWithToken(authRes.data.token, authRes.data.user);
      setScanPhase('done'); setStatus('granted');
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setScanPhase('idle'); setStatus('failed');
      const raw = err.response?.data?.error || err.message || '';
      setError(
        raw.includes('NO BIOMETRIC') ? 'NO FACE ID REGISTERED — LOGIN WITH PASSWORD FIRST'
        : raw.includes('timed out') || raw.includes('not allowed') ? 'FACE SCAN CANCELLED — TRY AGAIN'
        : raw || 'FACE AUTHENTICATION FAILED'
      );
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  /* ── Register face after password login ── */
  const handleRegisterFace = async () => {
    setScanPhase('scanning');
    await new Promise(r => setTimeout(r, 2000));
    try {
      const optRes  = await api.post('/auth/webauthn/register-options');
      const attResp = await startRegistration(optRes.data);
      await api.post('/auth/webauthn/register', attResp);
      setScanPhase('done');
      await new Promise(r => setTimeout(r, 800));
    } catch (_) {}
    navigate('/dashboard');
  };

  /* ── Face registration screen (post-login) ── */
  if (showBioReg) {
    return (
      <div style={{ minHeight:'100vh', background:'#030508', display:'flex',
        alignItems:'center', justifyContent:'center', padding:'20px' }}>
        <div style={{ width:'100%', maxWidth:'420px', animation:'fadeIn 0.4s ease' }}>
          <div style={{ background:'#080d0b', borderRadius:'12px', padding:'28px',
            border:'1px solid #1a3d28', boxShadow:'0 0 40px rgba(0,230,118,0.1)' }}>
            <div style={{ textAlign:'center', marginBottom:'20px' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'3px',
                color:'#00e676', marginBottom:'6px', textTransform:'uppercase' }}>
                REGISTER FACE ID
              </div>
              <div style={{ fontSize:'12px', color:'#7a9a88', letterSpacing:'1px' }}>
                Position your face in the frame
              </div>
            </div>
            <CameraView scanPhase={scanPhase} status={status} />
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'16px' }}>
              <button onClick={handleRegisterFace}
                disabled={scanPhase==='scanning'}
                style={{
                  background:'rgba(0,230,118,0.12)', border:'1px solid #00e676',
                  borderRadius:'6px', padding:'15px', color:'#00e676',
                  fontFamily:'var(--font-mono)', fontSize:'12px', letterSpacing:'3px',
                  cursor: scanPhase==='scanning' ? 'wait' : 'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  boxShadow:'0 0 16px rgba(0,230,118,0.2)', fontWeight:'bold',
                }}>
                <Fingerprint size={18}/>
                {scanPhase==='scanning' ? 'SCANNING...' : 'REGISTER MY FACE'}
              </button>
              <button onClick={() => navigate('/dashboard')} style={{
                background:'transparent', border:'1px solid #0f2018', borderRadius:'6px',
                color:'#7a9a88', padding:'12px', fontFamily:'var(--font-mono)',
                fontSize:'10px', letterSpacing:'2px', cursor:'pointer',
              }}>
                SKIP — USE PASSWORD ONLY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main login ── */
  const accentColor = status==='granted' ? '#00e676' : status==='failed' ? '#d63a3a' : '#00e676';
  const accentBg    = status==='granted' ? 'rgba(0,230,118,0.18)' : status==='failed' ? 'rgba(214,58,58,0.15)' : 'rgba(0,230,118,0.12)';

  return (
    <div style={{ minHeight:'100vh', background:'#030508', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'20px',
      position:'relative', overflow:'hidden' }}>

      {/* Subtle grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%',
        opacity:0.05, pointerEvents:'none' }}>
        {Array.from({length:25},(_,i)=><line key={`h${i}`} x1="0" y1={`${i*4}%`} x2="100%" y2={`${i*4}%`} stroke="#00e676" strokeWidth="0.5"/>)}
        {Array.from({length:30},(_,i)=><line key={`v${i}`} x1={`${i*3.5}%`} y1="0" x2={`${i*3.5}%`} y2="100%" stroke="#00e676" strokeWidth="0.5"/>)}
      </svg>

      {/* Scanline */}
      <div style={{ position:'absolute', left:0, right:0, height:'1px', pointerEvents:'none',
        background:'linear-gradient(to right,transparent,#00e676,transparent)',
        opacity:0.3, animation:'scandown 4s linear infinite' }} />

      <div style={{ width:'100%', maxWidth:'420px', animation:'fadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{
            width:'68px', height:'68px', borderRadius:'50%',
            background:'rgba(0,230,118,0.1)', border:'2px solid #00e676',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', color:'#00e676',
            boxShadow:'0 0 30px rgba(0,230,118,0.45), 0 0 70px rgba(0,230,118,0.12)',
          }}>
            <ShieldCheck size={32}/>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'4px',
            color:'#ffffff', textTransform:'uppercase', lineHeight:1.8 }}>
            Office of the National Security Adviser
          </div>
          <div style={{ fontSize:'10px', letterSpacing:'3px', color:'#7a9a88',
            textTransform:'uppercase', marginTop:'2px' }}>
            Directorate of Energy Security
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'#080d0b', border:'1px solid #1a3d28', borderRadius:'10px',
          overflow:'hidden', boxShadow:'0 0 30px rgba(0,230,118,0.07)' }}>

          {/* Card header + mode tabs */}
          <div style={{ background:'#060b08', borderBottom:'1px solid #0f2018',
            padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00e676',
                display:'inline-block', boxShadow:'0 0 6px #00e676' }}/>
              <span style={{ fontSize:'9px', letterSpacing:'3px', color:'#7a9a88', fontFamily:'var(--font-mono)' }}>
                AUTHENTICATION REQUIRED
              </span>
            </div>
            {biometricAvailable && (
              <div style={{ display:'flex', gap:'4px' }}>
                {[['password','PASSWORD',KeyRound],['biometric','FACE ID',Fingerprint]].map(([m,label,Icon])=>(
                  <button key={m} onClick={()=>{setAuthMode(m);setError('');setStatus('idle');setScanPhase('idle');}} style={{
                    background: authMode===m ? 'rgba(0,230,118,0.15)' : 'transparent',
                    border:`1px solid ${authMode===m ? '#00e676' : '#1a3d28'}`,
                    borderRadius:'4px', padding:'4px 9px', cursor:'pointer',
                    color: authMode===m ? '#00e676' : '#7a9a88',
                    fontSize:'8px', fontFamily:'var(--font-mono)', letterSpacing:'1px',
                    display:'flex', alignItems:'center', gap:'4px',
                    boxShadow: authMode===m ? '0 0 8px rgba(0,230,118,0.25)' : 'none',
                  }}>
                    <Icon size={9}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PASSWORD mode */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} style={{ padding:'22px 22px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px',
                  color:'#7a9a88', marginBottom:'7px', fontFamily:'var(--font-mono)' }}>OFFICER ID</label>
                <input className="login-input" value={officerId}
                  onChange={e=>setOfficerId(e.target.value.toUpperCase())}
                  style={{ width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
                    borderRadius:'5px', padding:'13px 15px', color:'#ffffff', fontSize:'14px',
                    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box',
                    letterSpacing:'3px', fontWeight:'bold', transition:'border-color 0.2s, box-shadow 0.2s' }}
                  placeholder="DIR001" autoComplete="username"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px',
                  color:'#7a9a88', marginBottom:'7px', fontFamily:'var(--font-mono)' }}>ACCESS CODE</label>
                <input className="login-input" type="password" value={password}
                  onChange={e=>setPassword(e.target.value)}
                  style={{ width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
                    borderRadius:'5px', padding:'13px 15px', color:'#ffffff', fontSize:'14px',
                    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box',
                    letterSpacing:'3px', fontWeight:'bold', transition:'border-color 0.2s, box-shadow 0.2s' }}
                  placeholder="••••••••" autoComplete="current-password"/>
              </div>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)',
                  borderRadius:'5px', padding:'11px 14px', fontSize:'11px', color:'#d63a3a',
                  letterSpacing:'1px', fontFamily:'var(--font-mono)' }}>⚠ {error}</div>
              )}
              <button type="submit" disabled={status==='verifying'||status==='granted'} style={{
                background: accentBg, border:`1px solid ${accentColor}`,
                borderRadius:'6px', padding:'15px', width:'100%', color: accentColor,
                fontFamily:'var(--font-display)', fontSize:'12px', letterSpacing:'4px',
                cursor:(status==='verifying'||status==='granted')?'wait':'pointer',
                fontWeight:'900', transition:'all 0.2s',
                boxShadow: status!=='failed' ? '0 0 20px rgba(0,230,118,0.3)' : 'none',
              }}>
                {status==='verifying'?'VERIFYING...'
                  :status==='granted'?'✓ ACCESS GRANTED'
                  :status==='failed'?'AUTHENTICATION FAILED'
                  :'AUTHENTICATE'}
              </button>
            </form>
          ) : (
            /* FACE ID mode */
            <div style={{ padding:'18px 22px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'9px', letterSpacing:'2px',
                  color:'#7a9a88', marginBottom:'7px', fontFamily:'var(--font-mono)' }}>OFFICER ID</label>
                <input className="login-input" value={officerId}
                  onChange={e=>setOfficerId(e.target.value.toUpperCase())}
                  style={{ width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
                    borderRadius:'5px', padding:'11px 14px', color:'#ffffff', fontSize:'13px',
                    fontFamily:'var(--font-mono)', outline:'none', boxSizing:'border-box',
                    letterSpacing:'3px', fontWeight:'bold', transition:'border-color 0.2s, box-shadow 0.2s' }}
                  placeholder="DIR001" autoComplete="username"/>
              </div>

              <CameraView scanPhase={scanPhase} status={status}/>

              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)',
                  borderRadius:'5px', padding:'10px 14px', fontSize:'11px', color:'#d63a3a',
                  letterSpacing:'1px', fontFamily:'var(--font-mono)' }}>⚠ {error}</div>
              )}
              <button onClick={handleFaceScan}
                disabled={scanPhase==='scanning'||status==='granted'}
                style={{
                  background: accentBg, border:`1px solid ${accentColor}`,
                  borderRadius:'6px', padding:'15px', width:'100%', color: accentColor,
                  fontFamily:'var(--font-display)', fontSize:'12px', letterSpacing:'4px',
                  cursor:(scanPhase==='scanning'||status==='granted')?'wait':'pointer',
                  fontWeight:'900', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
                  boxShadow: status!=='failed' ? '0 0 20px rgba(0,230,118,0.3)' : 'none',
                }}>
                <Fingerprint size={18}/>
                {scanPhase==='scanning'?'SCANNING...'
                  :status==='granted'?'✓ ACCESS GRANTED'
                  :'SCAN FACE'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:'14px', fontSize:'8px',
          color:'#1a3d28', letterSpacing:'1px', fontFamily:'var(--font-mono)' }}>
          ONSA/ES/OPS · CLASSIFIED · esnsa.torama.money
        </div>
      </div>
    </div>
  );
}
