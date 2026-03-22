'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type LogType = 'meal' | 'supplement' | 'sleep' | 'energy' | 'symptom';

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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'log' | 'supplements' | 'labs' | 'dashboard'>('chat');
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
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [streak] = useState(7);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'supplements') { fetchSupplements(); fetchSupplementLogs(); }
    if (activeTab === 'dashboard' || activeTab === 'log') { fetchLogs(); }
  }, [activeTab, selectedDate]);

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
    setShowLogSheet(false);
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
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysis(data.analysis || data.error);
    } catch (error) {
      console.error(error);
      setAnalysis('Greška pri analizi.');
    } finally {
      setAnalyzing(false);
    }
  };

  const logTypes: { type: LogType; label: string; emoji: string }[] = [
    { type: 'meal', label: 'Obrok', emoji: '🍽️' },
    { type: 'supplement', label: 'Suplement', emoji: '💊' },
    { type: 'sleep', label: 'San', emoji: '😴' },
    { type: 'energy', label: 'Energija', emoji: '⚡' },
    { type: 'symptom', label: 'Simptom', emoji: '⚠️' },
  ];

  const logColors: Record<string, string> = {
    meal: 'border-orange-500',
    supplement: 'border-blue-500',
    sleep: 'border-purple-500',
    energy: 'border-yellow-500',
    symptom: 'border-red-500',
  };

  const logBg: Record<string, string> = {
    meal: 'bg-orange-500/10',
    supplement: 'bg-blue-500/10',
    sleep: 'bg-purple-500/10',
    energy: 'bg-yellow-500/10',
    symptom: 'bg-red-500/10',
  };

  const takenCount = supplements.filter(s => isSupplementTaken(s.id)).length;

  const chartData = [
    { day: 'Mon', energy: 6, sleep: 7 },
    { day: 'Tue', energy: 7, sleep: 6 },
    { day: 'Wed', energy: 5, sleep: 8 },
    { day: 'Thu', energy: 8, sleep: 7 },
    { day: 'Fri', energy: 7, sleep: 6 },
    { day: 'Sat', energy: 9, sleep: 8 },
    { day: 'Sun', energy: 8, sleep: 7 },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const tabs = [
    { tab: 'chat', emoji: '💬', label: 'Chat' },
    { tab: 'log', emoji: '＋', label: 'Log' },
    { tab: 'dashboard', emoji: '📊', label: 'Stats' },
    { tab: 'supplements', emoji: '💊', label: 'Suppl' },
    { tab: 'labs', emoji: '🔬', label: 'Labs' },
  ];

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
          <div style={{ width: 36, height: 36, backgroundColor: '#1A1A1A', border: '2px solid #22C55E', borderRadius: '50%' }}
            className="flex items-center justify-center">
            <span style={{ fontSize: '16px' }}>👤</span>
          </div>
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
                  <p style={{ color: '#F5F5F5', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>How are you feeling?</p>
                  <p style={{ color: '#9CA3AF', fontSize: '14px' }}>Ask me anything about your health.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  style={{ animation: 'fadeSlideUp 0.3s ease forwards' }}>
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
                      color: '#fff',
                      borderBottomRightRadius: '4px',
                      boxShadow: '0 4px 20px rgba(34,197,94,0.25)'
                    } : {
                      backgroundColor: '#1A1A1A',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#F5F5F5',
                      borderBottomLeftRadius: '4px',
                    })
                  }}>
                    {msg.content}
                  </div>
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
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9CA3AF',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* CHAT INPUT */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(10,10,10,0.9)' }}
              className="backdrop-blur-xl">
              <div className="flex gap-3 items-center">
                <input
                  type="text" value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Message Health Brain..."
                  style={{
                    flex: 1, backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px', padding: '12px 20px', color: '#F5F5F5', fontSize: '14px',
                    outline: 'none'
                  }}
                />
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
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5' }}>Daily Log</h2>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Track your health data</p>
              </div>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
            </div>

            {/* Log type selector */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {logTypes.map(({ type, label, emoji }) => (
                <button key={type} onClick={() => setLogType(type)} style={{
                  padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                  whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  ...(logType === type ? {
                    background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                    color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
                  } : {
                    backgroundColor: '#1A1A1A', color: '#9CA3AF',
                    border: '1px solid rgba(255,255,255,0.06)'
                  })
                }}>{emoji} {label}</button>
              ))}
            </div>

            {/* Input area */}
            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
              <textarea value={logInput} onChange={(e) => setLogInput(e.target.value)}
                placeholder={
                  logType === 'meal' ? 'e.g. Chicken 200g, rice 100g, broccoli...' :
                  logType === 'supplement' ? 'e.g. Vitamin D 5000IU, Omega-3 2g...' :
                  logType === 'sleep' ? 'e.g. 7h sleep, woke up 2x, felt rested...' :
                  logType === 'energy' ? 'e.g. Energy 7/10, tired after lunch...' :
                  'e.g. Headache in morning, gone after coffee...'
                }
                rows={3}
                style={{
                  width: '100%', backgroundColor: 'transparent', border: 'none',
                  color: '#F5F5F5', fontSize: '14px', resize: 'none', outline: 'none',
                  lineHeight: '1.6'
                }} />
              <button onClick={saveLog} style={{
                marginTop: '12px', width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                border: 'none', borderRadius: '14px', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(34,197,94,0.3)', transition: 'all 0.2s'
              }}>
                {logSaved ? '✅ Saved!' : 'Save Log'}
              </button>
            </div>

            {/* History */}
            <div>
              <p style={{ color: '#9CA3AF', fontSize: '13px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</p>
              <div className="space-y-3">
                {logs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '14px' }}>
                    No logs for this day.
                  </div>
                )}
                {logs.map((log) => {
                  const logInfo = logTypes.find(l => l.type === log.type);
                  return (
                    <div key={log.id} style={{
                      backgroundColor: '#111111', borderRadius: '16px', padding: '14px 16px',
                      borderLeft: `3px solid ${log.type === 'meal' ? '#F97316' : log.type === 'supplement' ? '#3B82F6' : log.type === 'sleep' ? '#A855F7' : log.type === 'energy' ? '#EAB308' : '#EF4444'}`
                    }}>
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
            <div className="mb-5">
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5' }}>Overview</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Your health at a glance</p>
            </div>

            {/* Insight cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Energy', value: `${logs.filter(l => l.type === 'energy').length}`, sub: 'logs today', color: '#EAB308', emoji: '⚡' },
                { label: 'Sleep', value: `${logs.filter(l => l.type === 'sleep').length}`, sub: 'logs today', color: '#A855F7', emoji: '😴' },
                { label: 'Meals', value: `${logs.filter(l => l.type === 'meal').length}`, sub: 'logged today', color: '#F97316', emoji: '🍽️' },
                { label: 'Supplements', value: `${takenCount}/${supplements.length}`, sub: 'taken today', color: '#22C55E', emoji: '💊' },
              ].map((card) => (
                <div key={card.label} style={{
                  backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '20px', padding: '16px'
                }}>
                  <p style={{ fontSize: '22px', marginBottom: '6px' }}>{card.emoji}</p>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: card.color }}>{card.value}</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{card.label}</p>
                  <p style={{ fontSize: '11px', color: '#6B7280' }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Energy chart */}
            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '16px' }}>Energy & Sleep — 7 days</p>
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

            {/* Bar chart */}
            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '16px' }}>Weekly Activity</p>
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
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5' }}>Supplements</h2>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>{takenCount}/{supplements.length} taken today</p>
              </div>
              <button onClick={() => setAddingSupp(!addingSupp)} style={{
                backgroundColor: '#1A1A1A', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '14px', padding: '8px 16px', color: '#22C55E',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>+ Add</button>
            </div>

            {supplements.length > 0 && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Today's progress</span>
                  <span style={{ fontSize: '13px', color: '#22C55E', fontWeight: 600 }}>{Math.round((takenCount / supplements.length) * 100)}%</span>
                </div>
                <div style={{ backgroundColor: '#1A1A1A', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '8px',
                    background: 'linear-gradient(90deg, #22C55E, #A3E635)',
                    width: `${(takenCount / supplements.length) * 100}%`,
                    transition: 'width 0.5s ease',
                    boxShadow: '0 0 10px rgba(34,197,94,0.5)'
                  }} />
                </div>
              </div>
            )}

            {addingSupp && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }} className="space-y-3">
                {['name', 'dose', 'timing'].map((field) => (
                  <input key={field}
                    placeholder={field === 'name' ? 'Name (e.g. Vitamin D3)' : field === 'dose' ? 'Dose (e.g. 5000 IU)' : 'When (e.g. Morning with food)'}
                    value={newSupp[field as keyof typeof newSupp]}
                    onChange={(e) => setNewSupp({ ...newSupp, [field]: e.target.value })}
                    style={{
                      width: '100%', backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px', padding: '12px 16px', color: '#F5F5F5', fontSize: '14px', outline: 'none'
                    }} />
                ))}
                <button onClick={addSupplement} style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  border: 'none', borderRadius: '14px', color: '#fff',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                }}>Save Supplement</button>
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
                  <div key={supp.id} style={{
                    backgroundColor: '#111111',
                    border: taken ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '20px', padding: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    boxShadow: taken ? '0 0 20px rgba(34,197,94,0.1)' : 'none'
                  }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: taken ? '#22C55E' : '#F5F5F5' }}>{supp.name}</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{supp.dose} · {supp.timing}</p>
                    </div>
                    <button onClick={() => toggleSupplement(supp.id, !taken)} style={{
                      padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                      ...(taken ? {
                        background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                        color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)'
                      } : {
                        backgroundColor: '#1A1A1A', color: '#9CA3AF',
                        border: '1px solid rgba(255,255,255,0.08)'
                      })
                    }}>{taken ? '✅ Taken' : 'Mark'}</button>
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
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F5F5F5' }}>Lab Results</h2>
              <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Upload & analyze your medical reports</p>
            </div>

            <div style={{ backgroundColor: '#111111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={analyzeFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '32px',
                border: '2px dashed rgba(34,197,94,0.3)', borderRadius: '16px',
                backgroundColor: 'rgba(34,197,94,0.05)', color: '#22C55E',
                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📋</p>
                <p style={{ fontWeight: 600 }}>{preview ? 'Change image' : 'Upload lab result'}</p>
                <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Tap to select image</p>
              </button>
            </div>

            {preview && (
              <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
                <img src={preview} alt="Lab result" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
              </div>
            )}

            {analyzing && (
              <div style={{ backgroundColor: '#111111', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔬</p>
                <p style={{ color: '#F5F5F5', fontWeight: 600, marginBottom: '6px' }}>Analyzing...</p>
                <p style={{ color: '#9CA3AF', fontSize: '13px' }}>AI is reading your lab results</p>
              </div>
            )}

            {analysis && (
              <div style={{
                backgroundColor: '#111111',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '20px', padding: '20px',
                boxShadow: '0 0 30px rgba(34,197,94,0.05)'
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>AI Analysis</p>
                </div>
                <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{analysis}</p>
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
        padding: '8px 16px 12px',
        zIndex: 50
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
                ...(isLogTab ? {} : {})
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
                    <span style={{ fontSize: '20px', filter: isActive ? 'none' : 'grayscale(0.5)', opacity: isActive ? 1 : 0.5 }}>{emoji}</span>
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
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #6B7280; }
        ::-webkit-scrollbar { width: 0px; }
      `}</style>
    </div>
  );
}