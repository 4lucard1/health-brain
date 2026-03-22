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
    await fetch('/api/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setProfile(body as any);
    setShowOnboarding(false);
    setShowProfile(false);
  };

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

  const navItems = [
    { tab: 'chat', emoji: '💬', label: 'Chat' },
    { tab: 'log', emoji: '📋', label: 'Daily Log' },
    { tab: 'dashboard', emoji: '📊', label: 'Dashboard' },
    { tab: 'supplements', emoji: '💊', label: 'Supplements' },
    { tab: 'labs', emoji: '🔬', label: 'Lab Results' },
  ];

  // ONBOARDING
  if (showOnboarding) {
    const steps = [
      { title: 'Welcome to Health Brain', subtitle: 'Your personal AI health operating system', emoji: '🧠' },
      { title: 'Track Everything', subtitle: 'Meals, sleep, supplements, symptoms — all in one place', emoji: '📋' },
      { title: 'Your Profile', subtitle: 'Help the AI understand you', emoji: '👤' },
    ];
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {onboardingStep < 2 ? (
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>{steps[onboardingStep].emoji}</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }} className="gradient-text">{steps[onboardingStep].title}</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '48px', lineHeight: '1.6' }}>{steps[onboardingStep].subtitle}</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: '4px', backgroundColor: i === onboardingStep ? '#22C55E' : '#1A1A1A', transition: 'all 0.3s' }} />)}
            </div>
            <button onClick={() => setOnboardingStep(s => s + 1)} style={{ padding: '16px 48px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '20px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Continue →</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px', textAlign: 'center' }}>Your Profile</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Help AI personalize your experience</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profileFields.map(({ key, placeholder, label }) => (
                <div key={key}>
                  <p style={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
                </div>
              ))}
            </div>
            <button onClick={saveProfile} style={{ marginTop: '20px', width: '100%', padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Let's Go! 🚀</button>
            <button onClick={() => setShowOnboarding(false)} style={{ marginTop: '12px', width: '100%', padding: '12px', backgroundColor: 'transparent', border: 'none', color: '#6B7280', fontSize: '14px', cursor: 'pointer' }}>Skip for now</button>
          </div>
        )}
      </div>
    );
  }

  // PROFILE PAGE
  if (showProfile) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', padding: '24px', maxWidth: '672px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button onClick={() => setShowProfile(false)} style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Edit Profile</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {profileFields.map(({ key, placeholder, label }) => (
            <div key={key}>
              <p style={{ color: '#9CA3AF', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <input placeholder={placeholder} value={profileForm[key as keyof typeof profileForm]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                style={{ width: '100%', backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
            </div>
          ))}
          <button onClick={saveProfile} style={{ padding: '16px', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>Save Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', display: 'flex', justifyContent: 'center' }}>

      {/* DESKTOP SIDEBAR */}
      <div style={{
        width: '260px', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 16px',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        backgroundColor: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)',
      }} className="hidden lg:flex">

        {/* Logo */}
        <div style={{ marginBottom: '40px', paddingLeft: '8px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}
            className="gradient-text">🧠 Health Brain</h1>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>Your AI Health OS</p>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', marginBottom: '24px' }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#F5F5F5' }}>{streak} days</p>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>Current streak</p>
          </div>
        </div>

        {/* Nav Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map(({ tab, emoji, label }) => {
            const isActive = activeTab === tab as TabType;
            return (
              <button key={tab} onClick={() => setActiveTab(tab as TabType)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '14px',
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.2s',
                backgroundColor: isActive ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid #22C55E' : '2px solid transparent',
              }}>
                <span style={{ fontSize: '18px' }}>{emoji}</span>
                <span style={{ fontSize: '14px', fontWeight: isActive ? 600 : 400, color: isActive ? '#22C55E' : '#9CA3AF', transition: 'color 0.2s' }}>{label}</span>
                {isActive && <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />}
              </button>
            );
          })}
        </div>

        {/* Profile bottom */}
        <button onClick={() => setShowProfile(true)} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '12px 16px', borderRadius: '14px', width: '100%',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', transition: 'all 0.2s',
          marginTop: '16px'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(59,130,246,0.3))',
            border: '1.5px solid rgba(34,197,94,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#22C55E', flexShrink: 0
          }}>
            {profile?.name ? profile.name[0].toUpperCase() : '👤'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#F5F5F5' }}>{profile?.name || 'Your Profile'}</p>
            <p style={{ fontSize: '11px', color: '#6B7280' }}>Edit profile</p>
          </div>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, maxWidth: '672px', display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <Header profileName={profile?.name} streak={streak} onProfileClick={() => setShowProfile(true)} />
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }} className="lg:pb-0">
          {activeTab === 'chat' && <ChatTab profile={profile} />}
          {activeTab === 'log' && <LogTab />}
          {activeTab === 'dashboard' && <DashboardTab profile={profile} />}
          {activeTab === 'supplements' && <SupplementsTab />}
          {activeTab === 'labs' && <LabsTab />}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}