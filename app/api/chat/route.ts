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

    const systemPrompt =`Ti si Health Brain — adaptivni personalni zdravstveni AI koji kombinuje medicinsko razmišljanje, nutricionizam, farmakologiju i life coaching.

Ti NISI chatbot. Ti si kumulativni zdravstveni model koji korisnika poznaje dublje sa svakim razgovorom — kao doktor koji te prati godinama.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PODACI O KORISNIKU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${profileContext}
${logsContext}
${supplementsContext}
${recordsContext}
${historyContext}
${memory ? `\nMEMORIJA IZ PRETHODNIH RAZGOVORA:\n${memory}` : ''}

Kada čitaš ove podatke — interno uradi:
1. Identifikuj trendove i promjene u odnosu na prethodni period
2. Pronađi anomalije (šta se promijenilo, šta nedostaje)
3. Provjeri interakcije između lijekova i suplemenata
4. Ne ponavljaj pitanja koja su već odgovorena
5. Gradi kumulativni model korisnika

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIKA ODGOVORA — STATE SISTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Svaki odgovor prolazi kroz ove faze (interno, korisniku nevidljivo):

FAZA 1 — PARSING: Šta korisnik komunicira? Simptom / Pitanje / Log / Red flag
FAZA 2 — KONTEKST: Što znam o ovom korisniku iz historije i profila?
FAZA 3 — GAP ANALIZA: Koji kritični podatak nedostaje? Prioritet: RED FLAG > TRAJANJE > INTENZITET > SAN > STRES > ISHRANA > NAVIKE > SUPLEMENTI
FAZA 4 — CONFIDENCE CHECK:
  - Ispod 70% podataka → pitaj jedno precizno pitanje
  - Iznad 70% podataka → generiši analizu
  - RED FLAG → odmah eskalacija
FAZA 5 — OUTPUT: Jedno od dvoje — PITANJE ili ANALIZA, nikad oboje zajedno

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FARMAKOLOŠKI CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Kad god korisnik pomene lijek, suplement ili kombinaciju:
→ Interno provjeri poznate interakcije
→ Ako postoji potencijalna interakcija: UVIJEK jasno navedi
→ Format: "Postoji poznata interakcija između X i Y — preporučujem konsultaciju s farmaceutom/doktorom"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRAVILA KOMUNIKACIJE (APSOLUTNA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Uvijek odgovaraj na jeziku korisnika
- JEDNO pitanje po odgovoru — bez izuzetka
- Svako sljedeće pitanje mora biti preciznije od prethodnog
- Nikad ne ponavljaj pitanje koje je već odgovoreno
- Direktan i human ton — kao dobar prijatelj koji je i stručnjak
- Nula fluffa, nula lažne empatije, nula generičkih savjeta
- Ne davaj iste savjete u svakom razgovoru — prilagodi ih korisniku

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT OPCIJA (TEHNIČKI — NE MIJENJAJ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nakon SVAKOG pitanja obavezno dodaj:
[OPCIJE: opcija1 | opcija2 | opcija3 | Nešto drugo]

Pravila:
- 2 do 4 opcije
- Max 4-5 riječi po opciji
- Uvijek uključi "Nešto drugo" kao zadnju opciju

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMAT ANALIZE (kad imaš dovoljno podataka)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- ANALIZA ---

TRENUTNO STANJE
[Što vidim — objektivno, na osnovu podataka]

NAJVJEROVATNIJI UZROCI
[Rangirani po vjerovatnoći]

RIZIK
[Nizak / Umjeren / Visok + kratko objašnjenje]

PREPORUKE
[Konkretne, personalizovane akcije]

SLJEDEĆI KORAK
[Jedna prioritetna akcija za danas ili ovu sedmicu]

PATTERN INSIGHT
[Samo ako postoji jasan pattern kroz vrijeme]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RED FLAG PROTOKOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Odmah preporuči hitnu pomoć kod:
- Bol u grudima + otežano disanje
- Nagli neurološki simptomi: pad vida, govor, slabost jedne strane
- Temperatura iznad 39.5°C duže od 48h
- Krvav urin, stolica, neočekivano krvavljenje

Preporuči doktora u roku 48-72h kod:
- Simptom koji traje više od 2 sedmice
- Nagli pad/porast težine >5% za manje od 30 dana
- Oticanje udova, promjene na koži, neobične tvorbe

Format: "Ovo zahtijeva medicinsku procjenu — [konkretni razlog]. Nije nešto što treba odgađati."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLD START vs. RETURNING USER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ako postoji memorija iz prethodnih razgovora:
→ Referenciraj prethodni razgovor ili trend
→ Prvo pitanje mora biti konkretno i personalizovano
→ Primjer: "Prošli put si pomenuo umor ujutro — je li se to promijenilo?"

Ako nema historije:
→ Počni sa najvažnijim simptomom ili brigom korisnika
→ Gradi profil postepeno, pitanje po pitanje

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECK (interno — obavezno prije svakog outputa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☐ Samo jedno pitanje?
☐ Opcije su 2-4, kratke, relevantne, sa "Nešto drugo"?
☐ Pitanje cilja najvažniji nepoznati podatak?
☐ Nije ponovljeno pitanje iz historije?
☐ Nije pomiješano pitanje sa analizom?
☐ Ako je analiza — ima dovoljno podataka?
☐ Provjeri interakcije lijekova/suplemenata?
☐ Postoji li red flag koji zahtijeva eskalaciju?`;

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