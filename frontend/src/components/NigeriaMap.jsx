/**
 * SVG Nigeria map with animated threat markers.
 * Uses simplified path data for the country outline + state regions.
 * Coordinates are normalised to a 700x600 viewBox.
 */

const SEVERITY_COLOR = {
  CRITICAL: '#d63a3a',
  HIGH:     '#e0981a',
  MEDIUM:   '#e0981a',
  LOW:      '#1fba68',
};

// Approximate geo→SVG transform for Nigeria (lat 4–14, lon 3–15)
function geoToSvg(lat, lon) {
  const x = ((lon - 3) / 12) * 640 + 30;
  const y = 570 - ((lat - 4) / 10) * 520;
  return { x, y };
}

export default function NigeriaMap({ threats = [], onThreatClick }) {
  return (
    <svg
      viewBox="0 0 700 600"
      style={{ width:'100%', height:'100%', background:'transparent' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Nigeria outline — simplified polygon */}
      <polygon
        points="
          80,540 70,480 50,420 60,360 90,300 110,260 140,220 160,180
          200,160 240,140 290,130 340,120 390,115 440,120 490,130
          540,150 570,180 600,220 620,270 630,330 620,390 600,440
          570,490 540,520 500,545 460,560 420,565 380,560 340,550
          300,545 260,548 220,545 180,542 140,545 110,548"
        fill="rgba(26,34,50,0.8)"
        stroke="var(--border-bright)"
        strokeWidth="1.5"
      />

      {/* Grid lines */}
      {[0,1,2,3,4].map(i => (
        <line key={`h${i}`} x1="50" y1={120+i*100} x2="650" y2={120+i*100}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {[0,1,2,3,4].map(i => (
        <line key={`v${i}`} x1={100+i*120} y1="100" x2={100+i*120} y2="560"
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
      ))}

      {/* Key cities / labels */}
      {[
        { name:'ABUJA',   lat:9.07, lon:7.40 },
        { name:'LAGOS',   lat:6.45, lon:3.40 },
        { name:'PH',      lat:4.80, lon:7.01 },
        { name:'KANO',    lat:12.0, lon:8.52 },
        { name:'WARRI',   lat:5.52, lon:5.75 },
      ].map(({ name, lat, lon }) => {
        const { x, y } = geoToSvg(lat, lon);
        return (
          <g key={name}>
            <circle cx={x} cy={y} r="2" fill="var(--border-bright)" />
            <text x={x+5} y={y+4} fontSize="8" fill="var(--text-dim)" fontFamily="var(--font-mono)">{name}</text>
          </g>
        );
      })}

      {/* Threat markers */}
      {threats.map((threat) => {
        if (!threat.latitude || !threat.longitude) return null;
        const { x, y } = geoToSvg(parseFloat(threat.latitude), parseFloat(threat.longitude));
        const color = SEVERITY_COLOR[threat.severity] || '#4a5a6e';
        const isActive = threat.status === 'ACTIVE';
        return (
          <g
            key={threat.id}
            style={{ cursor:'pointer' }}
            onClick={() => onThreatClick?.(threat)}
          >
            {/* Pulsing ring for ACTIVE threats */}
            {isActive && (
              <circle cx={x} cy={y} r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.6">
                <animate attributeName="r" from="8" to="22" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Outer ring */}
            <circle cx={x} cy={y} r="8" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
            {/* Inner dot */}
            <circle cx={x} cy={y} r="3" fill={color} />
            {/* Incident ID label */}
            <text x={x+12} y={y+4} fontSize="8" fill={color} fontFamily="var(--font-mono)">{threat.incident_id}</text>
          </g>
        );
      })}

      {/* Compass rose */}
      <g transform="translate(640, 140)">
        <text textAnchor="middle" y="-14" fontSize="8" fill="var(--text-dim)" fontFamily="var(--font-mono)">N</text>
        <line x1="0" y1="-10" x2="0" y2="10" stroke="var(--text-dim)" strokeWidth="0.8" />
        <line x1="-10" y1="0" x2="10" y2="0" stroke="var(--text-dim)" strokeWidth="0.8" />
      </g>

      {/* Scale bar */}
      <g transform="translate(50, 575)">
        <line x1="0" y1="0" x2="60" y2="0" stroke="var(--text-dim)" strokeWidth="1" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--text-dim)" strokeWidth="1" />
        <line x1="60" y1="-4" x2="60" y2="4" stroke="var(--text-dim)" strokeWidth="1" />
        <text x="30" y="-6" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="var(--font-mono)">~400 KM</text>
      </g>
    </svg>
  );
}
