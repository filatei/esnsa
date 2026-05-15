import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import Tag from './Tag';

function WATClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const wat = new Date(now.getTime() + 60 * 60 * 1000);
      setTime(wat.toUTCString().replace('GMT','WAT').slice(0,-7).slice(-8));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontSize:'13px', color:'var(--accent)', fontFamily:'var(--font-mono)',
      fontWeight:'700', letterSpacing:'2px', textShadow:'0 0 8px rgba(0,230,118,0.4)', whiteSpace:'nowrap' }}>
      {time} WAT
    </span>
  );
}

export default function TopBar({ threatCount = 0, onMenuToggle }) {
  const { user, logout } = useAuth();
  const mobile = useMobile();

  return (
    <div style={{
      height: mobile ? '50px' : '56px',
      background:'var(--panel)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding: mobile ? '0 12px' : '0 18px',
      position:'sticky', top:0, zIndex:10, flexShrink:0,
      boxShadow:'0 1px 20px rgba(0,0,0,0.4)',
    }}>
      {/* Left — brand */}
      <div style={{ display:'flex', alignItems:'center', gap: mobile ? '10px' : '14px' }}>
        <div style={{
          width: mobile ? '30px' : '36px',
          height: mobile ? '30px' : '36px',
          borderRadius:'50%',
          background:'rgba(0,230,118,0.12)', border:'2px solid var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--accent)', fontSize: mobile ? '14px' : '16px', flexShrink:0,
          boxShadow:'0 0 14px rgba(0,230,118,0.3)',
        }}>⬡</div>

        {mobile ? (
          /* Mobile: compact brand */
          <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
            <span style={{
              fontFamily:'var(--font-display)', fontSize:'11px', fontWeight:'800',
              letterSpacing:'2px', color:'#ffffff', textTransform:'uppercase', lineHeight:1.2,
            }}>ESNSA</span>
            <span style={{
              fontFamily:'var(--font-mono)', fontSize:'8px', fontWeight:'600',
              letterSpacing:'1px', color:'var(--text-dim)', textTransform:'uppercase',
            }}>ENERGY SECURITY OPS</span>
          </div>
        ) : (
          /* Desktop: full brand */
          <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
            <span style={{
              fontFamily:'var(--font-display)', fontSize:'12px', fontWeight:'800',
              letterSpacing:'2.5px', color:'#ffffff', textTransform:'uppercase', lineHeight:1.3,
            }}>
              Office of the National Security Adviser
            </span>
            <span style={{
              fontFamily:'var(--font-body)', fontSize:'11px', fontWeight:'600',
              letterSpacing:'1.5px', color:'var(--text-dim)', textTransform:'uppercase',
            }}>
              Directorate of Energy Security
            </span>
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap: mobile ? '10px' : '20px' }}>
        {!mobile && <WATClock />}

        {threatCount > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--red)',
              display:'inline-block', animation:'pulse 1.5s infinite', boxShadow:'0 0 6px var(--red)' }} />
            <span style={{ fontSize: mobile ? '10px' : '12px', fontWeight:'700', color:'var(--red)',
              fontFamily:'var(--font-mono)', letterSpacing:'1px' }}>
              {threatCount}{!mobile && ' ACTIVE'}
            </span>
          </div>
        )}

        {user && (
          <div style={{ display:'flex', alignItems:'center', gap: mobile ? '6px' : '10px' }}>
            {mobile ? (
              <>
                <span style={{ fontSize:'11px', fontWeight:'700', color:'#ffffff',
                  fontFamily:'var(--font-mono)', letterSpacing:'1px' }}>
                  {user.officer_id}
                </span>
                <button onClick={logout} style={{
                  background:'none', border:'1px solid var(--border-bright)', borderRadius:'4px',
                  color:'var(--text-dim)', cursor:'pointer', fontSize:'9px', fontWeight:'700',
                  letterSpacing:'1.5px', padding:'4px 8px', fontFamily:'var(--font-mono)',
                }}>OUT</button>
              </>
            ) : (
              <>
                <span style={{ fontSize:'12px', fontWeight:'700', color:'#ffffff',
                  fontFamily:'var(--font-mono)', letterSpacing:'2px' }}>
                  {user.officer_id}
                </span>
                <Tag value={user.role} />
                <button onClick={logout} style={{
                  background:'none', border:'1px solid var(--border-bright)', borderRadius:'4px',
                  color:'var(--text-dim)', cursor:'pointer', fontSize:'10px', fontWeight:'600',
                  letterSpacing:'2px', padding:'4px 10px', fontFamily:'var(--font-mono)',
                  transition:'all 0.15s',
                }}>LOGOUT</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
