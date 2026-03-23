'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type LogType = 'meal' | 'supplement' | 'sleep' | 'energy' | 'symptom';
type ScanType = 'food' | 'label' | 'supplement';

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

const bgColors: Record<string, string> = {
  meal: 'rgba(249,115,22,0.06)', supplement: 'rgba(59,130,246,0.06)',
  sleep: 'rgba(168,85,247,0.06)', energy: 'rgba(234,179,8,0.06)', symptom: 'rgba(239,68,68,0.06)',
};

export default function LogTab() {
  const [logType, setLogType] = useState<LogType>('meal');
  const [logInput, setLogInput] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Scan states
  const [activeScanTab, setActiveScanTab] = useState<'food' | 'pharma'>('food');
  const [showScanSheet, setShowScanSheet] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [scanError, setScanError] = useState('');
  const [scannedProductName, setScannedProductName] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const scanFileRef = useRef<HTMLInputElement>(null);
  const photoFileRef = useRef<HTMLInputElement>(null);

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

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>, type: ScanType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult('');
    setScanError('');
    setShowManualInput(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('scanType', type);

    try {
      const res = await fetch('/api/scan', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error || !data.result) {
        setScanError(data.message || 'Nije moguće analizirati. Pokušajte ponovo.');
        setShowManualInput(true);
      } else {
        setScanResult(data.result);
      }
    } catch {
      setScanError('Greška pri skeniranju. Pokušajte ponovo.');
      setShowManualInput(true);
    } finally {
      setScanning(false);
      if (e.target) e.target.value = '';
    }
  };

const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setScanning(true);
  setLogInput('');
  setScanError('');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('scanType', 'food');

  try {
    const res = await fetch('/api/scan', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.result) {
      setLogInput(data.result);
      setLogType('meal');
      setScanError('');
    } else {
      setScanError(data.message || 'Could not analyze image. Please take a photo of food.');
      setLogInput('');
    }
  } catch {
    setScanError('Error analyzing photo. Please try again.');
    setLogInput('');
  } finally {
    setScanning(false);
    if (e.target) e.target.value = '';
  }
};

  const saveScanAsLog = async () => {
    const note = scanResult || manualInput;
    if (!note) return;
    const name = scannedProductName ? `${scannedProductName}: ${note}` : note;
    await fetch('/api/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeScanTab === 'food' ? 'meal' : 'supplement', data: { note: name, timestamp: new Date().toISOString() } }),
    });
    setScanResult(''); setScannedProductName(''); setManualInput('');
    setShowScanSheet(false); setScanError(''); setShowManualInput(false);
    fetchLogs();
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
      <div style={{ padding: '16px 16px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '1px', letterSpacing: '-0.02em' }}>Daily Log</h2>
            <p style={{ color: '#6B7280', fontSize: '12px' }}>{logs.length} {logs.length === 1 ? 'entry' : 'entries'} · {isToday ? 'Today' : selectedDate}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button onClick={() => { setShowScanSheet(!showScanSheet); setScanResult(''); setScanError(''); }}
              style={{ backgroundColor: showScanSheet ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${showScanSheet ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', padding: '7px 12px', color: showScanSheet ? '#22C55E' : '#9CA3AF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              {showScanSheet ? '✕' : '📸 Scan'}
            </button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '7px 10px', color: '#F5F5F5', fontSize: '12px', outline: 'none', maxWidth: '130px' }} />
          </div>
        </div>

        {/* SCAN SHEET */}
        <AnimatePresence>
          {showScanSheet && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '16px' }}>

                {/* Scan type tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {[
                    { key: 'food', label: '🍽️ Food & Labels', desc: 'Photo of meal or product label' },
                    { key: 'pharma', label: '💊 Supplements & Pharma', desc: 'Supplements, medications, hormones' },
                  ].map(({ key, label, desc }) => (
                    <button key={key} onClick={() => { setActiveScanTab(key as any); setScanResult(''); setScanError(''); setShowManualInput(false); }}
                      style={{ flex: 1, padding: '10px 8px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                        ...(activeScanTab === key ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' } : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF' }) }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{label}</p>
                      <p style={{ fontSize: '10px', opacity: 0.8 }}>{desc}</p>
                    </button>
                  ))}
                </div>

                {/* Food scan */}
                {activeScanTab === 'food' && (
                  <div>
                    <input ref={photoFileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoScan} style={{ display: 'none' }} />
                    <input ref={scanFileRef} type="file" accept="image/*" capture="environment"
                      onChange={(e) => handleScan(e, 'label')} style={{ display: 'none' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => photoFileRef.current?.click()}
                        style={{ flex: 1, padding: '14px', border: '1.5px dashed rgba(34,197,94,0.3)', borderRadius: '14px', backgroundColor: 'rgba(34,197,94,0.04)', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                        📷<br /><span style={{ fontSize: '12px', fontWeight: 400, color: '#9CA3AF' }}>Photo of meal</span>
                      </button>
                      <button onClick={() => scanFileRef.current?.click()}
                        style={{ flex: 1, padding: '14px', border: '1.5px dashed rgba(59,130,246,0.3)', borderRadius: '14px', backgroundColor: 'rgba(59,130,246,0.04)', color: '#3B82F6', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                        🏷️<br /><span style={{ fontSize: '12px', fontWeight: 400, color: '#9CA3AF' }}>Product label</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Pharma scan */}
                {activeScanTab === 'pharma' && (
                  <div>
                    <input ref={scanFileRef} type="file" accept="image/*" capture="environment"
                      onChange={(e) => handleScan(e, 'supplement')} style={{ display: 'none' }} id="pharma-scan" />

                    <button onClick={() => (document.getElementById('pharma-scan') as HTMLInputElement)?.click()}
                      style={{ width: '100%', padding: '16px', border: '1.5px dashed rgba(168,85,247,0.3)', borderRadius: '14px', backgroundColor: 'rgba(168,85,247,0.04)', color: '#A855F7', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px' }}>
                      📸 Scan supplement / medication / hormone package
                    </button>

                    <div style={{ backgroundColor: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '12px', padding: '10px 12px', marginBottom: '10px' }}>
                      <p style={{ fontSize: '11px', color: '#EAB308', lineHeight: '1.5' }}>
                        ⚠️ AI will provide objective information only. Always consult a doctor or pharmacist before use.
                      </p>
                    </div>

                    <button onClick={() => setShowManualInput(!showManualInput)}
                      style={{ width: '100%', padding: '10px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer' }}>
                      ✏️ Enter name manually instead
                    </button>
                  </div>
                )}

                {/* Scanning indicator */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(34,197,94,0.06)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #22C55E', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ fontSize: '13px', color: '#22C55E' }}>Analyzing...</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error state */}
                <AnimatePresence>
                  {scanError && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px' }}>
                      <p style={{ fontSize: '13px', color: '#EF4444', lineHeight: '1.5', marginBottom: '8px' }}>{scanError}</p>
                      <button onClick={() => setShowManualInput(true)}
                        style={{ padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F5F5F5', fontSize: '12px', cursor: 'pointer' }}>
                        ✏️ Enter manually
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Manual input */}
                <AnimatePresence>
                  {showManualInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: '12px', overflow: 'hidden' }}>
                      <input
                        placeholder="Enter product/supplement name..."
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '11px 14px', color: '#F5F5F5', fontSize: '15px', outline: 'none', marginBottom: '8px' }}
                      />
                      <p style={{ fontSize: '11px', color: '#6B7280' }}>After saving, ask the AI assistant for detailed information about this product.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scan result */}
                <AnimatePresence>
                  {scanResult && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      style={{ marginTop: '12px' }}>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px', marginBottom: '10px', maxHeight: '160px', overflowY: 'auto' }}>
                        <p style={{ fontSize: '12px', color: '#F5F5F5', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{scanResult}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Save button */}
                {(scanResult || manualInput) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <input
                      placeholder="Product name (optional)"
                      value={scannedProductName}
                      onChange={(e) => setScannedProductName(e.target.value)}
                      style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 12px', color: '#F5F5F5', fontSize: '15px', outline: 'none', marginBottom: '8px', marginTop: '4px' }}
                    />
                    <button onClick={saveScanAsLog}
                      style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                      Save to Log ✓
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
{/* Photo scan error */}
<AnimatePresence>
  {scanError && !showScanSheet && (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
      <div>
        <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: 600, marginBottom: '2px' }}>Photo not recognized</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: '1.5' }}>{scanError}</p>
      </div>
      <button onClick={() => setScanError('')} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '16px', marginLeft: 'auto', flexShrink: 0 }}>×</button>
    </motion.div>
  )}
</AnimatePresence>
        {/* Log type selector */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
          {logTypes.map(({ type, label, emoji }) => (
            <button key={type} onClick={() => setLogType(type)}
              style={{ padding: '7px 13px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                ...(logType === type ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.25)' } : { backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.07)' }) }}>
              {emoji} {label}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', padding: '14px', marginBottom: '20px' }}>
          <textarea value={logInput} onChange={(e) => setLogInput(e.target.value)}
            placeholder={
              logType === 'meal' ? 'e.g. Chicken 200g, rice 100g, salad...' :
              logType === 'supplement' ? 'e.g. Vitamin D3 5000IU, Omega-3 2g...' :
              logType === 'sleep' ? 'e.g. 7h sleep, woke up once, felt rested...' :
              logType === 'energy' ? 'e.g. Energy 7/10, tired after lunch...' :
              'e.g. Headache in the morning, gone after coffee...'
            }
            rows={3}
            style={{ width: '100%', backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '15px', resize: 'none', outline: 'none', lineHeight: '1.65' }} />
          <button onClick={saveLog}
            style={{ marginTop: '10px', width: '100%', padding: '13px', background: logSaved ? '#16A34A' : 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.25)', transition: 'all 0.3s' }}>
            {logSaved ? '✅ Saved!' : 'Save Log'}
          </button>
        </div>

        {/* History */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</p>
          <p style={{ color: '#6B7280', fontSize: '11px' }}>{logs.length} entries</p>
        </div>

        {/* Empty state */}
        {logs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '16px', padding: '36px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>📋</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>No logs yet</p>
            <p style={{ fontSize: '12px', color: '#6B7280' }}>Start tracking your health above</p>
          </motion.div>
        )}

        {/* Log cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {logs.map((log, i) => {
              const info = logTypes.find(l => l.type === log.type);
              return (
                <motion.div key={log.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                  style={{ backgroundColor: bgColors[log.type] || 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '12px 14px', borderLeft: `3px solid ${borderColors[log.type]}`, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>{info?.emoji} {info?.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>{new Date(log.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                      <motion.button whileTap={{ scale: 0.85 }} onClick={() => deleteLog(log.id)}
                        disabled={deletingId === log.id}
                        style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '7px', padding: '3px 7px', color: '#EF4444', fontSize: '11px', cursor: 'pointer', opacity: deletingId === log.id ? 0.4 : 1 }}>
                        {deletingId === log.id ? '...' : '✕'}
                      </motion.button>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#F5F5F5', lineHeight: '1.55', wordBreak: 'break-word' }}>{log.data.note}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}