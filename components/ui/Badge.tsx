interface BadgeProps {
  label: string;
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
}

const colors = {
  green: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22C55E', glow: '0 0 10px rgba(34,197,94,0.2)' },
  blue: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3B82F6', glow: '0 0 10px rgba(59,130,246,0.2)' },
  yellow: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#EAB308', glow: '0 0 10px rgba(234,179,8,0.2)' },
  red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#EF4444', glow: '0 0 10px rgba(239,68,68,0.2)' },
  purple: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#A855F7', glow: '0 0 10px rgba(168,85,247,0.2)' },
};

export default function Badge({ label, variant = 'green' }: BadgeProps) {
  const c = colors[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
      backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text,
      boxShadow: c.glow, letterSpacing: '0.02em'
    }}>{label}</span>
  );
}