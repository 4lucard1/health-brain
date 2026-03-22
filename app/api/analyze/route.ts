import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || 'Nalaz ' + new Date().toLocaleDateString();

    if (!file) {
      return NextResponse.json({ error: 'Nema fajla' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    // Ekstrakcija teksta
    const extractResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: 'Izvuci SVE podatke i vrijednosti iz ovog medicinskog nalaza. Zapiši ih strukturirano.' }
        ]
      }]
    });

    const extractedText = extractResponse.content[0].type === 'text' ? extractResponse.content[0].text : '';

    // AI analiza
    const analysisResponse = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `Analiziraj ovaj medicinski nalaz. Izvuci:
1. Sve vrijednosti i parametre
2. Koje su vrijednosti izvan normalnog raspona (označi ⚠️)
3. Šta to znači za zdravlje (objasni jednostavno)
4. Preporuke

Odgovaraj na bosanskom/srpskom/hrvatskom jeziku.` }
        ]
      }]
    });

    const analysis = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : '';

    // Spremi u bazu (bez slike!)
    await supabase.from('medical_records').insert([{
      title,
      extracted_text: extractedText,
      ai_analysis: analysis,
      record_type: 'lab'
    }]);

    return NextResponse.json({ analysis, extracted_text: extractedText });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri analizi' }, { status: 500 });
  }
}