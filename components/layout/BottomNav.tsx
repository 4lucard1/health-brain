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
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(8,8,8,0.96)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      padding: '6px 0 max(10px, env(safe-area-inset-bottom))',
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
        {tabs.map(({ tab, emoji, label }) => {
          const isActive = activeTab === tab;
          const isLog = tab === 'log';
          return (
            <button key={tab} onClick={() => onTabChange(tab)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: isLog ? '0' : '4px 12px',
              border: 'none', cursor: 'pointer', backgroundColor: 'transparent',
              minWidth: '48px', minHeight: '44px', justifyContent: 'center',
            }}>
              {isLog ? (
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', marginTop: '-18px',
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: 300,
                  boxShadow: '0 4px 20px rgba(34,197,94,0.45)',
                }}>＋</div>
              ) : (
                <>
                  <span style={{ fontSize: '19px', opacity: isActive ? 1 : 0.45, transition: 'opacity 0.2s' }}>{emoji}</span>
                  <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, color: isActive ? '#22C55E' : '#6B7280', transition: 'color 0.2s' }}>{label}</span>
                  {isActive && <div style={{ width: 16, height: 2, borderRadius: '2px', background: 'linear-gradient(90deg, #22C55E, #3B82F6)', boxShadow: '0 0 6px rgba(34,197,94,0.6)', marginTop: '1px' }} />}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}