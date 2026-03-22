import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nema fajla' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Analiziraj ovaj medicinski nalaz. Izvuci:
1. Sve vrijednosti i parametre
2. Koje su vrijednosti izvan normalnog raspona (označi ⚠️)
3. Šta to znači za zdravlje (objasni jednostavno)
4. Preporuke

Odgovaraj na bosanskom/srpskom/hrvatskom jeziku. Budi jasan i koncizan.`,
            },
          ],
        },
      ],
    });

    const analysis = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška pri analizi' }, { status: 500 });
  }
}