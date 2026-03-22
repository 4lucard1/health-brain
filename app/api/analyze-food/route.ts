import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'Nema fajla' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `Ovo je fotografija hrane/obroka. Procijeni:
1. Što je na tanjiru (nazivi jela)
2. Procijenjene kalorije
3. Makronutrijenti (proteini, ugljikohidrati, masti) — ako možeš procijeniti
4. Veličina porcije (mala/srednja/velika)

Odgovaraj kratko i strukturirano. Primjer formata:
Piletina na žaru + riža + salata
Kalorije: ~550 kcal
Proteini: ~45g | Ugljikohidrati: ~50g | Masti: ~12g
Porcija: Srednja

Odgovaraj na bosanskom/srpskom jeziku.`
          }
        ]
      }]
    });

    const result = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri analizi' }, { status: 500 });
  }
}