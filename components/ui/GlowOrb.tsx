'use client';

interface GlowOrbProps {
  size?: number;
  color?: 'green' | 'blue';
  pulse?: boolean;
  emoji?: string;
}

export default function GlowOrb({ size = 36, color = 'green', pulse = true, emoji = '🧠' }: GlowOrbProps) {
  const isGreen = color === 'green';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: isGreen
        ? 'radial-gradient(circle, rgba(34,197,94,0.4), rgba(59,130,246,0.15))'
        : 'radial-gradient(circle, rgba(59,130,246,0.5), rgba(34,197,94,0.15))',
      border: `1px solid ${isGreen ? 'rgba(34,197,94,0.4)' : 'rgba(59,130,246,0.4)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4,
    }} className={pulse ? (isGreen ? 'animate-pulse-glow' : 'animate-pulse-blue') : ''}>
      {emoji}
    </div>
  );
}