import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, extracted_text, ai_analysis, record_type } = await request.json();

    const { data, error } = await supabase
      .from('medical_records')
      .insert([{ title, extracted_text, ai_analysis, record_type }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}