'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  const scanFileRef = { current: null as HTMLInputElement | null };

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

  const saveScanAsLog = async () => {
    if (!scanResult || !scannedProductName) return;
    await fetch('/api/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logType, data: { note: `${scannedProductName}: ${scanResult}`, timestamp: new Date().toISOString() } }),
    });
    setScanResult(''); setScannedProductName(''); setShowScanSheet(false);
    fetchLogs();
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Daily Log</h2>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Track your health data</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowScanSheet(!showScanSheet)} style={{ backgroundColor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '14px', padding: '8px 14px', color: '#3B82F6', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>📸 Scan</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', color: '#F5F5F5', fontSize: '12px', outline: 'none' }} />
        </div>
      </div>

      {showScanSheet && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '16px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontWeight: 600, color: '#3B82F6' }}>📸 Scan Product</p>
            <button onClick={() => { setShowScanSheet(false); setScanResult(''); }} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
          <input ref={(el) => { scanFileRef.current = el; }} type="file" accept="image/*" onChange={scanProduct} style={{ display: 'none' }} />
          <button onClick={() => scanFileRef.current?.click()} style={{ width: '100%', padding: '18px', border: '2px dashed rgba(59,130,246,0.3)', borderRadius: '14px', backgroundColor: 'transparent', color: '#3B82F6', fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}>📷 Take photo of product label</button>
          {scanning && <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '8px' }}>Scanning...</p>}
          {scanResult && (
            <div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                <p style={{ fontSize: '13px', color: '#F5F5F5', whiteSpace: 'pre-wrap' }}>{scanResult}</p>
              </div>
              <input placeholder="Product name" value={scannedProductName} onChange={(e) => setScannedProductName(e.target.value)}
                style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none', marginBottom: '8px' }} />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[{ type: 'meal' as LogType, emoji: '🍽️', label: 'Meal' }, { type: 'supplement' as LogType, emoji: '💊', label: 'Supplement' }].map(({ type, emoji, label }) => (
                  <button key={type} onClick={() => setLogType(type)} style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF' }) }}>{emoji} {label}</button>
                ))}
              </div>
              <button onClick={saveScanAsLog} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Save to Log ✓</button>
            </div>
          )}
        </motion.div>
      )}

      {/* Log type selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {logTypes.map(({ type, label, emoji }) => (
          <motion.button key={type} whileTap={{ scale: 0.95 }} onClick={() => setLogType(type)}
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.04)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.06)' }) }}>
            {emoji} {label}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '16px', marginBottom: '20px' }}>
        <textarea value={logInput} onChange={(e) => setLogInput(e.target.value)}
          placeholder={logType === 'meal' ? 'e.g. Chicken 200g, rice 100g...' : logType === 'supplement' ? 'e.g. Vitamin D 5000IU...' : logType === 'sleep' ? 'e.g. 7h sleep, felt rested...' : logType === 'energy' ? 'e.g. Energy 7/10...' : 'e.g. Headache in morning...'}
          rows={3}
          style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '14px', resize: 'none', outline: 'none', lineHeight: '1.6' }} />
        <motion.button whileTap={{ scale: 0.98 }} onClick={saveLog}
          style={{ marginTop: '12px', width: '100%', padding: '14px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
          {logSaved ? '✅ Saved!' : 'Save Log'}
        </motion.button>
      </div>

      {/* History */}
      <p style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {logs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: '14px' }}>No logs for this day.</div>}
        {logs.map((log, i) => {
          const info = logTypes.find(l => l.type === log.type);
          return (
            <motion.div key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '14px 16px', borderLeft: `3px solid ${borderColors[log.type]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{info?.emoji} {info?.label}</span>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(log.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.5' }}>{log.data.note}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}