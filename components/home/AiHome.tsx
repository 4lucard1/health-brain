'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { useHealthData } from '@/hooks/useHealthData';

interface UserProfile {
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  goals?: string[];
  [key: string]: any;
}

interface AiHomeProps {
  profile: UserProfile | null;
  onNavigate: (tab: 'log' | 'profile') => void;
}

const renderText = (text: string) => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      parts.push(<strong key={key++} style={{ color: '#22C55E', fontWeight: 700 }}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
};

const glass = {
  backgroundColor: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '24px',
};

export default function AiHome({ profile, onNavigate }: AiHomeProps) {
  const { messages, loading, sendMessage, messagesEndRef } = useChat(profile);
  const { healthScore, streak, todayStats, refresh } = useHealthData();
  const [inputValue, setInputValue] = useState('');
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [quickLogType, setQuickLogType] = useState('');
  const [quickLogText, setQuickLogText] = useState('');
  const [logSaving, setLogSaving] = useState(false);
  const scanRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const scoreColor = healthScore >= 75 ? '#22C55E' : healthScore >= 50 ? '#EAB308' : '#EF4444';

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleQuickLog = async () => {
    if (!quickLogText.trim() || !quickLogType) return;
    setLogSaving(true);
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: quickLogType, data: { note: quickLogText, timestamp: new Date().toISOString() } }),
      });
      setQuickLogText('');
      setQuickLogType('');
      setShowQuickLog(false);
      refresh();
      sendMessage(`I just logged: ${quickLogText}`);
    } finally {
      setLogSaving(false);
    }
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>, scanType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setShowScan(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scanType', scanType);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.result) {
        await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: scanType === 'food' ? 'meal' : 'supplement', data: { note: data.result, timestamp: new Date().toISOString() } }),
        });
        refresh();
        sendMessage(`I scanned and logged: ${data.result.slice(0, 100)}`);
      } else {
        sendMessage(data.message || 'Could not analyze the image.');
      }
    } catch {
      sendMessage('Scan failed. Please try again.');
    } finally {
      setScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const quickLogTypes = [
    { type: 'meal', label: 'Meal', emoji: '🍽️', placeholder: 'e.g. Chicken 200g, rice, salad...', color: 'rgba(249,115,22,0.12)' },
    { type: 'sleep', label: 'Sleep', emoji: '😴', placeholder: 'e.g. 7h, felt rested...', color: 'rgba(168,85,247,0.12)' },
    { type: 'energy', label: 'Energy', emoji: '⚡', placeholder: 'e.g. Energy 8/10...', color: 'rgba(234,179,8,0.12)' },
    { type: 'supplement', label: 'Supplement', emoji: '💊', placeholder: 'e.g. Vitamin D3 5000IU...', color: 'rgba(34,197,94,0.12)' },
  ];

  const scanOptions = [
    { label: 'Food Photo', sub: 'AI estimates calories', type: 'food', emoji: '📷', color: 'rgba(249,115,22,0.1)' },
    { label: 'Product Label', sub: 'Nutrition facts', type: 'label', emoji: '🏷️', color: 'rgba(59,130,246,0.1)' },
    { label: 'Supplement', sub: 'Dosage & info', type: 'supplement', emoji: '💊', color: 'rgba(34,197,94,0.1)' },
    { label: 'Medication', sub: 'Drug information', type: 'supplement', emoji: '💉', color: 'rgba(168,85,247,0.1)' },
  ];

  return (
    <div style={{ backgroundColor: '#0A0A0A', color: '#F5F5F5', overflowY: 'auto', minHeight: '100dvh' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 20px 120px' }}>

        {/* ── HERO ── */}
        <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px', marginBottom: '40px' }}>

          {/* Orb */}
          <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.25), rgba(59,130,246,0.1))', filter: 'blur(28px)' }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}
              animate={{ boxShadow: ['0 0 40px rgba(34,197,94,0.4)', '0 0 60px rgba(59,130,246,0.4)', '0 0 40px rgba(34,197,94,0.4)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              ✦
            </motion.div>
          </div>

          {/* Greeting */}
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 600, letterSpacing: '-0.03em', marginBottom: '6px' }}>
              {greeting()}{profile?.name ? `, ${profile.name}` : ''}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px' }}>
              {healthScore === 0 ? 'Start logging to see your health score' :
               healthScore >= 75 ? 'Your health looks great today' :
               'Let\'s improve your health today'}
            </p>
            {streak > 0 && (
              <p style={{ color: '#F97316', fontSize: '13px', marginTop: '6px', fontWeight: 500 }}>
                🔥 {streak} day streak
              </p>
            )}
          </div>

          {/* Smart Input */}
          <div style={{ width: '100%', maxWidth: '520px' }}>
            <div style={{ ...glass, padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '32px' }}>
              <button onClick={() => { setShowQuickLog(!showQuickLog); setShowScan(false); }}
                style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: showQuickLog ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', border: 'none', color: showQuickLog ? '#22C55E' : 'rgba(255,255,255,0.6)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}>
                ＋
              </button>
              <button onClick={() => { setShowScan(!showScan); setShowQuickLog(false); }}
                style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: showScan ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.07)', border: 'none', color: showScan ? '#3B82F6' : 'rgba(255,255,255,0.6)', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}>
                📷
              </button>
              <input
                type="text" value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything about your health..."
                style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '15px', outline: 'none', padding: '8px 4px' }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleSend} disabled={loading || !inputValue.trim()}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', opacity: loading || !inputValue.trim() ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                {loading ? (
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : '➤'}
              </motion.button>
            </div>

            {/* Quick Log */}
            <AnimatePresence>
              {showQuickLog && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{ ...glass, marginTop: '10px', padding: '18px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px' }}>Quick Log</p>
                      <button onClick={() => { setShowQuickLog(false); setQuickLogType(''); setQuickLogText(''); }}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: quickLogType ? '14px' : '0' }}>
                      {quickLogTypes.map(({ type, label, emoji, color }) => (
                        <button key={type} onClick={() => setQuickLogType(quickLogType === type ? '' : type)}
                          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '16px', border: `1px solid ${quickLogType === type ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.07)'}`, backgroundColor: quickLogType === type ? 'rgba(34,197,94,0.1)' : color, cursor: 'pointer', transition: 'all 0.2s' }}>
                          <span style={{ fontSize: '20px' }}>{emoji}</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#F5F5F5' }}>{label}</span>
                        </button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {quickLogType && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                          <textarea
                            placeholder={quickLogTypes.find(t => t.type === quickLogType)?.placeholder || ''}
                            value={quickLogText}
                            onChange={(e) => setQuickLogText(e.target.value)}
                            rows={2}
                            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '12px', color: '#F5F5F5', fontSize: '15px', outline: 'none', resize: 'none', marginBottom: '10px' }}
                          />
                          <button onClick={handleQuickLog} disabled={logSaving || !quickLogText.trim()}
                            style={{ width: '100%', padding: '13px', borderRadius: '14px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: logSaving || !quickLogText.trim() ? 0.5 : 1 }}>
                            {logSaving ? 'Saving...' : 'Save Log'}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan */}
            <AnimatePresence>
              {showScan && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div style={{ ...glass, marginTop: '10px', padding: '18px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <p style={{ fontWeight: 600, fontSize: '14px' }}>Scan</p>
                      <button onClick={() => setShowScan(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {scanOptions.map(({ label, sub, type, emoji, color }, i) => {
                        const refKey = `scan-${i}`;
                        return (
                          <div key={i}>
                            <input ref={el => { scanRefs.current[refKey] = el; }}
                              type="file" accept="image/*" capture="environment"
                              onChange={(e) => handleScanFile(e, type)} style={{ display: 'none' }} />
                            <button onClick={() => scanRefs.current[refKey]?.click()}
                              style={{ width: '100%', padding: '14px 10px', borderRadius: '16px', backgroundColor: color, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                              <p style={{ fontSize: '24px', marginBottom: '6px' }}>{emoji}</p>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: '#F5F5F5', marginBottom: '2px' }}>{label}</p>
                              <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                      <p style={{ fontSize: '11px', color: 'rgba(234,179,8,0.8)', lineHeight: '1.5' }}>⚠️ For reference only. Consult a healthcare professional.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanning indicator */}
            <AnimatePresence>
              {scanning && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div style={{ width: '14px', height: '14px', border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22C55E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  <p style={{ fontSize: '13px', color: '#22C55E' }}>Analyzing...</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ── CHAT MESSAGES ── */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '48px' }}>
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div key={message.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '88%', display: 'flex', flexDirection: 'column', alignItems: message.type === 'user' ? 'flex-end' : 'flex-start', gap: '10px' }}>
                  <div style={{
                    padding: '13px 17px', fontSize: '14px', lineHeight: '1.65',
                    borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                    ...(message.type === 'user' ? {
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      color: '#fff', boxShadow: '0 4px 20px rgba(34,197,94,0.2)'
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(16px)', color: '#F5F5F5',
                    })
                  }}>
                    {renderText(message.text)}
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && index === messages.length - 1 && !loading && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {message.suggestions.map((s, idx) => (
                        <motion.button key={idx} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => sendMessage(s)}
                          style={{ padding: '8px 16px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '13px 17px', borderRadius: '4px 20px 20px 20px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.4)' }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* ── TODAY OVERVIEW ── */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '16px' }}>Today Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            {/* Health Score */}
            <div style={{ ...glass, gridColumn: '1 / -1', padding: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '8px' }}>Health Score</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '48px', fontWeight: 600, color: scoreColor, lineHeight: 1 }}>{healthScore}</span>
                  <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.25)' }}>/100</span>
                </div>
                <p style={{ fontSize: '12px', color: scoreColor }}>
                  {healthScore === 0 ? 'Log meals, sleep & supplements' :
                   healthScore >= 75 ? '↑ Great job today' :
                   healthScore >= 50 ? '↑ Keep going' : 'Log more to improve'}
                </p>
              </div>
              <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                  <motion.circle cx="55" cy="55" r="46" fill="none"
                    stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - healthScore / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 6px ${scoreColor})` }} />
                </svg>
              </div>
            </div>

            {/* Sleep */}
            <div style={{ ...glass, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>😴</div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Last night</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '4px' }}>Sleep</p>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{todayStats.sleep ? 'Logged ✓' : 'Not logged'}</p>
              <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #A855F7, #3B82F6)' }}
                  initial={{ width: 0 }} animate={{ width: todayStats.sleep ? '85%' : '0%' }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
            </div>

            {/* Energy */}
            <div style={{ ...glass, padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>⚡</div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Today</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '4px' }}>Energy</p>
              <p style={{ fontSize: '18px', fontWeight: 600, marginBottom: '10px' }}>{todayStats.energy > 0 ? `${todayStats.energy} log${todayStats.energy > 1 ? 's' : ''}` : 'Not logged'}</p>
              <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #EAB308, #F97316)' }}
                  initial={{ width: 0 }} animate={{ width: todayStats.energy > 0 ? '75%' : '0%' }} transition={{ duration: 1, delay: 0.4 }} />
              </div>
            </div>

            {/* Supplements */}
            <div style={{ ...glass, gridColumn: '1 / -1', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>💊</div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '2px' }}>Supplements</p>
                  <p style={{ fontSize: '15px', fontWeight: 600 }}>
                    {todayStats.supplementsTotal === 0 ? 'None added yet' : `${todayStats.supplementsTaken} of ${todayStats.supplementsTotal} taken`}
                  </p>
                </div>
              </div>
              {todayStats.supplementsTotal > 0 && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  {Array.from({ length: Math.min(todayStats.supplementsTotal, 8) }).map((_, i) => (
                    <div key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: i < todayStats.supplementsTaken ? '#22C55E' : 'rgba(255,255,255,0.1)', boxShadow: i < todayStats.supplementsTaken ? '0 0 6px rgba(34,197,94,0.6)' : 'none', transition: 'all 0.3s' }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SMART ACTIONS ── */}
        <section>
          <h2 style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '14px' }}>Smart Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { emoji: '🍽️', label: 'Log meal', sub: `${todayStats.meals} logged today`, bg: 'rgba(249,115,22,0.1)', action: () => { setQuickLogType('meal'); setShowQuickLog(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { emoji: '😴', label: 'Log sleep', sub: todayStats.sleep ? 'Already logged ✓' : 'Not logged yet', bg: 'rgba(168,85,247,0.1)', action: () => { setQuickLogType('sleep'); setShowQuickLog(true); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { emoji: '💊', label: 'Supplements', sub: `${todayStats.supplementsTaken}/${todayStats.supplementsTotal} taken today`, bg: 'rgba(34,197,94,0.1)', action: () => onNavigate('profile') },
              { emoji: '📋', label: 'View all logs', sub: 'See today\'s full history', bg: 'rgba(59,130,246,0.1)', action: () => onNavigate('log') },
            ].map(({ emoji, label, sub, bg, action }, i) => (
              <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={action}
                style={{ ...glass, padding: '15px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '21px', flexShrink: 0 }}>
                  {emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '20px' }}>›</span>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}