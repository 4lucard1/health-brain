import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json();

    const { error } = await supabase
      .from('daily_logs')
      .insert([{ type, data }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri čuvanju' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const type = searchParams.get('type');

    let query = supabase
      .from('daily_logs')
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri čitanju' }, { status: 500 });
  }
}