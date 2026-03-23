'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Moon, Zap, Pill, UtensilsCrossed, BedDouble, Sparkles, Camera, Plus, X } from 'lucide-react';
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

// Markdown renderer
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
  const scanFileRef = useRef<HTMLInputElement>(null);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const scoreColor = healthScore >= 75 ? '#22C55E' : healthScore >= 50 ? '#EAB308' : '#EF4444';
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (healthScore / 100) * circumference;

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestion = (s: string) => {
    sendMessage(s);
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
        sendMessage(`I just scanned and logged: ${data.result.slice(0, 100)}...`);
      } else {
        sendMessage(data.message || 'Could not analyze the image. Please try again.');
      }
    } catch {
      sendMessage('Scan failed. Please try again.');
    } finally {
      setScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  const quickLogTypes = [
    { type: 'meal', label: 'Meal', icon: UtensilsCrossed, color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400', placeholder: 'e.g. Chicken 200g, rice, salad...' },
    { type: 'sleep', label: 'Sleep', icon: BedDouble, color: 'from-purple-500/20 to-blue-500/20', iconColor: 'text-purple-400', placeholder: 'e.g. 7h, felt rested...' },
    { type: 'energy', label: 'Energy', icon: Zap, color: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-400', placeholder: 'e.g. Energy 8/10, feeling great...' },
    { type: 'supplement', label: 'Supplement', icon: Pill, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400', placeholder: 'e.g. Vitamin D3 5000IU...' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-10">

        {/* ── HERO SECTION ── */}
        <section className="flex flex-col items-center text-center space-y-8">

          {/* Glowing Orb */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 blur-3xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div className="absolute inset-4 rounded-full bg-gradient-to-br from-green-500/30 to-blue-500/30 blur-2xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.div
              className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-blue-500 shadow-2xl shadow-green-500/50"
              animate={{ boxShadow: ['0 0 60px rgba(34,197,94,0.5)', '0 0 80px rgba(59,130,246,0.5)', '0 0 60px rgba(34,197,94,0.5)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white/90" />
              </div>
            </motion.div>
          </div>

          {/* Greeting */}
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              {greeting()}{profile?.name ? `, ${profile.name}` : ''}
            </h1>
            <p className="text-base text-white/50">
              {healthScore === 0 ? 'Start logging to see your health score' :
               healthScore >= 75 ? 'Your health looks great today' :
               healthScore >= 50 ? 'Your health is on track' :
               'Let\'s improve your health today'}
            </p>
            {streak > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span>🔥</span>
                <span className="text-sm text-orange-400 font-medium">{streak} day streak</span>
              </div>
            )}
          </div>

          {/* Smart Input Bar */}
          <div className="w-full max-w-lg">
            <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-2 shadow-2xl">
              <div className="flex items-center gap-2 px-3">
                <button onClick={() => { setShowQuickLog(!showQuickLog); setShowScan(false); }}
                  className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center transition-all flex-shrink-0">
                  <Plus className="w-4 h-4 text-white/60" />
                </button>
                <button onClick={() => { setShowScan(!showScan); setShowQuickLog(false); }}
                  className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/12 flex items-center justify-center transition-all flex-shrink-0">
                  <Camera className="w-4 h-4 text-white/60" />
                </button>
                <input
                  type="text" value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your health..."
                  className="flex-1 bg-transparent py-4 text-white placeholder:text-white/30 focus:outline-none text-sm"
                  style={{ fontSize: '16px' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSend} disabled={loading || !inputValue.trim()}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center flex-shrink-0 disabled:opacity-40">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Quick Log Sheet */}
            <AnimatePresence>
              {showQuickLog && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-semibold text-sm">Quick Log</p>
                    <button onClick={() => setShowQuickLog(false)}><X className="w-4 h-4 text-white/40" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {quickLogTypes.map(({ type, label, icon: Icon, color, iconColor }) => (
                      <button key={type} onClick={() => setQuickLogType(type)}
                        className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${quickLogType === type ? 'border-green-500/50 bg-green-500/10' : 'border-white/8 bg-white/3 hover:bg-white/6'}`}>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  {quickLogType && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <textarea
                        placeholder={quickLogTypes.find(t => t.type === quickLogType)?.placeholder || ''}
                        value={quickLogText}
                        onChange={(e) => setQuickLogText(e.target.value)}
                        rows={2}
                        className="w-full bg-white/5 border border-white/8 rounded-2xl p-3 text-white text-sm placeholder:text-white/30 focus:outline-none resize-none mb-3"
                        style={{ fontSize: '16px' }}
                      />
                      <button onClick={handleQuickLog} disabled={logSaving || !quickLogText.trim()}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold text-sm disabled:opacity-40">
                        {logSaving ? 'Saving...' : 'Save Log'}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scan Sheet */}
            <AnimatePresence>
              {showScan && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mt-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-semibold text-sm">Scan</p>
                    <button onClick={() => setShowScan(false)}><X className="w-4 h-4 text-white/40" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Food Photo', sub: 'AI estimates calories', type: 'food', icon: '📷', color: 'from-orange-500/20 to-red-500/20' },
                      { label: 'Product Label', sub: 'Nutrition facts', type: 'label', icon: '🏷️', color: 'from-blue-500/20 to-indigo-500/20' },
                      { label: 'Supplement', sub: 'Dosage & interactions', type: 'supplement', icon: '💊', color: 'from-green-500/20 to-emerald-500/20' },
                      { label: 'Medication', sub: 'Drug information', type: 'supplement', icon: '💉', color: 'from-purple-500/20 to-blue-500/20' },
                    ].map(({ label, sub, type, icon, color }, i) => {
                      const inputId = `scan-${i}`;
                      return (
                        <div key={i}>
                          <input id={inputId} type="file" accept="image/*" capture="environment"
                            onChange={(e) => handleScanFile(e, type)} className="hidden" />
                          <label htmlFor={inputId}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${color} border border-white/8 cursor-pointer hover:border-white/20 transition-all text-center`}>
                            <span className="text-2xl">{icon}</span>
                            <div>
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs text-white/50 mt-0.5">{sub}</p>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 p-3 rounded-2xl bg-yellow-500/8 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400/80">⚠️ All information is for reference only. Consult a healthcare professional.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {scanning && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-3 flex items-center gap-3 px-5 py-3 rounded-2xl bg-green-500/8 border border-green-500/20">
                <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p className="text-sm text-green-400">Analyzing...</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* ── CHAT MESSAGES ── */}
        <section className="space-y-5">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div key={message.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index < 3 ? index * 0.1 : 0 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] space-y-3 flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-3xl px-5 py-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                      : 'backdrop-blur-xl bg-white/5 border border-white/10'
                  }`} style={{ borderRadius: message.type === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px' }}>
                    <p className="text-white/90 leading-relaxed text-sm">{renderText(message.text)}</p>
                  </div>
                  {message.suggestions && message.suggestions.length > 0 && index === messages.length - 1 && !loading && (
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((s, idx) => (
                        <motion.button key={idx} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleSuggestion(s)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-xl font-medium">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl px-5 py-4" style={{ borderRadius: '4px 20px 20px 20px' }}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-white/40"
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
        <section className="space-y-5">
          <h2 className="text-xl font-semibold tracking-tight">Today Overview</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Health Score */}
            <div className="md:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-7 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-white/50 text-sm">Health Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-semibold" style={{ color: scoreColor }}>{healthScore}</span>
                    <span className="text-xl text-white/30">/100</span>
                  </div>
                  <p className="text-xs" style={{ color: scoreColor }}>
                    {healthScore === 0 ? 'Log meals, sleep & supplements' :
                     healthScore >= 75 ? '↑ Great job today' :
                     healthScore >= 50 ? '↑ Keep going' : 'Log more to improve'}
                  </p>
                </div>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                    <motion.circle cx="80" cy="80" r="70" fill="none"
                      stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }} />
                    <defs>
                      <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* Sleep */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs text-white/40">Last night</span>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Sleep</p>
                <p className="text-2xl font-semibold">{todayStats.sleep ? 'Logged ✓' : 'Not logged'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }} animate={{ width: todayStats.sleep ? '85%' : '0%' }}
                    transition={{ duration: 1, delay: 0.3 }} />
                </div>
                <span className="text-xs text-white/40">{todayStats.sleep ? '85%' : '0%'}</span>
              </div>
            </div>

            {/* Energy */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-xs text-white/40">Today</span>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Energy</p>
                <p className="text-2xl font-semibold">{todayStats.energy > 0 ? `${todayStats.energy} log${todayStats.energy > 1 ? 's' : ''}` : 'Not logged'}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                    initial={{ width: 0 }} animate={{ width: todayStats.energy > 0 ? '75%' : '0%' }}
                    transition={{ duration: 1, delay: 0.4 }} />
                </div>
                <span className="text-xs text-white/40">{todayStats.energy > 0 ? '75%' : '0%'}</span>
              </div>
            </div>

            {/* Supplements */}
            <div className="md:col-span-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs">Supplements</p>
                    <p className="text-lg font-semibold">
                      {todayStats.supplementsTotal === 0 ? 'None added yet' :
                       `${todayStats.supplementsTaken} of ${todayStats.supplementsTotal} taken`}
                    </p>
                  </div>
                </div>
                {todayStats.supplementsTotal > 0 && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: todayStats.supplementsTotal }).map((_, i) => (
                      <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                        className={`w-3 h-3 rounded-full ${i < todayStats.supplementsTaken ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-white/10'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SMART ACTIONS ── */}
        <section className="space-y-4 pb-24">
          <h2 className="text-xl font-semibold tracking-tight">Smart Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: UtensilsCrossed, label: 'Log meal', sub: `${todayStats.meals} logged today`, color: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-400', action: () => { setQuickLogType('meal'); setShowQuickLog(true); } },
              { icon: BedDouble, label: 'Log sleep', sub: todayStats.sleep ? 'Logged ✓' : 'Not logged yet', color: 'from-purple-500/20 to-blue-500/20', iconColor: 'text-purple-400', action: () => { setQuickLogType('sleep'); setShowQuickLog(true); } },
              { icon: Pill, label: 'Supplements', sub: `${todayStats.supplementsTaken}/${todayStats.supplementsTotal} taken`, color: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-400', action: () => onNavigate('profile') },
            ].map(({ icon: Icon, label, sub, color, iconColor, action }, i) => (
              <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={action}
                className="group backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-5 shadow-2xl hover:bg-white/8 transition-all text-left w-full">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold mb-0.5">{label}</h3>
                    <p className="text-xs text-white/50">{sub}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                    <span className="text-white/40 text-sm">›</span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}