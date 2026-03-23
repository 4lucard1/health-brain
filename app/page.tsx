'use client';

import { useState, useEffect } from 'react';
import AiHome from '@/components/home/AiHome';
import LogTab from '@/components/tabs/LogTab';
import SupplementsTab from '@/components/tabs/SupplementsTab';
import LabsTab from '@/components/tabs/LabsTab';

type TabType = 'home' | 'log' | 'profile';

interface UserProfile {
  name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  goals?: string[];
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
}

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
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [profileSection, setProfileSection] = useState<'main' | 'supplements' | 'labs' | 'edit'>('main');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    goals: '', allergies: '', conditions: '', medications: ''
  });

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
    setProfileSection('main');
  };

  // ONBOARDING
  if (showOnboarding) {
    const steps = [
      { title: 'Welcome to Health Brain', subtitle: 'Your personal AI health operating system', emoji: '🧠' },
      { title: 'Track Everything', subtitle: 'Meals, sleep, supplements — all in one place', emoji: '📋' },
      { title: 'Your Profile', subtitle: 'Help the AI understand you better', emoji: '👤' },
    ];
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100dvh', color: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        {onboardingStep < 2 ? (
          <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>{steps[onboardingStep].emoji}</div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {steps[onboardingStep].title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '40px', lineHeight: '1.6' }}>{steps[onboardingStep].subtitle}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: '4px', backgroundColor: i === onboardingStep ? '#22C55E' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />)}
            </div>
            <button onClick={() => setOnboardingStep(s => s + 1)} style={{ padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', width: '100%', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Continue →</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>Your Profile</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', textAlign: 'center', marginBottom: '20px' }}>Help AI personalize your experience</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {profileFields.map(({ key, placeholder, label }) => (
                <div key={key}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px 16px', color: '#F5F5F5', fontSize: '16px', outline: 'none' }} />
                </div>
              ))}
            </div>
            <button onClick={saveProfile} style={{ marginTop: '16px', width: '100%', padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Let's Go! 🚀</button>
            <button onClick={() => setShowOnboarding(false)} style={{ marginTop: '10px', width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '14px', cursor: 'pointer' }}>Skip for now</button>
          </div>
        )}
      </div>
    );
  }

  // PROFILE TAB
  const ProfileTab = () => (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0A0A0A', minHeight: '100dvh' }}>
      <div style={{ padding: '20px 20px 100px' }}>

        {profileSection === 'main' && (
          <>
            {/* Profile header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(59,130,246,0.3))', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, color: '#22C55E', flexShrink: 0 }}>
                {profile?.name ? profile.name[0].toUpperCase() : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '17px', fontWeight: 700, color: '#F5F5F5', lineHeight: 1 }}>{profile?.name || 'Your Profile'}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                  {[profile?.age && `${profile.age}y`, profile?.weight_kg && `${profile.weight_kg}kg`, profile?.height_cm && `${profile.height_cm}cm`].filter(Boolean).join(' · ') || 'Tap to edit'}
                </p>
              </div>
              <button onClick={() => setProfileSection('edit')} style={{ padding: '8px 14px', backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
            </div>

            {/* Sections */}
            {[
              { label: '💊 Supplements', sub: 'Track daily supplements', section: 'supplements' as const },
              { label: '🔬 Lab Results', sub: 'Upload & analyze medical reports', section: 'labs' as const },
            ].map(({ label, sub, section }) => (
              <button key={section} onClick={() => setProfileSection(section)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: '#F5F5F5', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '18px' }}>›</span>
              </button>
            ))}
          </>
        )}

        {profileSection === 'edit' && (
          <>
            <button onClick={() => setProfileSection('main')} style={{ marginBottom: '20px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profileFields.map(({ key, placeholder, label }) => (
                <div key={key}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 16px', color: '#F5F5F5', fontSize: '16px', outline: 'none' }} />
                </div>
              ))}
              <button onClick={saveProfile} style={{ marginTop: '8px', padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>Save Profile</button>
            </div>
          </>
        )}

        {profileSection === 'supplements' && (
          <>
            <button onClick={() => setProfileSection('main')} style={{ marginBottom: '16px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <SupplementsTab />
          </>
        )}

        {profileSection === 'labs' && (
          <>
            <button onClick={() => setProfileSection('main')} style={{ marginBottom: '16px', padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
            <LabsTab />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100dvh', color: '#F5F5F5' }}>

      {/* CONTENT */}
      <div style={{ paddingBottom: '72px' }}>
        {activeTab === 'home' && <AiHome profile={profile} onNavigate={(tab) => { setActiveTab(tab); if (tab === 'profile') setProfileSection('main'); }} />}
        {activeTab === 'log' && (
          <div style={{ backgroundColor: '#0A0A0A', minHeight: '100dvh' }}>
            <div style={{ padding: '20px 0 0', backgroundColor: '#0A0A0A' }}>
              <LogTab />
            </div>
          </div>
        )}
        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* BOTTOM NAV — 3 tabs */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(8,8,8,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: `8px 0 max(12px, env(safe-area-inset-bottom))`,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: '400px', margin: '0 auto' }}>
          {[
            { tab: 'home' as TabType, emoji: '🧠', label: 'Home' },
            { tab: 'log' as TabType, emoji: '📋', label: 'Log' },
            { tab: 'profile' as TabType, emoji: '👤', label: 'Profile' },
          ].map(({ tab, emoji, label }) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'profile') setProfileSection('main'); }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '6px 20px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', minWidth: '72px' }}>
                <span style={{ fontSize: '22px', opacity: isActive ? 1 : 0.35, transition: 'opacity 0.2s' }}>{emoji}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400, color: isActive ? '#22C55E' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }}>{label}</span>
                {isActive && <div style={{ width: 20, height: 2.5, borderRadius: '2px', background: 'linear-gradient(90deg, #22C55E, #3B82F6)', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}