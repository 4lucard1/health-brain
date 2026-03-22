import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('date')
      .order('date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ streak: 0 });
    }

    // Get unique dates
    const uniqueDates = [...new Set(data.map(d => d.date))].sort().reverse();

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if today or yesterday has logs
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return NextResponse.json({ streak: 0 });
    }

    let currentDate = uniqueDates[0] === today ? new Date() : new Date(Date.now() - 86400000);

    for (const date of uniqueDates) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      if (date === expectedDate) {
        streak++;
        currentDate = new Date(currentDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return NextResponse.json({ streak });
  } catch (error) {
    console.error('Streak error:', error);
    return NextResponse.json({ streak: 0 });
  }
}