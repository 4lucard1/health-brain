import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { supplement_id, taken } = await request.json();
    const today = new Date().toISOString().split('T')[0];

    // Provjeri da li već postoji log za danas
    const { data: existing } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('supplement_id', supplement_id)
      .eq('date', today)
      .single();

    if (existing) {
      // Update postojećeg
      const { error } = await supabase
        .from('supplement_logs')
        .update({ taken })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Kreiraj novi
      const { error } = await supabase
        .from('supplement_logs')
        .insert([{ supplement_id, taken, date: today }]);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('supplement_logs')
      .select('*, supplements(*)')
      .eq('date', today);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}