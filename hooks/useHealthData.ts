import { useState, useEffect } from 'react';

interface TodayStats {
  meals: number;
  sleep: boolean;
  energy: number;
  supplementsTaken: number;
  supplementsTotal: number;
}

export function useHealthData() {
  const [healthScore, setHealthScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    meals: 0, sleep: false, energy: 0,
    supplementsTaken: 0, supplementsTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [logsRes, supplRes, supplLogsRes, streakRes] = await Promise.all([
        fetch(`/api/log?date=${today}`),
        fetch('/api/supplements'),
        fetch('/api/supplements/log'),
        fetch('/api/streak'),
      ]);

      const { data: logs } = await logsRes.json();
      const { data: suppl } = await supplRes.json();
      const { data: supplLogs } = await supplLogsRes.json();
      const streakData = streakRes.ok ? await streakRes.json() : { streak: 0 };

      const l = logs || [];
      const s = suppl || [];
      const sl = supplLogs || [];

      const meals = l.filter((x: any) => x.type === 'meal').length;
      const sleep = l.some((x: any) => x.type === 'sleep');
      const energy = l.filter((x: any) => x.type === 'energy').length;
      const taken = s.filter((sup: any) => sl.find((log: any) => log.supplement_id === sup.id && log.taken)).length;

      setTodayStats({ meals, sleep, energy, supplementsTaken: taken, supplementsTotal: s.length });
      setStreak(streakData.streak || 0);

      // Health Score
      const mealScore = Math.min(meals * 15, 40);
      const sleepScore = sleep ? 25 : 0;
      const energyScore = energy > 0 ? 10 : 0;
      const supplScore = s.length > 0 ? Math.round((taken / s.length) * 25) : 0;
      setHealthScore(Math.min(mealScore + sleepScore + energyScore + supplScore, 100));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return { healthScore, streak, todayStats, loading, refresh: fetchAll };
}