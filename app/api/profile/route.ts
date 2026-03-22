import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: existing } = await supabase
      .from('user_profile')
      .select('id')
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('user_profile')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      const { data, error } = await supabase
        .from('user_profile')
        .insert([body])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}