'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
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

const insightCards = [
  { text: 'Energy +12% this week', icon: '⚡', color: '#EAB308' },
  { text: 'Sleep improved 2 nights in a row', icon: '😴', color: '#A855F7' },
  { text: 'All supplements taken today', icon: '💊', color: '#22C55E' },
];

export default function DashboardTab({ profile }: DashboardTabProps) {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => { fetchLogs(); }, [selectedDate]);

  const fetchLogs = async () => {
    const res = await fetch(`/api/log?date=${selectedDate}`);
    const { data } = await res.json();
    setLogs(data || []);
  };

  const stats = [
    { label: 'Energy', value: logs.filter(l => l.type === 'energy').length, sub: 'logs today', color: '#EAB308', emoji: '⚡', variant: 'yellow' as const },
    { label: 'Sleep', value: logs.filter(l => l.type === 'sleep').length, sub: 'logs today', color: '#A855F7', emoji: '😴', variant: 'purple' as const },
    { label: 'Meals', value: logs.filter(l => l.type === 'meal').length, sub: 'logged today', color: '#F97316', emoji: '🍽️', variant: 'yellow' as const },
    { label: 'Symptoms', value: logs.filter(l => l.type === 'symptom').length, sub: 'today', color: '#EF4444', emoji: '⚠️', variant: 'red' as const },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Overview</h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Your health at a glance</p>
        </div>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
      </div>

      {/* Profile Card */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#22C55E', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>👤 {profile.name}</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {profile.age && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>🎂 {profile.age}y</span>}
                {profile.weight_kg && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>⚖️ {profile.weight_kg}kg</span>}
                {profile.height_cm && <span style={{ fontSize: '12px', color: '#9CA3AF' }}>📏 {profile.height_cm}cm</span>}
              </div>
            </div>
            {profile.goals?.[0] && <Badge label={profile.goals[0]} variant="green" />}
          </div>
        </motion.div>
      )}

      {/* Insight Cards */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px' }}>
        {insightCards.map((card, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            style={{
              flexShrink: 0, padding: '12px 16px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', cursor: 'default',
              minWidth: '180px'
            }}>
            <p style={{ fontSize: '18px', marginBottom: '6px' }}>{card.icon}</p>
            <p style={{ fontSize: '12px', color: '#F5F5F5', fontWeight: 500, lineHeight: '1.4' }}>{card.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Asymmetric Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {stats.map((card, i) => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.03, y: -3 }}
            onHoverStart={() => setHoveredCard(i)}
            onHoverEnd={() => setHoveredCard(null)}
            style={{
              backgroundColor: hoveredCard === i ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hoveredCard === i ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '20px', padding: '16px', cursor: 'default',
              transition: 'all 0.3s ease',
              gridColumn: i === 0 ? 'span 2' : 'span 1',
            }}>
            <div style={{ display: 'flex', alignItems: i === 0 ? 'center' : 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: i === 0 ? '28px' : '22px', marginBottom: '6px' }}>{card.emoji}</p>
                <p style={{ fontSize: i === 0 ? '32px' : '26px', fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{card.label}</p>
                <p style={{ fontSize: '11px', color: '#6B7280' }}>{card.sub}</p>
              </div>
              {i === 0 && (
                <div style={{ textAlign: 'right' }}>
                  <Badge label="Today" variant="yellow" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Line Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600 }}>Energy & Sleep</p>
          <Badge label="7 days" variant="blue" />
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px' }} />
            <Line type="monotone" dataKey="energy" stroke="#22C55E" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Energy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3B82F6', boxShadow: '0 0 6px #3B82F6' }} />
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Sleep</span>
          </div>
        </div>
      </motion.div>

      {/* Bar Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Weekly Activity</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={chartData}>
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px' }} />
            <Bar dataKey="energy" radius={[6, 6, 0, 0]} opacity={0.85}>
              {chartData.map((_, i) => (
                <rect key={i} fill={`url(#barGradient${i})`} />
              ))}
            </Bar>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
            </defs>
            <Bar dataKey="energy" fill="url(#barGradient)" radius={[6, 6, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}