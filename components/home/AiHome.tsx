'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/hooks/useChat';
import { useHealthData } from '@/hooks/useHealthData';

interface UserProfile {
  name: string;
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
    { type: 'meal', label: 'Meal', emoji: '🍽️', placeholder: 'e.g. Chicken 200g, rice...', color: 'rgba(249,115,22,0.12)' },
    { type: 'sleep', label: 'Sleep', emoji: '😴', placeholder: 'e.g. 7h, felt rested...', color: 'rgba(168,85,247,0.12)' },
    { type: 'energy', label: 'Energy', emoji: '⚡', placeholder: 'e.g. Energy 8/10...', color: 'rgba(234,179,8,0.12)' },
    { type: 'supplement', label: 'Supplement', emoji: '💊', placeholder: 'e.g. Vitamin D3 5000IU...', color: 'rgba(34,197,94,0.12)' },
  ];

  const scanOptions = [
    { label: 'Food Photo', sub: 'AI estimates calories', type: 'food', emoji: '📷', color: 'rgba(249,115,22,0.1)' },
    { label: 'Product Label', sub: 'Nutrition facts', type: 'label', emoji: '🏷️', color: 'rgba(59,130,246,0.1)' },
    { label: 'Supplement', sub: 'Dosage & info', type: 'supplement', emoji: '💊', color: 'rgba(34,197,94,0.1)' },
    { label: 'Medication', sub: 'Drug info', type: 'supplement', emoji: '💉', color: 'rgba(168,85,247,0.1)' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      backgroundColor: '#0A0A0A',
      color: '#F5F5F5',
      overflow: 'hidden',
    }}>

      {/* ── TOP HEADER (fixed) ── */}
      <div style={{
        flexShrink: 0,
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          {/* Orb + greeting row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
              <motion.div
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.4), rgba(59,130,246,0.2))', filter: 'blur(8px)' }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                style={{ position: 'relative', width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}
                animate={{ boxShadow: ['0 0 20px rgba(34,197,94,0.4)', '0 0 30px rgba(59,130,246,0.4)', '0 0 20px rgba(34,197,94,0.4)'] }}
                transition={{ duration: 3, repeat: Infinity }}>
                ✦
              </motion.div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {greeting()}{profile?.name ? `, ${profile.name}` : ''}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {healthScore === 0 ? 'Start logging to see your score' :
                 healthScore >= 75 ? 'Health looks great today' :
                 'Let\'s improve your health'}
              </p>
            </div>
            {/* Score pill */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '6px 12px', borderRadius: '16px',
              backgroundColor: `${scoreColor}15`,
              border: `1px solid ${scoreColor}40`,
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{healthScore}</span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '1px' }}>score</span>
            </div>
          </div>

          {/* Context strip */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { label: `${todayStats.meals} meals`, emoji: '🍽️', active: todayStats.meals > 0 },
              { label: todayStats.sleep ? 'Sleep ✓' : 'No sleep', emoji: '😴', active: todayStats.sleep },
              { label: `${todayStats.supplementsTaken}/${todayStats.supplementsTotal} suppl.`, emoji: '💊', active: todayStats.supplementsTaken > 0 },
              { label: streak > 0 ? `🔥 ${streak}d` : 'No streak', emoji: '', active: streak > 0 },
            ].map((item, i) => (
              <div key={i} style={{
                flexShrink: 0, padding: '4px 10px', borderRadius: '20px', fontSize: '11px',
                backgroundColor: item.active ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${item.active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                color: item.active ? '#22C55E' : 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
              }}>
                {item.emoji} {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MESSAGES (scrollable middle) ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '16px 20px',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div key={message.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: message.type === 'user' ? 'flex-end' : 'flex-start', gap: '10px' }}>
                  <div style={{
                    padding: '12px 16px', fontSize: '15px', lineHeight: '1.6',
                    borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                    ...(message.type === 'user' ? {
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      color: '#fff', boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#F5F5F5',
                    })
                  }}>
                    {renderText(message.text)}
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && index === messages.length - 1 && !loading && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {message.suggestions.map((s, idx) => (
                        <motion.button key={idx} whileTap={{ scale: 0.96 }}
                          onClick={() => sendMessage(s)}
                          style={{ padding: '8px 16px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex' }}>
              <div style={{ padding: '12px 16px', borderRadius: '4px 20px 20px 20px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.4)' }}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── BOTTOM INPUT (fixed) ── */}
      <div style={{
        flexShrink: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,10,10,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: `10px 16px max(14px, env(safe-area-inset-bottom))`,
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>

          {/* Quick Log Sheet */}
          <AnimatePresence>
            {showQuickLog && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ ...glass, padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px' }}>Quick Log</p>
                    <button onClick={() => { setShowQuickLog(false); setQuickLogType(''); setQuickLogText(''); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: quickLogType ? '10px' : '0' }}>
                    {quickLogTypes.map(({ type, label, emoji, color }) => (
                      <button key={type} onClick={() => setQuickLogType(quickLogType === type ? '' : type)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '14px', border: `1px solid ${quickLogType === type ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.06)'}`, backgroundColor: quickLogType === type ? 'rgba(34,197,94,0.1)' : color, cursor: 'pointer' }}>
                        <span style={{ fontSize: '18px' }}>{emoji}</span>
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
                          style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px', color: '#F5F5F5', fontSize: '15px', outline: 'none', resize: 'none', marginTop: '8px', marginBottom: '8px' }}
                        />
                        <button onClick={handleQuickLog} disabled={logSaving || !quickLogText.trim()}
                          style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: logSaving || !quickLogText.trim() ? 0.5 : 1 }}>
                          {logSaving ? 'Saving...' : 'Save Log'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scan Sheet */}
          <AnimatePresence>
            {showScan && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ ...glass, padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ fontWeight: 600, fontSize: '13px' }}>Scan</p>
                    <button onClick={() => setShowScan(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '18px', cursor: 'pointer', padding: '0 2px' }}>×</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {scanOptions.map(({ label, sub, type, emoji, color }, i) => {
                      const refKey = `scan-${i}`;
                      return (
                        <div key={i}>
                          <input ref={el => { scanRefs.current[refKey] = el; }}
                            type="file" accept="image/*" capture="environment"
                            onChange={(e) => handleScanFile(e, type)} style={{ display: 'none' }} />
                          <button onClick={() => scanRefs.current[refKey]?.click()}
                            style={{ width: '100%', padding: '12px 8px', borderRadius: '14px', backgroundColor: color, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'center' }}>
                            <p style={{ fontSize: '22px', marginBottom: '4px' }}>{emoji}</p>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: '#F5F5F5', marginBottom: '1px' }}>{label}</p>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <p style={{ fontSize: '10px', color: 'rgba(234,179,8,0.8)', lineHeight: '1.5' }}>⚠️ For reference only. Consult a healthcare professional.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanning indicator */}
          <AnimatePresence>
            {scanning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ width: '14px', height: '14px', border: '2px solid rgba(34,197,94,0.3)', borderTopColor: '#22C55E', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: '#22C55E' }}>Analyzing...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '28px', padding: '7px 7px 7px 16px' }}>
            <button onClick={() => { setShowQuickLog(!showQuickLog); setShowScan(false); }}
              style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: showQuickLog ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)', border: 'none', color: showQuickLog ? '#22C55E' : 'rgba(255,255,255,0.5)', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}>
              ＋
            </button>
            <button onClick={() => { setShowScan(!showScan); setShowQuickLog(false); }}
              style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: showScan ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)', border: 'none', color: showScan ? '#3B82F6' : 'rgba(255,255,255,0.5)', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }}>
              📷
            </button>
            <input
              type="text" value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything about your health..."
              style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '15px', outline: 'none', minWidth: 0 }}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleSend} disabled={loading || !inputValue.trim()}
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #22C55E, #3B82F6)', border: 'none', color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', opacity: loading || !inputValue.trim() ? 0.4 : 1, transition: 'opacity 0.2s' }}>
              {loading
                ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : '➤'}
            </motion.button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}