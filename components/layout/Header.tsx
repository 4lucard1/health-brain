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
      backgroundColor: 'rgba(10,10,10,0.92)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div>
        <p style={{ color: '#6B7280', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1px' }}>{today}</p>
        <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}
          className="gradient-text">🧠 Health Brain</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '13px' }}>🔥</span>
          <span style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
        </div>
        <button onClick={onProfileClick} style={{
          width: 34, height: 34,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))',
          border: '1.5px solid rgba(34,197,94,0.4)',
          borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, color: '#22C55E',
        }}>
          {profileName ? profileName[0].toUpperCase() : '👤'}
        </button>
      </div>
    </div>
  );
}