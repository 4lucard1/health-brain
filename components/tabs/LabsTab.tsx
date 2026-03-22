'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '@/components/ui/Badge';

interface MedicalRecord {
  id: string;
  title: string;
  extracted_text: string;
  ai_analysis: string;
  date: string;
  created_at: string;
  record_type: string;
}

const getRiskBadge = (analysis: string): { label: string; variant: 'green' | 'yellow' | 'red' } => {
  const lower = analysis.toLowerCase();
  if (lower.includes('⚠️') || lower.includes('visok') || lower.includes('high') || lower.includes('abnormal') || lower.includes('kritič')) {
    return { label: 'High Risk', variant: 'red' };
  }
  if (lower.includes('umjeren') || lower.includes('moderate') || lower.includes('borderline') || lower.includes('prati')) {
    return { label: 'Monitor', variant: 'yellow' };
  }
  return { label: 'Normal', variant: 'green' };
};

export default function LabsTab() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    const res = await fetch('/api/records');
    const { data } = await res.json();
    setRecords(data || []);
  };

  const analyzeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setAnalysis('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', recordTitle || 'Nalaz ' + new Date().toLocaleDateString());
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setAnalysis(data.analysis || data.error);
      setRecordTitle('');
      fetchRecords();
    } catch { setAnalysis('Greška pri analizi.'); }
    finally { setAnalyzing(false); }
  };

  // RECORD DETAIL VIEW
  if (selectedRecord) {
    const risk = getRiskBadge(selectedRecord.ai_analysis);
    const glowColor = risk.variant === 'red' ? 'rgba(239,68,68,0.15)' : risk.variant === 'yellow' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)';
    const borderColor = risk.variant === 'red' ? 'rgba(239,68,68,0.3)' : risk.variant === 'yellow' ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)';

    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSelectedRecord(null)}
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px', color: '#F5F5F5', cursor: 'pointer', fontSize: '14px' }}>
            ← Back
          </motion.button>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>{selectedRecord.title}</h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{new Date(selectedRecord.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Risk Badge with Glow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', borderRadius: '20px',
            backgroundColor: glowColor,
            border: `1px solid ${borderColor}`,
            boxShadow: `0 0 20px ${glowColor}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: risk.variant === 'red' ? '#EF4444' : risk.variant === 'yellow' ? '#EAB308' : '#22C55E', boxShadow: `0 0 8px ${risk.variant === 'red' ? '#EF4444' : risk.variant === 'yellow' ? '#EAB308' : '#22C55E'}` }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: risk.variant === 'red' ? '#EF4444' : risk.variant === 'yellow' ? '#EAB308' : '#22C55E' }}>
              {risk.label}
            </span>
          </div>
          <Badge label={selectedRecord.record_type} variant="blue" />
        </div>

        {/* AI Analysis */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: glowColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '20px', padding: '20px', marginBottom: '16px',
            boxShadow: `0 0 40px ${glowColor}`
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>AI Analysis</p>
          </div>
          <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedRecord.ai_analysis}</p>
        </motion.div>

        {/* Extracted Data */}
        {selectedRecord.extracted_text && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF', marginBottom: '12px' }}>Raw Data</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{selectedRecord.extracted_text}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Lab Results</h2>
        <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Upload & analyze your medical reports</p>
      </div>

      {/* Upload Section */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '16px', marginBottom: '16px' }}>
        <input
          placeholder="Record title (e.g. Blood Test March 2026)"
          value={recordTitle}
          onChange={(e) => setRecordTitle(e.target.value)}
          style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 14px', color: '#F5F5F5', fontSize: '14px', outline: 'none', marginBottom: '12px' }}
        />
        <input ref={fileRef} type="file" accept="image/*" onChange={analyzeFile} style={{ display: 'none' }} />
        <motion.button
          whileHover={{ scale: 1.01, borderColor: 'rgba(34,197,94,0.5)' }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileRef.current?.click()}
          style={{ width: '100%', padding: '28px', border: '2px dashed rgba(34,197,94,0.25)', borderRadius: '16px', backgroundColor: 'rgba(34,197,94,0.04)', color: '#22C55E', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <p style={{ fontSize: '28px', marginBottom: '8px' }}>📋</p>
          <p style={{ fontWeight: 600 }}>Upload lab result</p>
          <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Image analyzed & deleted immediately</p>
        </motion.button>
      </div>

      {/* Analyzing */}
      <AnimatePresence>
        {analyzing && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px', padding: '24px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔬</p>
            <p style={{ color: '#F5F5F5', fontWeight: 600, marginBottom: '6px' }}>Analyzing...</p>
            <p style={{ color: '#9CA3AF', fontSize: '13px' }}>AI is reading your lab results</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest Analysis */}
      <AnimatePresence>
        {analysis && !analyzing && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '20px', marginBottom: '16px', boxShadow: '0 0 30px rgba(34,197,94,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#22C55E' }}>Latest Analysis</p>
              <Badge label="New" variant="green" />
            </div>
            <p style={{ fontSize: '14px', color: '#F5F5F5', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{analysis}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records History */}
      {records.length > 0 && (
        <div>
          <p style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>History</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <AnimatePresence>
              {records.map((record, i) => {
                const risk = getRiskBadge(record.ai_analysis);
                const glowColor = risk.variant === 'red' ? 'rgba(239,68,68,0.08)' : risk.variant === 'yellow' ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.05)';
                return (
                  <motion.button key={record.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedRecord(record)}
                    style={{ width: '100%', backgroundColor: glowColor, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>{record.title}</p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>🔬 {new Date(record.created_at).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge label={risk.label} variant={risk.variant} />
                        <span style={{ color: '#9CA3AF', fontSize: '16px' }}>›</span>
                      </div>
                    </div>
                    {record.ai_analysis && (
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '8px', lineHeight: '1.4' }}>
                        {record.ai_analysis.substring(0, 80)}...
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}