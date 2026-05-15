/**
 * Color-coded classification / severity / status badge.
 * Usage: <Tag type="severity" value="CRITICAL" />
 */
const COLORS = {
  // Severity
  CRITICAL:    '#d63a3a',
  HIGH:        '#e0981a',
  MEDIUM:      '#d4920a',
  LOW:         '#1fba68',
  // Status
  ACTIVE:      '#d63a3a',
  MONITORING:  '#e0981a',
  CONTAINED:   '#d4920a',
  RESOLVED:    '#1fba68',
  STANDBY:     '#e0981a',
  OFFLINE:     '#4a5a6e',
  // Classification
  'TOP SECRET':'#d63a3a',
  SECRET:      '#d63a3a',
  CONFIDENTIAL:'#e0981a',
  RESTRICTED:  '#2a7fd4',
  UNCLASSIFIED:'#1fba68',
  // Role
  DIRECTOR:    '#d4920a',
  ANALYST:     '#2a7fd4',
  OFFICER:     '#1fba68',
  LIAISON:     '#b8c8da',
  ADMIN:       '#4a5a6e',
  // Generic
  DRAFT:       '#4a5a6e',
  REVIEW:      '#e0981a',
  FINAL:       '#1fba68',
  GENERATED:   '#2a7fd4',
  REVIEWED:    '#1fba68',
  SENT:        '#d4920a',
  ARCHIVED:    '#4a5a6e',
};

export default function Tag({ value, style }) {
  const color = COLORS[value] || '#4a5a6e';
  return (
    <span style={{
      background:   `${color}18`,
      color,
      border:       `1px solid ${color}44`,
      borderRadius: '3px',
      padding:      '2px 7px',
      fontSize:     '9px',
      fontFamily:   'var(--font-mono)',
      letterSpacing:'1px',
      whiteSpace:   'nowrap',
      ...style,
    }}>
      {value}
    </span>
  );
}
