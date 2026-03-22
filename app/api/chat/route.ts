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

    // Uzmi memoriju iz Redisa
    const memory = await redis.get<string>(`memory:${SESSION_ID}`);

    // Uzmi historiju iz Redisa
    const savedHistory = await redis.get<any[]>(`history:${SESSION_ID}`) || [];

    // Uzmi današnje logove iz Supabase
    const today = new Date().toISOString().split('T')[0];
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(20);

    // Formatiraj logove za AI
    const logsContext = logs && logs.length > 0
      ? `\nDANAŠNJI LOGOVI (${today}):\n` + logs.map(log => 
          `- [${log.type.toUpperCase()}] ${JSON.stringify(log.data)}`
        ).join('\n')
      : '\nDANAS NEMA UNESENIH LOGOVA.';

    const systemPrompt = `Ti si personalni zdravstveni asistent - "Health Brain".
Pomažeš korisniku da prati ishranu, suplemente, san, energiju i opće zdravlje.
Odgovaraj na jeziku korisnika. Budi koncizan, jasan i praktičan.

${memory ? `MEMORIJA O KORISNIKU:\n${memory}` : ''}
${logsContext}`;

    const allMessages = [...savedHistory, ...messages].slice(-MAX_MESSAGES);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: allMessages,
    });

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    const newHistory = [...allMessages, { role: 'assistant', content: assistantMessage }];
    await redis.set(`history:${SESSION_ID}`, newHistory.slice(-MAX_MESSAGES));

    if (newHistory.length % 10 === 0) {
      const summaryResponse = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Na osnovu ove konverzacije, izvuci ključne zdravstvene informacije o korisniku. Budi kratak:\n\n${newHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }]
      });

      const summary = summaryResponse.content[0].type === 'text'
        ? summaryResponse.content[0].text
        : '';
      await redis.set(`memory:${SESSION_ID}`, summary);
    }

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Greška u komunikaciji sa AI' }, { status: 500 });
  }
}