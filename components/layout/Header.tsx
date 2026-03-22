'use client';

interface HeaderProps {
  profileName?: string;
  streak: number;
  onProfileClick: () => void;
}

export default function Header({ profileName, streak, onProfileClick }: HeaderProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div style={{
      backgroundColor: 'rgba(10,10,10,0.85)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'sticky', top: 0, zIndex: 40,
      padding: '14px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    }}>
      <div>
        <p style={{ color: '#6B7280', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{today}</p>
        <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}
          className="gradient-text">🧠 Health Brain</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <span style={{ fontSize: '13px' }}>🔥</span>
          <span style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
        </div>
        <button onClick={onProfileClick} style={{
          width: 36, height: 36,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))',
          border: '1.5px solid rgba(34,197,94,0.4)',
          borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#22C55E',
          transition: 'all 0.2s'
        }}>
          {profileName ? profileName[0].toUpperCase() : '👤'}
        </button>
      </div>
    </div>
  );
}