'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type LogType = 'meal' | 'supplement' | 'sleep' | 'energy' | 'symptom';

interface DailyLog {
  id: string;
  type: string;
  data: { note: string; timestamp: string };
  created_at: string;
}

const logTypes: { type: LogType; label: string; emoji: string }[] = [
  { type: 'meal', label: 'Obrok', emoji: '🍽️' },
  { type: 'supplement', label: 'Suplement', emoji: '💊' },
  { type: 'sleep', label: 'San', emoji: '😴' },
  { type: 'energy', label: 'Energija', emoji: '⚡' },
  { type: 'symptom', label: 'Simptom', emoji: '⚠️' },
];

const borderColors: Record<string, string> = {
  meal: '#F97316', supplement: '#3B82F6',
  sleep: '#A855F7', energy: '#EAB308', symptom: '#EF4444',
};

const emptyMessages: Record<string, { emoji: string; title: string; sub: string }> = {
  meal: { emoji: '🍽️', title: 'No meals logged', sub: 'What did you eat today?' },
  supplement: { emoji: '💊', title: 'No supplements logged', sub: 'Did you take your supplements?' },
  sleep: { emoji: '😴', title: 'No sleep logged', sub: 'How did you sleep last night?' },
  energy: { emoji: '⚡', title: 'No energy logged', sub: 'How is your energy today?' },
  symptom: { emoji: '🩺', title: 'No symptoms logged', sub: 'Feeling good? Great!' },
  all: { emoji: '📋', title: 'No logs yet', sub: 'Start tracking your health today' },
};

export default function LogTab() {
  const [logType, setLogType] = useState<LogType>('meal');
  const [logInput, setLogInput] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScanSheet, setShowScanSheet] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [scannedProductName, setScannedProductName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scanFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  useEffect(() => { fetchLogs(); }, [selectedDate]);

  const fetchLogs = async () => {
    const res = await fetch(`/api/log?date=${selectedDate}`);
    const { data } = await res.json();
    setLogs(data || []);
  };

  const saveLog = async () => {
    if (!logInput.trim()) return;
    await fetch('/api/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logType, data: { note: logInput, timestamp: new Date().toISOString() } }),
    });
    setLogInput('');
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    fetchLogs();
  };

  const deleteLog = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/log/${id}`, { method: 'DELETE' });
    setLogs(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  const scanProduct = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await res.json();
      setScanResult(data.extracted || data.error);
    } catch { setScanResult('Greška pri skeniranju.'); }
    finally { setScanning(false); }
  };

  const analyzePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingPhoto(true);
    setLogInput('Analiziram fotografiju hrane...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/analyze-food', { method: 'POST', body: formData });
      const data = await res.json();
      setLogInput(data.result || 'Nije moguće prepoznati hranu.');
      setLogType('meal');
    } catch { setLogInput('Greška pri analizi.'); }
    finally { setAnalyzingPhoto(false); }
  };

  const saveScanAsLog = async () => {
    if (!scanResult || !scannedProductName) return;
    await fetch('/api/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logType, data: { note: `${scannedProductName}: ${scanResult}`, timestamp: new Date().toISOString() } }),
    });
    setScanResult(''); setScannedProductName(''); setShowScanSheet(false);
    fetchLogs();
  };

  const filteredLogs = logs;
  const empty = emptyMessages['all'];

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
      <div style={{ padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>Daily Log</h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{logs.length} entries today</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button onClick={() => setShowScanSheet(!showScanSheet)}
              style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '7px 11px', color: '#3B82F6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>📸 Scan</button>
            <input ref={photoFileRef} type="file" accept="image/*" capture="environment" onChange={analyzePhoto} style={{ display: 'none' }} />
            <button onClick={() => photoFileRef.current?.click()}
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '7px 11px', color: '#22C55E', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>📷 Photo</button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '7px 10px', color: '#F5F5F5', fontSize: '11px', outline: 'none', maxWidth: '120px' }} />
          </div>
        </div>

        {/* Photo analyzing indicator */}
        <AnimatePresence>
          {analyzingPhoto && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <p style={{ fontSize: '13px', color: '#22C55E' }}>Analyzing food photo...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Sheet */}
        <AnimatePresence>
          {showScanSheet && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '16px', padding: '14px', marginBottom: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <p style={{ fontWeight: 600, color: '#3B82F6', fontSize: '14px' }}>📸 Scan Product Label</p>
                <button onClick={() => { setShowScanSheet(false); setScanResult(''); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '20px', padding: '0 4px' }}>×</button>
              </div>
              <input ref={scanFileRef} type="file" accept="image/*" capture="environment" onChange={scanProduct} style={{ display: 'none' }} />
              <button onClick={() => scanFileRef.current?.click()} style={{ width: '100%', padding: '14px', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '12px', backgroundColor: 'transparent', color: '#3B82F6', fontSize: '14px', cursor: 'pointer', marginBottom: '10px' }}>📷 Take photo of product label</button>
              {scanning && <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '8px', fontSize: '13px' }}>Scanning...</p>}
              {scanResult && (
                <div>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px', marginBottom: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                    <p style={{ fontSize: '12px', color: '#F5F5F5', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{scanResult}</p>
                  </div>
                  <input placeholder="Product name (e.g. Kinder Bueno)" value={scannedProductName}
                    onChange={(e) => setScannedProductName(e.target.value)}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#F5F5F5', fontSize: '16px', outline: 'none', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    {[{ type: 'meal' as LogType, emoji: '🍽️', label: 'Meal' }, { type: 'supplement' as LogType, emoji: '💊', label: 'Supplement' }].map(({ type, emoji, label }) => (
                      <button key={type} onClick={() => setLogType(type)} style={{ padding: '8px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', flex: 1, ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }) }}>{emoji} {label}</button>
                    ))}
                  </div>
                  <button onClick={saveScanAsLog} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save to Log ✓</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Log type selector */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' as any }}>
          {logTypes.map(({ type, label, emoji }) => (
            <button key={type} onClick={() => setLogType(type)}
              style={{ padding: '7px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.06)' }) }}>
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '12px', marginBottom: '16px' }}>
          <textarea value={logInput} onChange={(e) => setLogInput(e.target.value)}
            placeholder={logType === 'meal' ? 'e.g. Chicken 200g, rice 100g...' : logType === 'supplement' ? 'e.g. Vitamin D 5000IU...' : logType === 'sleep' ? 'e.g. 7h sleep, felt rested...' : logType === 'energy' ? 'e.g. Energy 7/10...' : 'e.g. Headache in morning...'}
            rows={3}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '15px', resize: 'none', outline: 'none', lineHeight: '1.6' }} />
          <button onClick={saveLog}
            style={{ marginTop: '10px', width: '100%', padding: '13px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
            {logSaved ? '✅ Saved!' : 'Save Log'}
          </button>
        </div>

        {/* History */}
        <p style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 500, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History — {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}</p>

        {/* Empty state */}
        {filteredLogs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '36px', marginBottom: '10px' }}>{empty.emoji}</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>{empty.title}</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{empty.sub}</p>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {filteredLogs.map((log, i) => {
              const info = logTypes.find(l => l.type === log.type);
              return (
                <motion.div key={log.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  exit={{ opacity: 0, x: -100, height: 0 }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 14px', borderLeft: `3px solid ${borderColors[log.type]}`, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{info?.emoji} {info?.label}</span>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(log.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#F5F5F5', lineHeight: '1.5', wordBreak: 'break-word', paddingRight: '32px' }}>{log.data.note}</p>
                    </div>
                  </div>
                  {/* Delete button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteLog(log.id)}
                    disabled={deletingId === log.id}
                    style={{
                      position: 'absolute', top: '10px', right: '10px',
                      backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px', padding: '4px 8px', color: '#EF4444',
                      fontSize: '11px', cursor: 'pointer', opacity: deletingId === log.id ? 0.5 : 1
                    }}>
                    {deletingId === log.id ? '...' : '🗑️'}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}