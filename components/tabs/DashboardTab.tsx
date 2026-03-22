'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';

interface UserProfile {
  name: string;
  age: number;
  weight_kg: number;
  height_cm: number;
  goals: string[];
}

interface DailyLog {
  id: string;
  type: string;
  data: { note: string };
  created_at: string;
}

interface Supplement {
  id: string;
  name: string;
}

interface SupplementLog {
  supplement_id: string;
  taken: boolean;
}

interface DashboardTabProps {
  profile: UserProfile | null;
}

const chartData = [
  { day: 'Mon', energy: 6, sleep: 7 },
  { day: 'Tue', energy: 7, sleep: 6 },
  { day: 'Wed', energy: 5, sleep: 8 },
  { day: 'Thu', energy: 8, sleep: 7 },
  { day: 'Fri', energy: 7, sleep: 6 },
  { day: 'Sat', energy: 9, sleep: 8 },
  { day: 'Sun', energy: 8, sleep: 7 },
];

const emptyStateMessages: Record<string, { emoji: string; title: string; sub: string }> = {
  default: { emoji: '📊', title: 'No data yet', sub: 'Start logging to see your stats' },
};

export default function DashboardTab({ profile }: DashboardTabProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [streak, setStreak] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [selectedDate]);

  const fetchAll = async () => {
    const [logsRes, supplRes, supplLogsRes] = await Promise.all([
      fetch(`/api/log?date=${selectedDate}`),
      fetch('/api/supplements'),
      fetch('/api/supplements/log'),
    ]);
    const { data: logsData } = await logsRes.json();
    const { data: supplData } = await supplRes.json();
    const { data: supplLogsData } = await supplLogsRes.json();

    const l = logsData || [];
    const s = supplData || [];
    const sl = supplLogsData || [];

    setLogs(l);
    setSupplements(s);
    setSupplementLogs(sl);

    // Calculate health score
    const mealScore = Math.min(l.filter((x: DailyLog) => x.type === 'meal').length * 20, 40);
    const sleepScore = l.filter((x: DailyLog) => x.type === 'sleep').length > 0 ? 20 : 0;
    const energyScore = l.filter((x: DailyLog) => x.type === 'energy').length > 0 ? 10 : 0;
    const takenCount = s.filter((sup: Supplement) => sl.find((sl: SupplementLog) => sl.supplement_id === sup.id && sl.taken));
    const supplScore = s.length > 0 ? Math.round((takenCount.length / s.length) * 30) : 0;
    const score = Math.min(mealScore + sleepScore + energyScore + supplScore, 100);
    setHealthScore(score);

    // Streak calculation
    const streakRes = await fetch('/api/streak');
    if (streakRes.ok) {
      const { streak: s } = await streakRes.json();
      setStreak(s || 0);
    }

    // Celebrate if all supplements taken
    if (s.length > 0 && takenCount.length === s.length) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  };

  const takenCount = supplements.filter(s => supplementLogs.find(sl => sl.supplement_id === s.id && sl.taken)).length;

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#EAB308';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) return 'Great';
    if (score >= 50) return 'Good';
    if (score >= 25) return 'Fair';
    return 'Start logging';
  };

  const scoreColor = getScoreColor(healthScore);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (healthScore / 100) * circumference;

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: 'rgba(34,197,94,0.95)', borderRadius: '20px',
              padding: '12px 24px', zIndex: 100, boxShadow: '0 8px 32px rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>All supplements taken today!</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>Overview</h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>Your health at a glance</p>
          </div>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '7px 10px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
        </div>

        {/* Health Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '20px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="55" cy="55" r="45" fill="none" stroke={scoreColor} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${scoreColor})` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '24px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{healthScore}</p>
              <p style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>/ 100</p>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#F5F5F5' }}>Health Score</p>
              <Badge label={getScoreLabel(healthScore)} variant={healthScore >= 75 ? 'green' : healthScore >= 50 ? 'yellow' : 'red'} />
            </div>
            <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '1.5' }}>
              {healthScore === 0 ? 'Start logging meals, sleep and supplements to see your score.' :
               healthScore < 50 ? 'Log more data to improve your score today.' :
               healthScore < 75 ? 'Good progress! Keep logging to reach 75+.' :
               'Excellent! You\'re taking great care of yourself today.'}
            </p>
            {streak > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '14px' }}>🔥</span>
                <p style={{ fontSize: '12px', color: '#F97316', fontWeight: 600 }}>{streak} day streak</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Meals', value: logs.filter(l => l.type === 'meal').length, sub: 'logged today', color: '#F97316', emoji: '🍽️', goal: 3 },
            { label: 'Sleep', value: logs.filter(l => l.type === 'sleep').length, sub: 'entries', color: '#A855F7', emoji: '😴', goal: 1 },
            { label: 'Energy', value: logs.filter(l => l.type === 'energy').length, sub: 'check-ins', color: '#EAB308', emoji: '⚡', goal: 2 },
            { label: 'Supplements', value: `${takenCount}/${supplements.length}`, sub: 'taken', color: '#22C55E', emoji: '💊', goal: null },
          ].map((card, i) => (
            <motion.div key={card.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px' }}>
              <p style={{ fontSize: '20px', marginBottom: '6px' }}>{card.emoji}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>{card.label}</p>
              <p style={{ fontSize: '10px', color: '#6B7280' }}>{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {logs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '36px', marginBottom: '10px' }}>📝</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>No logs for today</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Go to Log tab to start tracking your health</p>
          </motion.div>
        )}

        {/* Charts */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600 }}>Energy & Sleep</p>
            <Badge label="7 days" variant="blue" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }} />
              <Line type="monotone" dataKey="energy" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 5px #22C55E' }} />
              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Energy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#3B82F6', boxShadow: '0 0 5px #3B82F6' }} />
              <span style={{ fontSize: '10px', color: '#9CA3AF' }}>Sleep</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>Weekly Activity</p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#F5F5F5', fontSize: '11px' }} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
              </defs>
              <Bar dataKey="energy" fill="url(#barGrad)" radius={[5, 5, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}