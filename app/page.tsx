'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type LogType = 'meal' | 'supplement' | 'sleep' | 'energy' | 'symptom';

interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
}

interface SupplementLog {
  supplement_id: string;
  taken: boolean;
  supplements: Supplement;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'log' | 'supplements' | 'nalaz'>('chat');
  const [logType, setLogType] = useState<LogType>('meal');
  const [logInput, setLogInput] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [newSupp, setNewSupp] = useState({ name: '', dose: '', timing: '' });
  const [addingSupp, setAddingSupp] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [preview, setPreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'supplements') {
      fetchSupplements();
      fetchSupplementLogs();
    }
  }, [activeTab]);

  const fetchSupplements = async () => {
    const res = await fetch('/api/supplements');
    const { data } = await res.json();
    setSupplements(data || []);
  };

  const fetchSupplementLogs = async () => {
    const res = await fetch('/api/supplements/log');
    const { data } = await res.json();
    setSupplementLogs(data || []);
  };

  const addSupplement = async () => {
    if (!newSupp.name || !newSupp.dose || !newSupp.timing) return;
    await fetch('/api/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupp),
    });
    setNewSupp({ name: '', dose: '', timing: '' });
    setAddingSupp(false);
    fetchSupplements();
  };

  const toggleSupplement = async (supplement_id: string, taken: boolean) => {
    await fetch('/api/supplements/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement_id, taken }),
    });
    fetchSupplementLogs();
  };

  const isSupplementTaken = (id: string) => {
    const log = supplementLogs.find(l => l.supplement_id === id);
    return log?.taken || false;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveLog = async () => {
    if (!logInput.trim()) return;
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logType, data: { note: logInput, timestamp: new Date().toISOString() } }),
    });
    setLogInput('');
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
  };

  const analyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setAnalysis('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setAnalysis(data.analysis || data.error);
    } catch (error) {
      console.error(error);
      setAnalysis('Greška pri analizi.');
    } finally {
      setAnalyzing(false);
    }
  };

  const logTypes: { type: LogType; label: string; emoji: string }[] = [
    { type: 'meal', label: 'Obrok', emoji: '🍽️' },
    { type: 'supplement', label: 'Suplement', emoji: '💊' },
    { type: 'sleep', label: 'San', emoji: '😴' },
    { type: 'energy', label: 'Energija', emoji: '⚡' },
    { type: 'symptom', label: 'Simptom', emoji: '🩺' },
  ];

  const tabs = [
    { tab: 'chat', label: '💬 Chat' },
    { tab: 'log', label: '📋 Log' },
    { tab: 'supplements', label: '💊 Supl.' },
    { tab: 'nalaz', label: '🔬 Nalaz' },
  ];

  return (
    <main className="flex flex-col h-screen bg-gray-950 text-white">
      <div className="p-4 border-b border-gray-800 text-center">
        <h1 className="text-xl font-bold text-green-400">🧠 Health Brain</h1>
        <p className="text-gray-400 text-sm">Tvoj personalni zdravstveni asistent</p>
      </div>

      <div className="flex border-b border-gray-800">
        {tabs.map(({ tab, label }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${activeTab === tab ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-4xl mb-4">💚</p>
                <p>Kako se danas osjećaš?</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-3 rounded-2xl text-sm text-gray-400">Razmišljam...</div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Napiši poruku..."
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={sendMessage} disabled={loading} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-6 py-3 rounded-xl font-medium transition-colors">
              Pošalji
            </button>
          </div>
        </>
      )}

      {activeTab === 'log' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {logTypes.map(({ type, label, emoji }) => (
              <button
                key={type}
                onClick={() => setLogType(type)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${logType === type ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-400 text-sm mb-2">
              {logTypes.find(l => l.type === logType)?.emoji} Unesi {logTypes.find(l => l.type === logType)?.label.toLowerCase()}:
            </p>
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder={
                logType === 'meal' ? 'npr. Piletina 200g, riža 100g...' :
                logType === 'supplement' ? 'npr. Vitamin D 5000IU...' :
                logType === 'sleep' ? 'npr. Spavao 7h, odmoran...' :
                logType === 'energy' ? 'npr. Energija 7/10...' :
                'npr. Glavobolja ujutro...'
              }
              rows={4}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
            />
            <button onClick={saveLog} className="mt-3 w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-medium transition-colors">
              {logSaved ? '✅ Sačuvano!' : 'Sačuvaj'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'supplements' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">Danas — označi šta si uzeo</p>
            <button onClick={() => setAddingSupp(!addingSupp)} className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-xl text-sm font-medium">
              + Dodaj
            </button>
          </div>
          {addingSupp && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-3">
              <input placeholder="Naziv (npr. Vitamin D3)" value={newSupp.name} onChange={(e) => setNewSupp({ ...newSupp, name: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <input placeholder="Doza (npr. 5000 IU)" value={newSupp.dose} onChange={(e) => setNewSupp({ ...newSupp, dose: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <input placeholder="Kada (npr. Ujutro s hranom)" value={newSupp.timing} onChange={(e) => setNewSupp({ ...newSupp, timing: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <button onClick={addSupplement} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-medium">Sačuvaj</button>
            </div>
          )}
          <div className="space-y-3">
            {supplements.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-3xl mb-2">💊</p>
                <p>Nema suplementa. Dodaj prvi!</p>
              </div>
            )}
            {supplements.map((supp) => {
              const taken = isSupplementTaken(supp.id);
              return (
                <div key={supp.id} className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${taken ? 'bg-green-900/30 border border-green-700' : 'bg-gray-900'}`}>
                  <div>
                    <p className={`font-medium ${taken ? 'text-green-400' : 'text-white'}`}>{supp.name}</p>
                    <p className="text-gray-400 text-sm">{supp.dose} · {supp.timing}</p>
                  </div>
                  <button onClick={() => toggleSupplement(supp.id, !taken)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${taken ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                    {taken ? '✅ Uzeto' : 'Označi'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'nalaz' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-3">📸 Uploadaj sliku medicinskog nalaza</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={analyzeFile}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl py-8 text-gray-400 hover:text-green-400 transition-colors text-sm"
            >
              {preview ? '📷 Promijeni sliku' : '📷 Odaberi sliku nalaza'}
            </button>
          </div>

          {preview && (
            <div className="mb-4">
              <img src={preview} alt="Nalaz" className="w-full rounded-xl max-h-48 object-cover" />
            </div>
          )}

          {analyzing && (
            <div className="bg-gray-900 rounded-2xl p-4 text-center text-gray-400">
              <p className="text-2xl mb-2">🔬</p>
              <p>Analiziram nalaz...</p>
            </div>
          )}

          {analysis && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-green-400 font-medium mb-2">📋 Analiza nalaza:</p>
              <p className="text-gray-100 text-sm whitespace-pre-wrap">{analysis}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}