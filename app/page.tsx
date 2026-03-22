'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

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

interface DailyLog {
  id: string;
  type: string;
  data: { note: string; timestamp: string };
  created_at: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'log' | 'supplements' | 'nalaz' | 'dashboard'>('chat');
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
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'supplements') {
      fetchSupplements();
      fetchSupplementLogs();
    }
    if (activeTab === 'dashboard' || activeTab === 'log') {
      fetchLogs();
    }
  }, [activeTab, selectedDate]);

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

  const fetchLogs = async () => {
    const res = await fetch(`/api/log?date=${selectedDate}`);
    const { data } = await res.json();
    setLogs(data || []);
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
    fetchLogs();
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
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
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

  const logColors: Record<string, string> = {
    meal: 'border-orange-500',
    supplement: 'border-blue-500',
    sleep: 'border-purple-500',
    energy: 'border-yellow-500',
    symptom: 'border-red-500',
  };

  const logBg: Record<string, string> = {
    meal: 'bg-orange-500/10',
    supplement: 'bg-blue-500/10',
    sleep: 'bg-purple-500/10',
    energy: 'bg-yellow-500/10',
    symptom: 'bg-red-500/10',
  };

  const tabs = [
    { tab: 'chat', label: '💬', title: 'Chat' },
    { tab: 'log', label: '📋', title: 'Log' },
    { tab: 'supplements', label: '💊', title: 'Supl.' },
    { tab: 'nalaz', label: '🔬', title: 'Nalaz' },
    { tab: 'dashboard', label: '📊', title: 'Stats' },
  ];

  const takenCount = supplements.filter(s => isSupplementTaken(s.id)).length;

  return (
    <main className="flex flex-col h-screen bg-gray-950 text-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-green-400">🧠 Health Brain</h1>
          <p className="text-gray-500 text-xs">{new Date().toLocaleDateString('bs-BA', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <div className="bg-gray-800 px-2 py-1 rounded-lg text-center">
            <p className="text-green-400 font-bold">{takenCount}/{supplements.length}</p>
            <p className="text-gray-500">supl.</p>
          </div>
          <div className="bg-gray-800 px-2 py-1 rounded-lg text-center">
            <p className="text-blue-400 font-bold">{logs.length}</p>
            <p className="text-gray-500">logova</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabs.map(({ tab, label, title }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 text-xs font-medium transition-all ${activeTab === tab ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <div>{label}</div>
            <div>{title}</div>
          </button>
        ))}
      </div>

      {/* CHAT */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-5xl mb-4">💚</p>
                <p className="text-lg font-medium text-gray-400">Kako se danas osjećaš?</p>
                <p className="text-sm mt-2">Pitaj me za analizu ishrane, savjete ili unesi simptome.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">🧠</div>}
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 rounded-bl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-xs mr-2">🧠</div>
                <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-gray-800 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Napiši poruku..."
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <button onClick={sendMessage} disabled={loading} className="bg-green-600 hover:bg-green-500 disabled:opacity-50 px-5 py-3 rounded-xl font-medium transition-colors">
              ➤
            </button>
          </div>
        </>
      )}

      {/* LOG */}
      {activeTab === 'log' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {logTypes.map(({ type, label, emoji }) => (
              <button key={type} onClick={() => setLogType(type)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${logType === type ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                {emoji} {label}
              </button>
            ))}
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <textarea
              value={logInput}
              onChange={(e) => setLogInput(e.target.value)}
              placeholder={
                logType === 'meal' ? 'npr. Piletina 200g, riža 100g, brokula...' :
                logType === 'supplement' ? 'npr. Vitamin D 5000IU, Omega-3 2g...' :
                logType === 'sleep' ? 'npr. Spavao 7h, probudio se 2x, odmoran...' :
                logType === 'energy' ? 'npr. Energija 7/10, umoran poslije ručka...' :
                'npr. Glavobolja ujutro, nestala nakon kafe...'
              }
              rows={3}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
            />
            <button onClick={saveLog} className="mt-3 w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-medium transition-colors text-sm">
              {logSaved ? '✅ Sačuvano!' : 'Sačuvaj'}
            </button>
          </div>

          {/* Historija logova */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-sm font-medium">Historija</p>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-800 text-white rounded-lg px-3 py-1 text-xs outline-none" />
            </div>
            <div className="space-y-2">
              {logs.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nema logova za ovaj dan.</p>}
              {logs.map((log) => {
                const logInfo = logTypes.find(l => l.type === log.type);
                return (
                  <div key={log.id} className={`p-3 rounded-xl border-l-4 ${logColors[log.type]} ${logBg[log.type]}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-400">{logInfo?.emoji} {logInfo?.label}</p>
                      <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-sm text-gray-200 mt-1">{log.data.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUPLEMENTI */}
      {activeTab === 'supplements' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white font-medium">Suplementi</p>
              <p className="text-gray-400 text-xs">{takenCount}/{supplements.length} uzeto danas</p>
            </div>
            <button onClick={() => setAddingSupp(!addingSupp)} className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-xl text-sm font-medium">
              + Dodaj
            </button>
          </div>
          {supplements.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-3 mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progres</span>
                <span>{Math.round((takenCount / supplements.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(takenCount / supplements.length) * 100}%` }}></div>
              </div>
            </div>
          )}
          {addingSupp && (
            <div className="bg-gray-900 rounded-2xl p-4 mb-4 space-y-3">
              <input placeholder="Naziv (npr. Vitamin D3)" value={newSupp.name} onChange={(e) => setNewSupp({ ...newSupp, name: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <input placeholder="Doza (npr. 5000 IU)" value={newSupp.dose} onChange={(e) => setNewSupp({ ...newSupp, dose: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <input placeholder="Kada (npr. Ujutro s hranom)" value={newSupp.timing} onChange={(e) => setNewSupp({ ...newSupp, timing: e.target.value })} className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 text-sm" />
              <button onClick={addSupplement} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-medium text-sm">Sačuvaj</button>
            </div>
          )}
          <div className="space-y-3">
            {supplements.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <p className="text-3xl mb-2">💊</p>
                <p className="text-sm">Dodaj svoje suplemente!</p>
              </div>
            )}
            {supplements.map((supp) => {
              const taken = isSupplementTaken(supp.id);
              return (
                <div key={supp.id} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${taken ? 'bg-green-900/20 border border-green-700/50' : 'bg-gray-900'}`}>
                  <div>
                    <p className={`font-medium text-sm ${taken ? 'text-green-400' : 'text-white'}`}>{supp.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{supp.dose} · {supp.timing}</p>
                  </div>
                  <button onClick={() => toggleSupplement(supp.id, !taken)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${taken ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    {taken ? '✅ Uzeto' : 'Označi'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NALAZ */}
      {activeTab === 'nalaz' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <p className="text-gray-400 text-sm mb-3">📸 Uploadaj sliku medicinskog nalaza</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={analyzeFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl py-8 text-gray-400 hover:text-green-400 transition-colors text-sm">
              {preview ? '📷 Promijeni sliku' : '📷 Odaberi sliku nalaza'}
            </button>
          </div>
          {preview && <img src={preview} alt="Nalaz" className="w-full rounded-xl max-h-48 object-cover mb-4" />}
          {analyzing && (
            <div className="bg-gray-900 rounded-2xl p-6 text-center text-gray-400">
              <p className="text-3xl mb-2">🔬</p>
              <p className="text-sm">Analiziram nalaz...</p>
            </div>
          )}
          {analysis && (
            <div className="bg-gray-900 rounded-2xl p-4">
              <p className="text-green-400 font-medium mb-3">📋 Analiza nalaza:</p>
              <ReactMarkdown className="prose prose-invert prose-sm max-w-none text-gray-100">
                {analysis}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-medium">Statistike</p>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-1 text-xs outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {logTypes.map(({ type, emoji, label }) => {
              const count = logs.filter(l => l.type === type).length;
              return (
                <div key={type} className={`p-4 rounded-2xl ${logBg[type]} border ${logColors[type]} border-opacity-30`}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="text-xl font-bold text-white">{count}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              );
            })}
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
              <p className="text-2xl mb-1">💊</p>
              <p className="text-xl font-bold text-white">{takenCount}/{supplements.length}</p>
              <p className="text-xs text-gray-400">Suplementi</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4">
            <p className="text-gray-400 text-sm font-medium mb-3">Svi logovi za dan</p>
            <div className="space-y-2">
              {logs.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nema logova za ovaj dan.</p>}
              {logs.map((log) => {
                const logInfo = logTypes.find(l => l.type === log.type);
                return (
                  <div key={log.id} className={`p-3 rounded-xl border-l-4 ${logColors[log.type]}`}>
                    <div className="flex justify-between">
                      <p className="text-xs text-gray-400">{logInfo?.emoji} {logInfo?.label}</p>
                      <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <p className="text-sm text-gray-200 mt-1">{log.data.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}