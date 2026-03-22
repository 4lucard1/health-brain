'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressRing from '@/components/ui/ProgressRing';

interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
}

interface SupplementLog {
  supplement_id: string;
  taken: boolean;
}

export default function SupplementsTab() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [newSupp, setNewSupp] = useState({ name: '', dose: '', timing: '' });
  const [addingSupp, setAddingSupp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [celebratedIds, setCelebratedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([fetchSupplements(), fetchSupplementLogs()]).finally(() => setLoading(false));
  }, []);

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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSupp),
    });
    setNewSupp({ name: '', dose: '', timing: '' });
    setAddingSupp(false);
    fetchSupplements();
  };

  const toggleSupplement = async (supplement_id: string, taken: boolean) => {
    await fetch('/api/supplements/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplement_id, taken }),
    });
    if (taken) {
      setCelebratedIds(prev => new Set([...prev, supplement_id]));
      setTimeout(() => setCelebratedIds(prev => { const n = new Set(prev); n.delete(supplement_id); return n; }), 1500);
    }
    fetchSupplementLogs();
  };

  const deleteSupplement = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/supplements/${id}`, { method: 'DELETE' });
    setSupplements(prev => prev.filter(s => s.id !== id));
    setDeletingId(null);
  };

  const isSupplementTaken = (id: string) => supplementLogs.find(l => l.supplement_id === id)?.taken || false;
  const takenCount = supplements.filter(s => isSupplementTaken(s.id)).length;
  const percentage = supplements.length > 0 ? Math.round((takenCount / supplements.length) * 100) : 0;
  const allDone = supplements.length > 0 && takenCount === supplements.length;

  return (
    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
      <div style={{ padding: '16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '2px' }}>Supplements</h2>
            <p style={{ color: '#9CA3AF', fontSize: '12px' }}>{takenCount}/{supplements.length} taken today</p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setAddingSupp(!addingSupp)}
            style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', padding: '8px 14px', color: '#22C55E', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            {addingSupp ? '✕ Close' : '+ Add'}
          </motion.button>
        </div>

        {/* All done celebration */}
        <AnimatePresence>
          {allDone && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '16px', padding: '14px', marginBottom: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '24px', marginBottom: '4px' }}>🎉</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', marginBottom: '2px' }}>All done for today!</p>
              <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Great job staying consistent</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Ring */}
        {supplements.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
            <ProgressRing percentage={percentage} size={110} strokeWidth={8} label={`${percentage}%`} sublabel="completed" />
          </div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {addingSupp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { key: 'name', placeholder: 'Name (e.g. Vitamin D3)' },
                  { key: 'dose', placeholder: 'Dose (e.g. 5000 IU)' },
                  { key: 'timing', placeholder: 'When (e.g. Morning with food)' }
                ].map(({ key, placeholder }) => (
                  <input key={key} placeholder={placeholder}
                    value={newSupp[key as keyof typeof newSupp]}
                    onChange={(e) => setNewSupp({ ...newSupp, [key]: e.target.value })}
                    style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', color: '#F5F5F5', fontSize: '16px', outline: 'none' }} />
                ))}
                <motion.button whileTap={{ scale: 0.98 }} onClick={addSupplement}
                  style={{ padding: '13px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Save Supplement
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {supplements.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>💊</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#F5F5F5', marginBottom: '4px' }}>No supplements yet</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px' }}>Add your daily supplements to track them</p>
            <button onClick={() => setAddingSupp(true)}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #22C55E, #16A34A)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Add First Supplement
            </button>
          </motion.div>
        )}

        {/* Supplement Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence>
            {supplements.map((supp, i) => {
              const taken = isSupplementTaken(supp.id);
              const celebrated = celebratedIds.has(supp.id);
              return (
                <motion.div key={supp.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  exit={{ opacity: 0, x: -100 }}
                  style={{
                    backgroundColor: taken ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                    border: taken ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'all 0.3s ease',
                    boxShadow: celebrated ? '0 0 20px rgba(34,197,94,0.2)' : taken ? '0 0 12px rgba(34,197,94,0.06)' : 'none',
                    gap: '10px',
                    position: 'relative', overflow: 'hidden',
                  }}>
                  {/* Celebrate flash */}
                  {celebrated && (
                    <motion.div initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} transition={{ duration: 1.5 }}
                      style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(34,197,94,0.15)', pointerEvents: 'none' }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: taken ? '#22C55E' : '#F5F5F5', marginBottom: '2px', transition: 'color 0.3s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{supp.name}</p>
                    <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{supp.dose} · {supp.timing}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                      onClick={() => toggleSupplement(supp.id, !taken)}
                      style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.3s', ...(taken ? { background: 'linear-gradient(135deg, #22C55E, #16A34A)', color: '#fff', boxShadow: '0 4px 12px rgba(34,197,94,0.35)' } : { backgroundColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)' }) }}>
                      {taken ? '✅' : 'Mark'}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }}
                      onClick={() => deleteSupplement(supp.id)}
                      disabled={deletingId === supp.id}
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '7px 8px', color: '#EF4444', fontSize: '12px', cursor: 'pointer', opacity: deletingId === supp.id ? 0.5 : 1 }}>
                      🗑️
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}