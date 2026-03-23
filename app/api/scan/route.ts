import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scanType = formData.get('scanType') as string || 'product';

    if (!file) return NextResponse.json({ error: 'Nema fajla' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const prompt = scanType === 'food'
      ? `Ovo je fotografija hrane/obroka. Procijeni:
1. Što je na tanjiru (nazivi jela)
2. Procijenjene kalorije
3. Makronutrijenti (proteini, ugljikohidrati, masti)
4. Veličina porcije

Format odgovora:
JELO: [naziv]
KALORIJE: ~[broj] kcal
PROTEINI: ~[g] | UGLJIKOHIDRATI: ~[g] | MASTI: ~[g]
PORCIJA: [mala/srednja/velika]

Odgovaraj na bosanskom/srpskom jeziku. Budi koncizan.`

      : scanType === 'supplement'
      ? `Ovo je fotografija ambalaže suplementa, lijeka ili farmaceutskog proizvoda.

TVOJ ZADATAK:
1. Identifikuj proizvod (naziv, aktivne supstance)
2. Ako je SUPLEMENT: doza, sastojci, preporučeno uzimanje, potencijalne interakcije
3. Ako je LIJEK: aktivna supstanca, indikacije, doziranje, nuspojave, interakcije
4. Ako je HORMON/ANABOLIK/SARM ili slično: objektivno navedi aktivne supstance, poznate efekte, rizike i interakcije — BEZ preporuke za korištenje

VAŽNO:
- Ako NE MOŽEŠ prepoznati proizvod sa slike → odgovori TAČNO ovim tekstom: "SCAN_FAILED: Nije moguće prepoznati proizvod sa slike."
- Ako NISI SIGURAN u neku informaciju → jasno napiši "Nije potvrđeno" umjesto da nagađaš
- Uvijek dodaj: "⚠️ Ove informacije su samo informativnog karaktera. Konsultujte doktora ili farmaceuta."

Odgovaraj na bosanskom/srpskom jeziku. Budi precizan i koncizan.`

      : `Ovo je fotografija poleđine prehrambenog proizvoda.

Izvuci:
1. Nutritivne vrijednosti (kalorije, proteini, ugljikohidrati, masti, vlakna, šećeri)
2. Veličinu porcije
3. Sastojke
4. Alergene

Format:
PORCIJA: [veličina]
KALORIJE: [broj] kcal
PROTEINI: [g] | UGLJIKOHIDRATI: [g] | MASTI: [g]
VLAKNA: [g] | ŠEĆERI: [g]
ALERGENI: [lista]
SASTOJCI: [lista]

Odgovaraj na bosanskom/srpskom jeziku.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: prompt }
        ]
      }]
    });

    const result = response.content[0].type === 'text' ? response.content[0].text : '';

    // Safety check — if Claude couldn't analyze
    if (result.includes('SCAN_FAILED') || result.trim() === '') {
      return NextResponse.json({
        result: null,
        error: 'not_recognized',
        message: 'Nije moguće automatski analizirati ovaj proizvod. Unesite naziv ručno ili konsultujte farmaceuta/doktora.'
      });
    }

    return NextResponse.json({ result, scanType });
  } catch (error: any) {
    console.error('Scan error:', error);

    // Handle Claude refusal
    if (error?.status === 400 || error?.message?.includes('safety')) {
      return NextResponse.json({
        result: null,
        error: 'refused',
        message: '⚠️ Automatska analiza nije dostupna za ovaj tip proizvoda. Unesite naziv ručno i pitajte AI asistenta za informacije.'
      });
    }

    return NextResponse.json({ error: 'scan_error', message: 'Greška pri skeniranju. Pokušajte ponovo.' }, { status: 500 });
  }
}