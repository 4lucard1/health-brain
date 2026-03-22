'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import ChatTab from '@/components/tabs/ChatTab';
import LogTab from '@/components/tabs/LogTab';
import DashboardTab from '@/components/tabs/DashboardTab';
import SupplementsTab from '@/components/tabs/SupplementsTab';
import LabsTab from '@/components/tabs/LabsTab';

type TabType = 'chat' | 'log' | 'dashboard' | 'supplements' | 'labs';

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  goals: string[];
  allergies: string[];
  conditions: string[];
  medications: string[];
}

const navItems = [
  { tab: 'chat' as TabType, emoji: '💬', label: 'Chat' },
  { tab: 'log' as TabType, emoji: '📋', label: 'Daily Log' },
  { tab: 'dashboard' as TabType, emoji: '📊', label: 'Dashboard' },
  { tab: 'supplements' as TabType, emoji: '💊', label: 'Supplements' },
  { tab: 'labs' as TabType, emoji: '🔬', label: 'Lab Results' },
];

const profileFields = [
  { key: 'name', placeholder: 'Your name', label: 'Name' },
  { key: 'age', placeholder: 'Age', label: 'Age' },
  { key: 'gender', placeholder: 'Male / Female / Other', label: 'Gender' },
  { key: 'height_cm', placeholder: 'Height (cm)', label: 'Height' },
  { key: 'weight_kg', placeholder: 'Weight (kg)', label: 'Weight' },
  { key: 'goals', placeholder: 'e.g. Lose weight, Build muscle', label: 'Goals' },
  { key: 'allergies', placeholder: 'e.g. Gluten, Lactose', label: 'Allergies' },
  { key: 'conditions', placeholder: 'e.g. Diabetes', label: 'Health conditions' },
  { key: 'medications', placeholder: 'e.g. Metformin 500mg', label: 'Medications' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    goals: '', allergies: '', conditions: '', medications: ''
  });
  const [streak] = useState(7);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const { data } = await res.json();
      if (!data) { setShowOnboarding(true); }
      else {
        setProfile(data);
        setProfileForm({
          name: data.name || '', age: data.age?.toString() || '',
          gender: data.gender || '', height_cm: data.height_cm?.toString() || '',
          weight_kg: data.weight_kg?.toString() || '', goals: data.goals?.join(', ') || '',
          allergies: data.allergies?.join(', ') || '', conditions: data.conditions?.join(', ') || '',
          medications: data.medications?.join(', ') || '',
        });
      }
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    const body = {
      name: profileForm.name, age: parseInt(profileForm.age) || null,
      gender: profileForm.gender, height_cm: parseFloat(profileForm.height_cm) || null,
      weight_kg: parseFloat(profileForm.weight_kg) || null,
      goals: profileForm.goals.split(',').map(s => s.trim()).filter(Boolean),
      allergies: profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean),
      conditions: profileForm.conditions.split(',').map(s => s.trim()).filter(Boolean),
      medications: profileForm.medications.split(',').map(s => s.trim()).filter(Boolean),
    };
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setProfile(body as any);
    setShowOnboarding(false);
    setShowProfile(false);
  };

  // ONBOARDING
  if (showOnboarding) {
    const steps = [
      { title: 'Welcome to Health Brain', subtitle: 'Your personal AI health operating system', emoji: '🧠' },
      { title: 'Track Everything', subtitle: 'Meals, sleep, supplements, symptoms — all in one place', emoji: '📋' },
      { title: 'Your Profile', subtitle: 'Help the AI understand you', emoji: '👤' },
    ];
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100dvh', color: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        {onboardingStep < 2 ? (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>{steps[onboardingStep].emoji}</div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }} className="gradient-text">{steps[onboardingStep].title}</h1>
            <p style={{ color: '#9CA3AF', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>{steps[onboardingStep].subtitle}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: '4px', backgroundColor: i === onboardingStep ? '#22C55E' : '#1A1A1A', transition: 'all 0.3s' }} />)}
            </div>
            <button onClick={() => setOnboardingStep(s => s + 1)} style={{ padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', width: '100%', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Continue →</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>Your Profile</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>Help AI personalize your experience</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profileFields.map(({ key, placeholder, label }) => (
                <div key={key}>
                  <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '16px', outline: 'none' }} />
                </div>
              ))}
            </div>
            <button onClick={saveProfile} style={{ marginTop: '16px', width: '100%', padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Let's Go! 🚀</button>
            <button onClick={() => setShowOnboarding(false)} style={{ marginTop: '10px', width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#6B7280', fontSize: '14px', cursor: 'pointer' }}>Skip for now</button>
          </div>
        )}
      </div>
    );
  }

  // PROFILE PAGE
  if (showProfile) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100dvh', color: '#F5F5F5', padding: '20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setShowProfile(false)} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Edit Profile</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profileFields.map(({ key, placeholder, label }) => (
              <div key={key}>
                <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                  onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#F5F5F5', fontSize: '16px', outline: 'none' }} />
              </div>
            ))}
            <button onClick={saveProfile} style={{ marginTop: '8px', padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Save Profile</button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#F5F5F5' }} className="flex min-h-screen">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden lg:flex" style={{
        width: '240px',
        flexShrink: 0,
        flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 14px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        backgroundColor: 'rgba(6,6,6,0.99)',
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: '28px', paddingLeft: '6px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2px' }} className="gradient-text">🧠 Health Brain</h1>
          <p style={{ color: '#6B7280', fontSize: '11px' }}>Your AI Health OS</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', marginBottom: '18px' }}>
          <span>🔥</span>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#F5F5F5', lineHeight: 1 }}>{streak} days</p>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>streak</p>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(({ tab, emoji, label }) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '10px',
                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                backgroundColor: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid #22C55E' : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '16px' }}>{emoji}</span>
                <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#22C55E' : '#9CA3AF' }}>{label}</span>
              </button>
            );
          })}
        </nav>

        <button onClick={() => setShowProfile(true)} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 12px', borderRadius: '10px', width: '100%',
          backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', marginTop: '12px',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(59,130,246,0.2))', border: '1.5px solid rgba(34,197,94,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#22C55E', flexShrink: 0 }}>
            {profile?.name ? profile.name[0].toUpperCase() : '👤'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5', lineHeight: 1 }}>{profile?.name || 'Profile'}</p>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Edit</p>
          </div>
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh', overflow: 'hidden', maxWidth: '100%' }}>

        {/* Mobile header */}
        <div className="lg:hidden" style={{ flexShrink: 0 }}>
          <Header profileName={profile?.name} streak={streak} onProfileClick={() => setShowProfile(true)} />
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          className="pb-[72px] lg:pb-0">
          {activeTab === 'chat' && <ChatTab profile={profile} />}
          {activeTab === 'log' && <LogTab />}
          {activeTab === 'dashboard' && <DashboardTab profile={profile} />}
          {activeTab === 'supplements' && <SupplementsTab />}
          {activeTab === 'labs' && <LabsTab />}
        </div>

        {/* Mobile bottom nav */}
        <div className="lg:hidden">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </main>
    </div>
  );
}