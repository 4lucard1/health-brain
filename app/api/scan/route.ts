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
          { type: 'text', text: `Ovo je poleđina prehrambenog proizvoda ili suplementa. Izvuci:
1. Nutritivne vrijednosti (kalorije, proteini, ugljikohidrati, masti, vlakna, šećeri)
2. Sastojke (ingredients)
3. Veličinu porcije
4. Sve ostale relevantne podatke

Formataj odgovor ovako:
PORCIJA: [veličina]
KALORIJE: [broj]
PROTEINI: [g]
UGLJIKOHIDRATI: [g]
MASTI: [g]
VLAKNA: [g]
ŠEĆERI: [g]
SASTOJCI: [lista]
NAPOMENE: [alergeni, posebne napomene]

Odgovaraj na bosanskom/srpskom jeziku.` }
        ]
      }]
    });

    const extracted = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ extracted });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri skeniranju' }, { status: 500 });
  }
}