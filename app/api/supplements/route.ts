import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('supplements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, dose, timing } = await request.json();

    const { data, error } = await supabase
      .from('supplements')
      .insert([{ name, dose, timing }])
      .select();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}