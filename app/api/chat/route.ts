import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { supabase } from '@/lib/supabase';

const client = new Anthropic();
const redis = Redis.fromEnv();

const SESSION_ID = 'user-main';
const MAX_MESSAGES = 20;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const memory = await redis.get<string>(`memory:${SESSION_ID}`);
    const savedHistory = await redis.get<any[]>(`history:${SESSION_ID}`) || [];

    const today = new Date().toISOString().split('T')[0];

    // Uzmi profil
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .single();

    // Uzmi današnje logove
    const { data: todayLogs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: false });

    // Uzmi suplemente
    const { data: supplements } = await supabase
      .from('supplements')
      .select('*')
      .eq('active', true);

    const { data: supplementLogs } = await supabase
      .from('supplement_logs')
      .select('*, supplements(*)')
      .eq('date', today);

    // Uzmi najnovije nalaze
    const { data: records } = await supabase
      .from('medical_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Procijeni koliko historije treba na osnovu poruke
    const lastMessage = messages[messages.length - 1]?.content || '';
    const needsHistory = /historij|prošl|ranije|uvijek|trend|zadnj|tjedan|mjesec|week|month|pattern|history/i.test(lastMessage);

    let historicalLogs: any[] = [];
    if (needsHistory) {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      historicalLogs = data || [];
    }

    // Formiraj system prompt
    const profileContext = profile ? `
KORISNIČKI PROFIL:
- Ime: ${profile.name || 'Nepoznato'}
- Godine: ${profile.age || 'N/A'}
- Spol: ${profile.gender || 'N/A'}
- Visina: ${profile.height_cm ? profile.height_cm + 'cm' : 'N/A'}
- Težina: ${profile.weight_kg ? profile.weight_kg + 'kg' : 'N/A'}
- Ciljevi: ${profile.goals?.join(', ') || 'N/A'}
- Alergije: ${profile.allergies?.join(', ') || 'Nema'}
- Hronična stanja: ${profile.conditions?.join(', ') || 'Nema'}
- Lijekovi: ${profile.medications?.join(', ') || 'Nema'}` : '';

    const logsContext = todayLogs && todayLogs.length > 0
      ? `\nDANAŠNJI LOGOVI (${today}):\n` + todayLogs.map(l => `- [${l.type.toUpperCase()}] ${JSON.stringify(l.data)}`).join('\n')
      : '\nDANAS NEMA LOGOVA.';

    const supplementsContext = supplements && supplements.length > 0
      ? `\nSUPLEMENTI:\n` + supplements.map(s => {
          const taken = supplementLogs?.find((sl: any) => sl.supplement_id === s.id)?.taken;
          return `- ${s.name} ${s.dose} (${s.timing}) — ${taken ? '✅ uzeto' : '❌ nije uzeto'}`;
        }).join('\n')
      : '';

    const recordsContext = records && records.length > 0
      ? `\nMEDICINSKI NALAZI:\n` + records.map(r => `- ${r.title} (${r.date}): ${r.extracted_text?.substring(0, 300)}...`).join('\n')
      : '';

    const historyContext = needsHistory && historicalLogs.length > 0
      ? `\nHISTORIJSKI PODACI (zadnjih ${historicalLogs.length} logova):\n` + historicalLogs.map(l => `- [${l.date}] [${l.type}] ${JSON.stringify(l.data)}`).join('\n')
      : '';

    const systemPrompt = `Ti si Health Brain — personalni AI zdravstveni asistent. Ponašaš se kao doktor, nutricionista i health coach u jednom.

${profileContext}
${logsContext}
${supplementsContext}
${recordsContext}
${historyContext}
${memory ? `\nMEMORIJA IZ PRETHODNIH RAZGOVORA:\n${memory}` : ''}

PRAVILA KOMUNIKACIJE:
- Odgovaraj na jeziku korisnika
- UVIJEK postavi samo JEDNO pitanje — nikad više
- Razmisli duboko prije odgovora — analiziraj sve podatke koje imaš
- Nakon što nešto zaključiš ili pitaš, ponudi 2-3 konkretne opcije u ovom TAČNOM formatu: [OPCIJE: opcija1 | opcija2 | opcija3]
- Opcije trebaju biti kratke (max 4-5 riječi) i konkretne
- Primjer: "Šta te najviše muči trenutno? [OPCIJE: San i energija | Ishrana i težina | Suplementi i protokol]"
- Budi direktan i human — kao dobar prijatelj koji je i stručnjak
- Nikad ne daj medicinsku dijagnozu, već preporuku da posjeti doktora
- Ako imaš dovoljno podataka — daj konkretan savjet bez pitanja`; 

    const allMessages = [...savedHistory, ...messages].slice(-MAX_MESSAGES);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: allMessages,
    });

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';

    const newHistory = [...allMessages, { role: 'assistant', content: assistantMessage }];
    await redis.set(`history:${SESSION_ID}`, newHistory.slice(-MAX_MESSAGES));

    if (newHistory.length % 10 === 0) {
      const summaryResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Izvuci ključne zdravstvene informacije o korisniku iz ove konverzacije. Budi kratak:\n\n${newHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }]
      });
      const summary = summaryResponse.content[0].type === 'text' ? summaryResponse.content[0].text : '';
      await redis.set(`memory:${SESSION_ID}`, summary);
    }

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška' }, { status: 500 });
  }
}