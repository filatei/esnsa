import { useState } from 'react';
export default function Btn({ children, onClick, color = '#d4920a', size = 'normal', disabled, style, type = 'button' }) {
  const [hov, setHov] = useState(false);
  const sm = size === 'small';
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   hov && !disabled ? `${color}26` : 'transparent',
        border:       `1px solid ${disabled ? '#4a5a6e' : color}`,
        borderRadius: '4px',
        color:        disabled ? '#4a5a6e' : color,
        padding:      sm ? '3px 8px' : '7px 14px',
        fontSize:     sm ? '9px' : '11px',
        fontFamily:   'var(--font-mono)',
        letterSpacing:'1px',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        transition:   'all 0.15s',
        whiteSpace:   'nowrap',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
