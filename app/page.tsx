'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type LogType = 'meal' | 'supplement' | 'sleep' | 'energy' | 'symptom';
type TabType = 'chat' | 'log' | 'dashboard' | 'supplements' | 'labs';

interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
}

interface SupplementLog {
  supplement_id: string;
  taken: boolean;
  supplements: Supplement;
}

interface DailyLog {
  id: string;
  type: string;
  data: { note: string; timestamp: string };
  created_at: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  extracted_text: string;
  ai_analysis: string;
  date: string;
  created_at: string;
  record_type: string;
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [logType, setLogType] = useState<LogType>('meal');
  const [logInput, setLogInput] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [newSupp, setNewSupp] = useState({ name: '', dose: '', timing: '' });
  const [addingSupp, setAddingSupp] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [preview, setPreview] = useState('');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [recordTitle, setRecordTitle] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '', age: '', gender: '', height_cm: '', weight_kg: '',
    goals: '', allergies: '', conditions: '', medications: ''
  });
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [scanPreview, setScanPreview] = useState('');
  const [scannedProductName, setScannedProductName] = useState('');
  const [showScanSheet, setShowScanSheet] = useState(false);
  const [streak] = useState(7);

  const fileRef = useRef<HTMLInputElement>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'supplements') { fetchSupplements(); fetchSupplementLogs(); }
    if (activeTab === 'dashboard' || activeTab === 'log') { fetchLogs(); }
    if (activeTab === 'labs') { fetchRecords(); }
  }, [activeTab, selectedDate]);

  const fetchProfile = async () => {
    const res = await fetch('/api/profile');
    const { data } = await res.json();
    if (!data) {
      setShowOnboarding(true);
    } else {
      setProfile(data);
      setProfileForm({
        name: data.name || '',
        age: data.age?.toString() || '',
        gender: data.gender || '',
        height_cm: data.height_cm?.toString() || '',
        weight_kg: data.weight_kg?.toString() || '',
        goals: data.goals?.join(', ') || '',
        allergies: data.allergies?.join(', ') || '',
        conditions: data.conditions?.join(', ') || '',
        medications: data.medications?.join(', ') || '',
      });
    }
  };

  const saveProfile = async () => {
    const body = {
      name: profileForm.name,
      age: parseInt(profileForm.age) || null,
      gender: profileForm.gender,
      height_cm: parseFloat(profileForm.height_cm) || null,
      weight_kg: parseFloat(profileForm.weight_kg) || null,
      goals: profileForm.goals.split(',').map(s => s.trim()).filter(Boolean),
      allergies: profileForm.allergies.split(',').map(s => s.trim()).filter(Boolean),
      conditions: profileForm.conditions.split(',').map(s => s.trim()).filter(Boolean),
      medications: profileForm.medications.split(',').map(s => s.trim()).filter(Boolean),
    };
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setProfile(body as any);
    setShowOnboarding(false);
    setShowProfile(false);
  };

  const fetchSupplements = async () => {
    const res = await fetch('/api/supplements');
    const { data } = await res.json();
    setSupplements(data || []);
  };

  const fetchSupplementLogs = async () => {
    const res = await fetch('/api/supplements/log');
    const { data } = await res.json();
    setSupplementLogs(data || []);
  };

  const fetchLogs = async () => {
    const res = await fetch(`/api/log?date=${selectedDate}`);
    const { data } = await res.json();
    setLogs(data || []);
  };

  const fetchRecords = async () => {
    const res = await fetch('/api/records');
    const { data } = await res.json();
    setRecords(data || []);
  };

  const addSupplement = async () => {
    if (!newSupp.name || !newSupp.dose || !newSupp.timing) return;
    await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupp),
    });
    setNewSupp({ name: '', dose: '', timing: '' });
    setAddingSupp(false);
    fetchSupplements();
  };

  const toggleSupplement = async (supplement_id: string, taken: boolean) => {
    await fetch('/api/supplements/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement_id, taken }),
    });
    fetchSupplementLogs();
  };

  const isSupplementTaken = (id: string) => {
    const log = supplementLogs.find(l => l.supplement_id === id);
    return log?.taken || false;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!logInput.trim()) return;
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logType, data: { note: logInput, timestamp: new Date().toISOString() } }),
    });
    setLogInput('');
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    fetchLogs();
  };

  const analyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setAnalysis('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', recordTitle || 'Nalaz ' + new Date().toLocaleDateString());
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysis(data.analysis || data.error);
      fetchRecords();
    } catch (error) {
      console.error(error);
      setAnalysis('Greška pri analizi.');
    } finally {
      setAnalyzing(false);
      setPreview('');
    }
  };

  const scanProduct = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanPreview(URL.createObjectURL(file));
    setScanning(true);
    setScanResult('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await res.json();
      setScanResult(data.extracted || data.error);
    } catch (error) {
      console.error(error);
      setScanResult('Greška pri skeniranju.');
    } finally {
      setScanning(false);
    }
  };

  const saveScanAsLog = async () => {
    if (!scanResult || !scannedProductName) return;
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: logType,
        data: { note: `${scannedProductName}: ${scanResult}`, timestamp: new Date().toISOString() }
      }),
    });
    setScanResult('');
    setScanPreview('');
    setScannedProductName('');
    setShowScanSheet(false);
    fetchLogs();
  };

  const logTypes: { type: LogType; label: string; emoji: string }[] = [
    { type: 'meal', label: 'Obrok', emoji: '🍽️' },
    { type: 'supplement', label: 'Suplement', emoji: '💊' },
    { type: 'sleep', label: 'San', emoji: '😴' },
    { type: 'energy', label: 'Energija', emoji: '⚡' },
    { type: 'symptom', label: 'Simptom', emoji: '⚠️' },
  ];

  const takenCount = supplements.filter(s => isSupplementTaken(s.id)).length;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const chartData = [
    { day: 'Mon', energy: 6, sleep: 7 },
    { day: 'Tue', energy: 7, sleep: 6 },
    { day: 'Wed', energy: 5, sleep: 8 },
    { day: 'Thu', energy: 8, sleep: 7 },
    { day: 'Fri', energy: 7, sleep: 6 },
    { day: 'Sat', energy: 9, sleep: 8 },
    { day: 'Sun', energy: 8, sleep: 7 },
  ];

  const tabs = [
    { tab: 'chat', emoji: '💬', label: 'Chat' },
    { tab: 'log', emoji: '＋', label: 'Log' },
    { tab: 'dashboard', emoji: '📊', label: 'Stats' },
    { tab: 'supplements', emoji: '💊', label: 'Suppl' },
    { tab: 'labs', emoji: '🔬', label: 'Labs' },
  ];

  const onboardingSteps = [
    { title: 'Welcome to Health Brain', subtitle: 'Your personal AI health operating system', emoji: '🧠' },
    { title: 'Track Everything', subtitle: 'Meals, sleep, supplements, symptoms — all in one place', emoji: '📋' },
    { title: 'Tell us about you', subtitle: 'Help the AI understand your health profile', emoji: '👤' },
  ];

  // ONBOARDING
  if (showOnboarding) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }} className="max-w-2xl mx-auto">
        {onboardingStep < 2 ? (
          <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.4s ease' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>{onboardingSteps[onboardingStep].emoji}</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.02em' }}>{onboardingSteps[onboardingStep].title}</h1>
            <p style={{ color: '#9CA3AF', fontSize: '16px', marginBottom: '48px', lineHeight: '1.6' }}>{onboardingSteps[onboardingStep].subtitle}</p>
            <div className="flex gap-2 justify-center mb-8">
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: '4px', backgroundColor: i === onboardingStep ? '#22C55E' : '#1A1A1A', transition: 'all 0.3s' }} />
              ))}
            </div>
            <button onClick={() => setOnboardingStep(s => s + 1)} style={{
              padding: '16px 48px', background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              border: 'none', borderRadius: '20px', color: '#fff', fontSize: '16px',
              fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
            }}>Continue →</button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeSlideUp 0.4s ease' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>Your Profile</h2>
            <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>Help AI personalize your experience</p>
            <div className="space-y-3">
              {[
                { key: 'name', placeholder: 'Your name', label: 'Name' },
                { key: 'age', placeholder: 'Age', label: 'Age' },
                { key: 'gender', placeholder: 'Male / Female / Other', label: 'Gender' },
                { key: 'height_cm', placeholder: 'Height (cm)', label: 'Height' },
                { key: 'weight_kg', placeholder: 'Weight (kg)', label: 'Weight' },
                { key: 'goals', placeholder: 'e.g. Lose weight, Build muscle, Better sleep', label: 'Goals (comma separated)' },
                { key: 'allergies', placeholder: 'e.g. Gluten, Lactose', label: 'Allergies' },
                { key: 'conditions', placeholder: 'e.g. Diabetes, Hypertension', label: 'Health conditions' },
                { key: 'medications', placeholder: 'e.g. Metformin 500mg', label: 'Medications' },
              ].map(({ key, placeholder, label }) => (
                <div key={key}>
                  <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <input
                    placeholder={placeholder}
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    style={{
                      width: '100%', backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
            <button onClick={saveProfile} style={{
              marginTop: '20px', width: '100%', padding: '16px',
              background: 'linear-gradient(135deg, #22C55E, #16A34A)',
              border: 'none', borderRadius: '16px', color: '#fff',
              fontSize: '16px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
            }}>Let's Go! 🚀</button>
            <button onClick={() => { setShowOnboarding(false); }} style={{
              marginTop: '12px', width: '100%', padding: '12px',
              backgroundColor: 'transparent', border: 'none', color: '#6B7280',
              fontSize: '14px', cursor: 'pointer'
            }}>Skip for now</button>
          </div>
        )}
        <style>{`
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  // PROFILE MODAL
  if (showProfile) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', padding: '24px' }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowProfile(false)} style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Edit Profile</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'name', placeholder: 'Your name', label: 'Name' },
            { key: 'age', placeholder: 'Age', label: 'Age' },
            { key: 'gender', placeholder: 'Male / Female / Other', label: 'Gender' },
            { key: 'height_cm', placeholder: 'Height (cm)', label: 'Height (cm)' },
            { key: 'weight_kg', placeholder: 'Weight (kg)', label: 'Weight (kg)' },
            { key: 'goals', placeholder: 'e.g. Lose weight, Build muscle', label: 'Goals (comma separated)' },
            { key: 'allergies', placeholder: 'e.g. Gluten, Lactose', label: 'Allergies' },
            { key: 'conditions', placeholder: 'e.g. Diabetes', label: 'Health conditions' },
            { key: 'medications', placeholder: 'e.g. Metformin 500mg', label: 'Medications' },
          ].map(({ key, placeholder, label }) => (
            <div key={key}>
              <p style={{ color: '#9CA3AF', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
              <input
                placeholder={placeholder}
                value={profileForm[key as keyof typeof profileForm]}
                onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                style={{
                  width: '100%', backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '14px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          ))}
          <button onClick={saveProfile} style={{
            width: '100%', padding: '16px',
            background: 'linear-gradient(135deg, #22C55E, #16A34A)',
            border: 'none', borderRadius: '16px', color: '#fff',
            fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
          }}>Save Profile</button>
        </div>
      </div>
    );
  }

  // RECORD DETAIL
  if (selectedRecord) {
    return (
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5', padding: '24px' }} className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedRecord(null)} style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{selectedRecord.title}</h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{new Date(selectedRecord.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div style={{ backgroundColor: '#111111', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>AI Analysis</p>
          </div>
          <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedRecord.ai_analysis}</p>
        </div>
        {selectedRecord.extracted_text && (
          <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#9CA3AF', marginBottom: '12px' }}>Extracted Data</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedRecord.extracted_text}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#F5F5F5' }} className="flex flex-col max-w-2xl mx-auto relative">

      {/* HEADER */}
      <div style={{ backgroundColor: 'rgba(17,17,17,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        className="sticky top-0 z-40 px-5 py-4 flex items-center justify-between backdrop-blur-xl">
        <div>
          <p style={{ color: '#9CA3AF', fontSize: '11px', letterSpacing: '0.05em' }} className="uppercase">{today}</p>
          <h1 style={{ color: '#22C55E', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            🧠 Health Brain
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)' }} className="px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span style={{ fontSize: '13px' }}>🔥</span>
            <span style={{ color: '#F5F5F5', fontSize: '13px', fontWeight: 600 }}>{streak}</span>
          </div>
          <button onClick={() => setShowProfile(true)} style={{
            width: 36, height: 36, backgroundColor: '#1A1A1A',
            border: '2px solid #22C55E', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '16px'
          }}>
            {profile?.name ? profile.name[0].toUpperCase() : '👤'}
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col" style={{ paddingBottom: '80px' }}>

        {/* CHAT TAB */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(34,197,94,0.3), rgba(59,130,246,0.1))',
                    border: '2px solid rgba(34,197,94,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', marginBottom: '20px',
                    boxShadow: '0 0 30px rgba(34,197,94,0.2)'
                  }}>🧠</div>
                  <p style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                    {profile?.name ? `Hey ${profile.name}! 👋` : 'How are you feeling?'}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Ask me anything about your health.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(59,130,246,0.6), rgba(34,197,94,0.3))',
                      border: '1px solid rgba(59,130,246,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', flexShrink: 0,
                      boxShadow: '0 0 12px rgba(59,130,246,0.3)'
                    }}>🧠</div>
                  )}
                  <div style={{
                    maxWidth: '78%', padding: '12px 16px', borderRadius: '18px',
                    fontSize: '14px', lineHeight: '1.6',
                    ...(msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      color: '#fff', borderBottomRightRadius: '4px',
                      boxShadow: '0 4px 20px rgba(34,197,94,0.25)'
                    } : {
                      backgroundColor: '#1A1A1A',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#F5F5F5', borderBottomLeftRadius: '4px',
                    })
                  }}>{msg.content}</div>
                </div>
              ))}
              {loading && (
                <div className="flex items-end gap-2">
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.6), rgba(34,197,94,0.3))',
                    border: '1px solid rgba(59,130,246,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                    boxShadow: '0 0 12px rgba(59,130,246,0.3)'
                  }}>🧠</div>
                  <div style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', borderBottomLeftRadius: '4px', padding: '14px 18px' }}>
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9CA3AF', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(10,10,10,0.9)' }} className="backdrop-blur-xl">
              <div className="flex gap-3 items-center">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Message Health Brain..."
                  style={{ flex: 1, backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '12px 20px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
                <button onClick={sendMessage} disabled={loading} style={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  background: loading ? '#1A1A1A' : 'linear-gradient(135deg, #22C55E, #16A34A)',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                  transition: 'all 0.2s ease'
                }}>➤</button>
              </div>
            </div>
          </div>
        )}

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Daily Log</h2>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Track your health data</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowScanSheet(true)} style={{
                  backgroundColor: '#1A1A1A', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: '14px', padding: '8px 14px', color: '#3B82F6',
                  fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                }}>📸 Scan</button>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
              </div>
            </div>

            {/* Scan Sheet */}
            {showScanSheet && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
                <div className="flex justify-between items-center mb-3">
                  <p style={{ fontWeight: 600, color: '#3B82F6' }}>📸 Scan Product</p>
                  <button onClick={() => { setShowScanSheet(false); setScanResult(''); setScanPreview(''); }} style={{ backgroundColor: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}>×</button>
                </div>
                <input ref={scanFileRef} type="file" accept="image/*" onChange={scanProduct} className="hidden" />
                <button onClick={() => scanFileRef.current?.click()} style={{
                  width: '100%', padding: '20px', border: '2px dashed rgba(59,130,246,0.3)',
                  borderRadius: '14px', backgroundColor: 'rgba(59,130,246,0.05)',
                  color: '#3B82F6', fontSize: '14px', cursor: 'pointer', marginBottom: '12px'
                }}>📷 Take photo of product label</button>

                {scanning && <p style={{ color: '#9CA3AF', fontSize: '14px', textAlign: 'center', padding: '12px' }}>Scanning product...</p>}

                {scanResult && (
                  <div>
                    <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>Scan result:</p>
                    <div style={{ backgroundColor: '#1A1A1A', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', color: '#F5F5F5', whiteSpace: 'pre-wrap' }}>{scanResult}</p>
                    </div>
                    <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Product name:</p>
                    <input placeholder="e.g. Protein Bar XYZ" value={scannedProductName}
                      onChange={(e) => setScannedProductName(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none', marginBottom: '8px' }} />
                    <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Save as:</p>
                    <div className="flex gap-2 mb-3">
                      {[{ type: 'meal' as LogType, emoji: '🍽️', label: 'Meal' }, { type: 'supplement' as LogType, emoji: '💊', label: 'Supplement' }].map(({ type, emoji, label }) => (
                        <button key={type} onClick={() => setLogType(type)} style={{
                          padding: '8px 16px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer',
                          ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff' } : { backgroundColor: '#1A1A1A', color: '#9CA3AF' })
                        }}>{emoji} {label}</button>
                      ))}
                    </div>
                    <button onClick={saveScanAsLog} style={{
                      width: '100%', padding: '12px',
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      border: 'none', borderRadius: '12px', color: '#fff',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}>Save to Log ✓</button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {logTypes.map(({ type, label, emoji }) => (
                <button key={type} onClick={() => setLogType(type)} style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' } : { backgroundColor: '#1A1A1A', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.06)' })
                }}>{emoji} {label}</button>
              ))}
            </div>

            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
              <textarea value={logInput} onChange={(e) => setLogInput(e.target.value)}
                placeholder={
                  logType === 'meal' ? 'e.g. Chicken 200g, rice 100g...' :
                  logType === 'supplement' ? 'e.g. Vitamin D 5000IU...' :
                  logType === 'sleep' ? 'e.g. 7h sleep, felt rested...' :
                  logType === 'energy' ? 'e.g. Energy 7/10...' : 'e.g. Headache in morning...'
                }
                rows={3}
                style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.6' }} />
              <button onClick={saveLog} style={{
                marginTop: '12px', width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                border: 'none', borderRadius: '14px', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)'
              }}>{logSaved ? '✅ Saved!' : 'Save Log'}</button>
            </div>

            <div>
              <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</p>
              <div className="space-y-3">
                {logs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '14px' }}>No logs for this day.</div>}
                {logs.map((log) => {
                  const logInfo = logTypes.find(l => l.type === log.type);
                  const borderColor = log.type === 'meal' ? '#F97316' : log.type === 'supplement' ? '#3B82F6' : log.type === 'sleep' ? '#A855F7' : log.type === 'energy' ? '#EAB308' : '#EF4444';
                  return (
                    <div key={log.id} style={{ backgroundColor: '#111111', borderRadius: '16px', padding: '14px 16px', borderLeft: `3px solid ${borderColor}` }}>
                      <div className="flex justify-between items-center mb-1">
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{logInfo?.emoji} {logInfo?.label}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(log.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.5' }}>{log.data.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Overview</h2>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Your health at a glance</p>
              </div>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
            </div>

            {profile && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
                <p style={{ color: '#22C55E', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>👤 {profile.name}</p>
                <div className="flex gap-4 flex-wrap">
                  {profile.age && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>🎂 {profile.age}y</span>}
                  {profile.weight_kg && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>⚖️ {profile.weight_kg}kg</span>}
                  {profile.height_cm && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>📏 {profile.height_cm}cm</span>}
                  {profile.goals?.[0] && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>🎯 {profile.goals[0]}</span>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Energy', value: logs.filter(l => l.type === 'energy').length, sub: 'logs today', color: '#EAB308', emoji: '⚡' },
                { label: 'Sleep', value: logs.filter(l => l.type === 'sleep').length, sub: 'logs today', color: '#A855F7', emoji: '😴' },
                { label: 'Meals', value: logs.filter(l => l.type === 'meal').length, sub: 'logged today', color: '#F97316', emoji: '🍽️' },
                { label: 'Supplements', value: `${takenCount}/${supplements.length}`, sub: 'taken today', color: '#22C55E', emoji: '💊' },
              ].map((card) => (
                <div key={card.label} style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px' }}>
                  <p style={{ fontSize: '22px', marginBottom: '6px' }}>{card.emoji}</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: card.color }}>{card.value}</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{card.label}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>{card.sub}</p>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Energy & Sleep — 7 days</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="energy" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} /><span style={{ fontSize: '11px', color: '#9CA3AF' }}>Energy</span></div>
                <div className="flex items-center gap-1.5"><div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3B82F6' }} /><span style={{ fontSize: '11px', color: '#9CA3AF' }}>Sleep</span></div>
              </div>
            </div>

            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Weekly Activity</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                  <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px' }} />
                  <Bar dataKey="energy" fill="#22C55E" radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* SUPPLEMENTS TAB */}
        {activeTab === 'supplements' && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Supplements</h2>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>{takenCount}/{supplements.length} taken today</p>
              </div>
              <button onClick={() => setAddingSupp(!addingSupp)} style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '14px', padding: '8px 16px', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
            </div>

            {supplements.length > 0 && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Today's progress</span>
                  <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 600 }}>{Math.round((takenCount / supplements.length) * 100)}%</span>
                </div>
                <div style={{ backgroundColor: '#1A1A1A', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '8px', background: 'linear-gradient(90deg, #22C55E, #A3E635)', width: `${(takenCount / supplements.length) * 100}%`, transition: 'width 0.5s ease', boxShadow: '0 0 10px rgba(34,197,94,0.5)' }} />
                </div>
              </div>
            )}

            {addingSupp && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }} className="space-y-3">
                {[
                  { key: 'name', placeholder: 'Name (e.g. Vitamin D3)' },
                  { key: 'dose', placeholder: 'Dose (e.g. 5000 IU)' },
                  { key: 'timing', placeholder: 'When (e.g. Morning with food)' },
                ].map(({ key, placeholder }) => (
                  <input key={key} placeholder={placeholder}
                    value={newSupp[key as keyof typeof newSupp]}
                    onChange={(e) => setNewSupp({ ...newSupp, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none' }} />
                ))}
                <button onClick={addSupplement} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save Supplement</button>
              </div>
            )}

            <div className="space-y-3">
              {supplements.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '40px', marginBottom: '12px' }}>💊</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: '#F5F5F5' }}>No supplements yet</p>
                  <p style={{ fontSize: '13px' }}>Add your first supplement above</p>
                </div>
              )}
              {supplements.map((supp) => {
                const taken = isSupplementTaken(supp.id);
                return (
                  <div key={supp.id} style={{ backgroundColor: '#111111', border: taken ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s ease', boxShadow: taken ? '0 0 20px rgba(34,197,94,0.1)' : 'none' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: taken ? '#22C55E' : '#F5F5F5' }}>{supp.name}</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{supp.dose} · {supp.timing}</p>
                    </div>
                    <button onClick={() => toggleSupplement(supp.id, !taken)} style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', ...(taken ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' } : { backgroundColor: '#1A1A1A', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }) }}>
                      {taken ? '✅ Taken' : 'Mark'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-5">
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Lab Results</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Upload & analyze your medical reports</p>
            </div>

            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
              <input placeholder="Record title (e.g. Blood Test March 2026)" value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                style={{ width: '100%', backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none', marginBottom: '12px' }} />
              <input ref={fileRef} type="file" accept="image/*" onChange={analyzeFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', padding: '28px', border: '2px dashed rgba(34,197,94,0.3)', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.05)', color: '#22C55E', fontSize: '14px', cursor: 'pointer' }}>
                <p style={{ fontSize: '28px', marginBottom: '8px' }}>📋</p>
                <p style={{ fontWeight: 600 }}>Upload lab result</p>
                <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Image will be analyzed and deleted</p>
              </button>
            </div>

            {analyzing && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔬</p>
                <p style={{ color: '#F5F5F5', fontWeight: 600, marginBottom: '6px' }}>Analyzing...</p>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>AI is reading your lab results</p>
              </div>
            )}

            {analysis && !analyzing && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 0 30px rgba(34,197,94,0.05)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>Latest Analysis</p>
                </div>
                <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{analysis}</p>
              </div>
            )}

            {/* Records History */}
            {records.length > 0 && (
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</p>
                <div className="space-y-3">
                  {records.map((record) => (
                    <button key={record.id} onClick={() => setSelectedRecord(record)} style={{
                      width: '100%', backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '16px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.2s'
                    }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>{record.title}</p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF' }}>🔬 {record.record_type} · {new Date(record.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{ color: '#22C55E', fontSize: '18px' }}>›</span>
                      </div>
                      {record.ai_analysis && (
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', lineHeight: '1.4' }}>
                          {record.ai_analysis.substring(0, 80)}...
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '672px',
        backgroundColor: 'rgba(17,17,17,0.9)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        padding: '8px 16px 12px', zIndex: 50
      }}>
        <div className="flex justify-around">
          {tabs.map(({ tab, emoji, label }) => {
            const isActive = activeTab === tab;
            const isLogTab = tab === 'log';
            return (
              <button key={tab} onClick={() => setActiveTab(tab as any)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: isLogTab ? '0' : '8px 12px', border: 'none', cursor: 'pointer',
                backgroundColor: 'transparent', transition: 'all 0.2s',
              }}>
                {isLogTab ? (
                  <div style={{
                    width: 50, height: 50, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                    marginTop: '-20px'
                  }}>＋</div>
                ) : (
                  <>
                    <span style={{ fontSize: '20px', opacity: isActive ? 1 : 0.5 }}>{emoji}</span>
                    <span style={{ fontSize: '10px', color: isActive ? '#22C55E' : '#6B7280', fontWeight: isActive ? 600 : 400 }}>{label}</span>
                    {isActive && <div style={{ width: 16, height: 2, backgroundColor: '#22C55E', borderRadius: '2px', boxShadow: '0 0 6px #22C55E' }} />}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #6B7280; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}