import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import { Fingerprint, KeyRound, ShieldCheck, CheckCircle2, Camera } from 'lucide-react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import api from '../api/axios';

/* ─── Camera ──────────────────────────────────────────── */
function CameraView({ scanPhase, status }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [ready,    setReady]    = useState(false);
  const [camError, setCamError] = useState('');

  useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode:'user', width:{ ideal:640 }, height:{ ideal:480 } },
    }).then(stream => {
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setReady(true);
    }).catch(err => {
      setCamError(
        err.name==='NotAllowedError' ? 'CAMERA PERMISSION DENIED'
        : err.name==='NotFoundError' ? 'NO CAMERA FOUND'
        : 'CAMERA UNAVAILABLE'
      );
    });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []);

  if (camError) return (
    <div style={{ height:'220px', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', background:'#030508', border:'1px solid #1a3d28',
      borderRadius:'10px', color:'#d63a3a', fontSize:'13px', letterSpacing:'1px',
      gap:'10px', padding:'20px', textAlign:'center', fontFamily:'var(--font-mono)' }}>
      <Camera size={30} color="#d63a3a"/>
      <span>{camError}</span>
    </div>
  );

  const scanning = scanPhase === 'scanning';
  const done     = scanPhase === 'done' || status === 'granted';

  return (
    <div style={{
      position:'relative', borderRadius:'10px', overflow:'hidden',
      border: done ? '2px solid #00e676' : '1px solid #1a3d28',
      animation: scanning ? 'glowPulse 1.2s ease-in-out infinite' : 'none',
      boxShadow: done ? '0 0 40px rgba(0,230,118,0.5)' : scanning ? '0 0 20px rgba(0,230,118,0.25)' : 'none',
      background:'#000',
    }}>
      <video ref={videoRef} autoPlay playsInline muted
        style={{ width:'100%', height:'240px', objectFit:'cover', display:'block',
          transform:'scaleX(-1)', opacity: ready ? 1 : 0, transition:'opacity 0.4s' }}/>
      {!ready && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', background:'#030508', color:'var(--text-dim)',
          fontSize:'12px', letterSpacing:'2px', fontFamily:'var(--font-mono)' }}>
          INITIALISING CAMERA...
        </div>
      )}
      {[{top:10,left:10},{top:10,right:10},{bottom:10,left:10},{bottom:10,right:10}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', width:'22px', height:'22px',
          borderTop:    i<2  ? '2px solid #00e676' : 'none',
          borderBottom: i>=2 ? '2px solid #00e676' : 'none',
          borderLeft:   (i===0||i===2) ? '2px solid #00e676' : 'none',
          borderRight:  (i===1||i===3) ? '2px solid #00e676' : 'none',
          animation:'cornerPulse 2s ease-in-out infinite', ...pos,
        }}/>
      ))}
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        width:'110px', height:'140px', borderRadius:'50%',
        border:`2px solid ${done ? '#00e676' : 'rgba(0,230,118,0.35)'}`,
        boxShadow: done ? '0 0 20px rgba(0,230,118,0.6)' : 'none', pointerEvents:'none',
      }}/>
      {scanning && (
        <div style={{ position:'absolute', left:0, right:0, height:'2px',
          background:'linear-gradient(to right,transparent,#00e676,#69ff47,#00e676,transparent)',
          animation:'scanFace 1.4s linear infinite', boxShadow:'0 0 8px #00e676' }}/>
      )}
      {done && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:'12px',
          background:'rgba(0,230,118,0.08)' }}>
          <CheckCircle2 size={52} color='#00e676' style={{ filter:'drop-shadow(0 0 12px #00e676)' }}/>
          <span style={{ color:'#00e676', fontFamily:'var(--font-mono)', fontSize:'13px',
            letterSpacing:'3px', textShadow:'0 0 8px #00e676' }}>FACE VERIFIED</span>
        </div>
      )}
      {!done && (
        <div style={{ position:'absolute', bottom:'10px', left:0, right:0, textAlign:'center' }}>
          <span style={{ fontSize:'11px', letterSpacing:'2px', color:'rgba(0,230,118,0.65)',
            fontFamily:'var(--font-mono)', textShadow:'0 0 5px #00e676' }}>
            {scanning ? '● SCANNING...' : 'ALIGN FACE IN FRAME'}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Register Face (post-login) ─────────────────────── */
function RegisterFaceScreen({ onDone, onSkip }) {
  const [scanPhase, setScanPhase] = useState('idle');
  const [status,    setStatus]    = useState('idle');
  const [error,     setError]     = useState('');

  const handleRegister = async () => {
    setScanPhase('scanning'); setError('');
    await new Promise(r => setTimeout(r, 2000));
    try {
      const optRes  = await api.post('/auth/webauthn/register-options');
      const attResp = await startRegistration(optRes.data);
      await api.post('/auth/webauthn/register', attResp);
      setScanPhase('done'); setStatus('granted');
      await new Promise(r => setTimeout(r, 900));
      onDone();
    } catch (err) {
      setScanPhase('idle'); setStatus('failed');
      const msg = err.response?.data?.error || err.message || '';
      setError(msg.includes('timed out') || msg.includes('not allowed') ? 'SCAN CANCELLED — TRY AGAIN' : msg || 'REGISTRATION FAILED');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#030508', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'560px', animation:'fadeIn 0.35s ease' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'50%',
            background:'rgba(0,230,118,0.1)', border:'2px solid #00e676',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', boxShadow:'0 0 30px rgba(0,230,118,0.4)' }}>
            <Fingerprint size={32} color="#00e676"/>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'22px', fontWeight:'800',
            letterSpacing:'2px', color:'#ffffff', textTransform:'uppercase', marginBottom:'8px' }}>
            Register Face ID
          </div>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'var(--text-dim)' }}>
            Set up biometric login — or skip to use password only
          </div>
        </div>

        <div style={{ background:'#080d0b', border:'1px solid #1a3d28', borderRadius:'12px',
          padding:'28px', boxShadow:'0 0 40px rgba(0,230,118,0.07)' }}>
          <CameraView scanPhase={scanPhase} status={status}/>
          {error && (
            <div style={{ marginTop:'14px', background:'rgba(214,58,58,0.1)',
              border:'1px solid rgba(214,58,58,0.4)', borderRadius:'8px',
              padding:'12px 16px', fontSize:'12px', color:'#d63a3a',
              letterSpacing:'1px', fontFamily:'var(--font-mono)' }}>⚠ {error}</div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginTop:'18px' }}>
            <button onClick={handleRegister}
              disabled={scanPhase==='scanning'||status==='granted'}
              style={{
                background:'rgba(0,230,118,0.12)', border:'1px solid #00e676', borderRadius:'10px',
                padding:'20px', color:'#00e676', fontFamily:'var(--font-display)',
                fontSize:'16px', fontWeight:'800', letterSpacing:'2px',
                cursor: scanPhase==='scanning' ? 'wait' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
                boxShadow:'0 0 18px rgba(0,230,118,0.2)', minHeight:'60px',
                WebkitTapHighlightColor:'transparent', textTransform:'uppercase',
              }}>
              <Fingerprint size={22}/>
              {scanPhase==='scanning' ? 'SCANNING...' : status==='granted' ? '✓ REGISTERED' : 'REGISTER MY FACE'}
            </button>
            <button onClick={onSkip} style={{
              background:'transparent', border:'1px solid #0f2018', borderRadius:'10px',
              color:'var(--text-dim)', padding:'16px', fontFamily:'var(--font-mono)',
              fontSize:'12px', fontWeight:'700', letterSpacing:'2px', cursor:'pointer',
              WebkitTapHighlightColor:'transparent', minHeight:'50px',
            }}>
              SKIP — USE PASSWORD ONLY
            </button>
          </div>
        </div>
        <div style={{ textAlign:'center', marginTop:'14px', fontSize:'11px',
          color:'#1a3d28', letterSpacing:'1px', fontFamily:'var(--font-mono)' }}>
          Biometric data stays on this device · Never transmitted
        </div>
      </div>
    </div>
  );
}

/* ─── Main LoginPage ─────────────────────────────────── */
export default function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const mobile   = useMobile();
  const tablet   = useMobile(1024); // true below 1024px

  const [authMode,   setAuthMode]   = useState('password');
  const [officerId,  setOfficerId]  = useState('DIR001');
  const [password,   setPassword]   = useState('onsa2026');
  const [status,     setStatus]     = useState('idle');
  const [error,      setError]      = useState('');
  const [scanPhase,  setScanPhase]  = useState('idle');
  const [showBioReg, setShowBioReg] = useState(false);

  const biometricAvailable = typeof window !== 'undefined' && !!window.PublicKeyCredential;

  const handlePasswordSubmit = async (e) => {
    e?.preventDefault();
    setStatus('verifying'); setError('');
    try {
      await login(officerId, password);
      setStatus('granted');
      if (biometricAvailable) setShowBioReg(true);
      else setTimeout(() => navigate('/dashboard'), 900);
    } catch (err) {
      setStatus('failed');
      setError(err.response?.data?.error || 'AUTHENTICATION FAILED');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const handleFaceScan = async () => {
    if (!officerId.trim()) { setError('ENTER OFFICER ID FIRST'); return; }
    setScanPhase('scanning'); setError(''); setStatus('verifying');
    await new Promise(r => setTimeout(r, 2000));
    try {
      const optRes    = await api.post('/auth/webauthn/authenticate-options', { officer_id: officerId });
      const assertion = await startAuthentication(optRes.data);
      const authRes   = await api.post('/auth/webauthn/authenticate', { officer_id: officerId, ...assertion });
      loginWithToken(authRes.data.token, authRes.data.user);
      setScanPhase('done'); setStatus('granted');
      setTimeout(() => navigate('/dashboard'), 1100);
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

  if (showBioReg) {
    return (
      <RegisterFaceScreen
        onDone={() => navigate('/dashboard')}
        onSkip={() => navigate('/dashboard')}
      />
    );
  }

  const accentColor = status==='granted' ? '#00e676' : status==='failed' ? '#d63a3a' : '#00e676';
  const accentBg    = status==='granted' ? 'rgba(0,230,118,0.18)' : status==='failed' ? 'rgba(214,58,58,0.15)' : 'rgba(0,230,118,0.12)';

  /* Responsive sizing */
  const cardWidth  = mobile ? '100%'  : tablet ? '560px' : '600px';
  const logoSize   = mobile ? 64      : tablet ? 80      : 90;
  const iconSize   = mobile ? 28      : tablet ? 34      : 40;
  const titleSize  = mobile ? '15px'  : tablet ? '19px'  : '22px';
  const subSize    = mobile ? '11px'  : tablet ? '13px'  : '14px';
  const labelSize  = mobile ? '12px'  : '13px';
  const btnFontSz  = mobile ? '14px'  : '16px';
  const btnPad     = mobile ? '17px'  : '21px';
  const cardPad    = mobile ? '18px'  : tablet ? '28px'  : '34px';

  /* 16px keeps iOS from zooming on focus */
  const inputStyle = {
    width:'100%', background:'rgba(0,230,118,0.04)', border:'1px solid #1a3d28',
    borderRadius:'8px', padding: mobile ? '14px 16px' : '16px 18px',
    color:'#ffffff', fontSize:'16px', fontFamily:'var(--font-mono)',
    outline:'none', boxSizing:'border-box', letterSpacing:'2px', fontWeight:'700',
    transition:'border-color 0.2s, box-shadow 0.2s',
    WebkitAppearance:'none', appearance:'none',
  };

  return (
    <div style={{
      minHeight:'100vh', background:'#030508',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding: mobile ? '12px' : '24px',
      position:'relative', overflow:'hidden',
    }}>
      {/* Background grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%',
        opacity:0.04, pointerEvents:'none' }}>
        {Array.from({length:20},(_,i)=><line key={`h${i}`} x1="0" y1={`${i*5}%`} x2="100%" y2={`${i*5}%`} stroke="#00e676" strokeWidth="0.5"/>)}
        {Array.from({length:25},(_,i)=><line key={`v${i}`} x1={`${i*4}%`} y1="0" x2={`${i*4}%`} y2="100%" stroke="#00e676" strokeWidth="0.5"/>)}
      </svg>
      <div style={{ position:'absolute', left:0, right:0, height:'1px', pointerEvents:'none',
        background:'linear-gradient(to right,transparent,#00e676,transparent)',
        opacity:0.2, animation:'scandown 4s linear infinite' }}/>

      <div style={{ width:'100%', maxWidth: cardWidth, animation:'fadeIn 0.4s ease' }}>

        {/* ── Header ── */}
        <div style={{ textAlign:'center', marginBottom: mobile ? '20px' : '32px' }}>
          <div style={{
            width:`${logoSize}px`, height:`${logoSize}px`, borderRadius:'50%',
            background:'rgba(0,230,118,0.1)', border:'2px solid #00e676',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto', marginBottom: mobile ? '14px' : '20px',
            boxShadow:'0 0 36px rgba(0,230,118,0.45), 0 0 80px rgba(0,230,118,0.12)',
          }}>
            <ShieldCheck size={iconSize} color="#00e676"/>
          </div>
          <div style={{
            fontFamily:'var(--font-display)', fontWeight:'800',
            fontSize: titleSize,
            letterSpacing: mobile ? '2px' : '3px',
            color:'#ffffff', textTransform:'uppercase', lineHeight:1.3,
            marginBottom:'6px',
          }}>
            Office of the National Security Adviser
          </div>
          <div style={{
            fontFamily:'var(--font-mono)', fontWeight:'700',
            fontSize: subSize,
            letterSpacing: mobile ? '2px' : '3px',
            color:'var(--text-dim)', textTransform:'uppercase',
          }}>
            Directorate of Energy Security
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{
          background:'#080d0b', border:'1px solid #1a3d28', borderRadius:'12px',
          overflow:'hidden', boxShadow:'0 0 40px rgba(0,230,118,0.07)',
        }}>

          {/* Card header + tabs */}
          <div style={{ background:'#060b08', borderBottom:'1px solid #0f2018',
            padding: mobile ? '12px 16px' : '14px 20px',
            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#00e676',
                display:'inline-block', boxShadow:'0 0 6px #00e676', flexShrink:0 }}/>
              <span style={{
                fontSize: mobile ? '11px' : '12px', fontWeight:'700', letterSpacing:'1.5px',
                color:'var(--text-dim)', fontFamily:'var(--font-mono)',
              }}>
                AUTHENTICATION REQUIRED
              </span>
            </div>
            {biometricAvailable && (
              <div style={{ display:'flex', gap:'6px' }}>
                {[['password','PASSWORD',KeyRound],['biometric','FACE ID',Fingerprint]].map(([m,label,Icon])=>(
                  <button key={m}
                    onClick={()=>{setAuthMode(m);setError('');setStatus('idle');setScanPhase('idle');}}
                    style={{
                      background: authMode===m ? 'rgba(0,230,118,0.15)' : 'transparent',
                      border:`1px solid ${authMode===m ? '#00e676' : '#1a3d28'}`,
                      borderRadius:'6px', padding: mobile ? '6px 12px' : '7px 14px',
                      cursor:'pointer', color: authMode===m ? '#00e676' : 'var(--text-dim)',
                      fontSize: mobile ? '10px' : '11px', fontFamily:'var(--font-mono)',
                      fontWeight:'700', letterSpacing:'1px',
                      display:'flex', alignItems:'center', gap:'5px',
                      minHeight:'34px', WebkitTapHighlightColor:'transparent',
                    }}>
                    <Icon size={11}/>{label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PASSWORD */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordSubmit}
              style={{ padding: cardPad, display:'flex', flexDirection:'column',
                gap: mobile ? '16px' : '20px' }}>
              <div>
                <label style={{ display:'block', fontSize: labelSize, fontWeight:'700',
                  letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'10px',
                  fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>Officer ID</label>
                <input className="login-input" value={officerId}
                  onChange={e=>setOfficerId(e.target.value.toUpperCase())}
                  style={inputStyle} placeholder="DIR001"
                  autoComplete="username" autoCapitalize="characters"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize: labelSize, fontWeight:'700',
                  letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'10px',
                  fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>Access Code</label>
                <input className="login-input" type="password" value={password}
                  onChange={e=>setPassword(e.target.value)}
                  style={inputStyle} placeholder="••••••••"
                  autoComplete="current-password"/>
              </div>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)',
                  borderRadius:'8px', padding:'14px 16px', fontSize:'13px', color:'#d63a3a',
                  letterSpacing:'1px', fontFamily:'var(--font-mono)', fontWeight:'700' }}>⚠ {error}</div>
              )}
              <button type="submit"
                disabled={status==='verifying'||status==='granted'}
                style={{
                  background: accentBg, border:`1px solid ${accentColor}`,
                  borderRadius:'10px', padding: btnPad, width:'100%', color: accentColor,
                  fontFamily:'var(--font-display)', fontSize: btnFontSz,
                  fontWeight:'900', letterSpacing:'3px', textTransform:'uppercase',
                  cursor:(status==='verifying'||status==='granted')?'wait':'pointer',
                  transition:'all 0.2s', minHeight: mobile ? '56px' : '64px',
                  boxShadow: status!=='failed' ? '0 0 24px rgba(0,230,118,0.25)' : 'none',
                  WebkitTapHighlightColor:'transparent',
                }}>
                {status==='verifying' ? 'VERIFYING...'
                  : status==='granted'  ? '✓ ACCESS GRANTED'
                  : status==='failed'   ? 'AUTHENTICATION FAILED'
                  : 'AUTHENTICATE'}
              </button>
            </form>
          ) : (
            /* FACE ID */
            <div style={{ padding: cardPad, display:'flex', flexDirection:'column',
              gap: mobile ? '14px' : '18px' }}>
              <div>
                <label style={{ display:'block', fontSize: labelSize, fontWeight:'700',
                  letterSpacing:'1.5px', color:'var(--text-dim)', marginBottom:'10px',
                  fontFamily:'var(--font-mono)', textTransform:'uppercase' }}>Officer ID</label>
                <input className="login-input" value={officerId}
                  onChange={e=>setOfficerId(e.target.value.toUpperCase())}
                  style={inputStyle} placeholder="DIR001"
                  autoComplete="username" autoCapitalize="characters"/>
              </div>
              <CameraView scanPhase={scanPhase} status={status}/>
              {error && (
                <div style={{ background:'rgba(214,58,58,0.1)', border:'1px solid rgba(214,58,58,0.5)',
                  borderRadius:'8px', padding:'14px 16px', fontSize:'13px', color:'#d63a3a',
                  letterSpacing:'1px', fontFamily:'var(--font-mono)', fontWeight:'700' }}>⚠ {error}</div>
              )}
              <button onClick={handleFaceScan}
                disabled={scanPhase==='scanning'||status==='granted'}
                style={{
                  background: accentBg, border:`1px solid ${accentColor}`,
                  borderRadius:'10px', padding: btnPad, width:'100%', color: accentColor,
                  fontFamily:'var(--font-display)', fontSize: btnFontSz,
                  fontWeight:'900', letterSpacing:'3px', textTransform:'uppercase',
                  cursor:(scanPhase==='scanning'||status==='granted')?'wait':'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'12px',
                  minHeight: mobile ? '56px' : '64px',
                  boxShadow: status!=='failed' ? '0 0 24px rgba(0,230,118,0.25)' : 'none',
                  WebkitTapHighlightColor:'transparent',
                }}>
                <Fingerprint size={22}/>
                {scanPhase==='scanning' ? 'SCANNING...'
                  : status==='granted'  ? '✓ ACCESS GRANTED'
                  : 'SCAN FACE'}
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:'16px', fontSize:'10px',
          color:'#1a3d28', letterSpacing:'1.5px', fontFamily:'var(--font-mono)', fontWeight:'700' }}>
          ONSA/ES/OPS · CLASSIFIED · esnsa.torama.money
        </div>
      </div>
    </div>
  );
}
