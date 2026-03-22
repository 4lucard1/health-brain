'use client';

type TabType = 'chat' | 'log' | 'dashboard' | 'supplements' | 'labs';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { tab: 'chat' as TabType, emoji: '💬', label: 'Chat' },
  { tab: 'log' as TabType, emoji: '＋', label: 'Log' },
  { tab: 'dashboard' as TabType, emoji: '📊', label: 'Stats' },
  { tab: 'supplements' as TabType, emoji: '💊', label: 'Suppl' },
  { tab: 'labs' as TabType, emoji: '🔬', label: 'Labs' },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '672px', zIndex: 50,
      backgroundColor: 'rgba(10,10,10,0.9)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '8px 16px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {tabs.map(({ tab, emoji, label }) => {
          const isActive = activeTab === tab;
          const isLog = tab === 'log';
          return (
            <button key={tab} onClick={() => onTabChange(tab)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: isLog ? '0' : '6px 12px',
              border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
              transition: 'all 0.2s',
            }}>
              {isLog ? (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', marginTop: '-22px',
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 300,
                  boxShadow: '0 4px 24px rgba(34,197,94,0.45), 0 0 0 1px rgba(34,197,94,0.2)',
                  transition: 'all 0.2s'
                }}>＋</div>
              ) : (
                <>
                  <span style={{ fontSize: '19px', opacity: isActive ? 1 : 0.45, transition: 'all 0.2s' }}>{emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, color: isActive ? '#22C55E' : '#6B7280', transition: 'all 0.2s' }}>{label}</span>
                  {isActive && <div style={{ width: 18, height: 2, borderRadius: '2px', background: 'linear-gradient(90deg, #22C55E, #3B82F6)', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}