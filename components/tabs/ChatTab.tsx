'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowOrb from '@/components/ui/GlowOrb';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: string[];
}

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  goals: string[];
}

interface ChatTabProps {
  profile: UserProfile | null;
}

const parseMessage = (content: string): { text: string; options: string[] } => {
  const match = content.match(/\[OPCIJE:\s*([^\]]+)\]/);
  if (match) {
    const options = match[1].split('|').map(o => o.trim()).filter(Boolean);
    return { text: content.replace(/\[OPCIJE:[^\]]+\]/, '').trim(), options };
  }
  return { text: content, options: [] };
};

// Custom markdown renderer - no external packages needed
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // H1
    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} style={{ fontSize: '15px', fontWeight: 700, color: '#F5F5F5', marginBottom: '8px', marginTop: '12px', letterSpacing: '-0.01em' }}>
          {renderInline(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} style={{ fontSize: '14px', fontWeight: 700, color: '#22C55E', marginBottom: '6px', marginTop: '10px' }}>
          {renderInline(line.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={i} style={{ fontSize: '13px', fontWeight: 600, color: '#A3E635', marginBottom: '4px', marginTop: '8px' }}>
          {renderInline(line.slice(4))}
        </h4>
      );
      i++;
      continue;
    }

    // HR
    if (line.startsWith('---') || line.startsWith('***') || line.startsWith('___')) {
      elements.push(
        <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '10px 0' }} />
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.match(/^[-*+] /)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        listItems.push(
          <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ color: '#22C55E', flexShrink: 0, marginTop: '1px', fontSize: '12px' }}>→</span>
            <span style={{ color: '#F5F5F5', fontSize: '14px', lineHeight: '1.6' }}>{renderInline(lines[i].slice(2))}</span>
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ listStyle: 'none', padding: 0, margin: '6px 0' }}>
          {listItems}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const listItems: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        const content = lines[i].replace(/^\d+\. /, '');
        listItems.push(
          <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '4px' }}>
            <span style={{ color: '#22C55E', flexShrink: 0, fontWeight: 700, fontSize: '13px', minWidth: '18px' }}>{num}.</span>
            <span style={{ color: '#F5F5F5', fontSize: '14px', lineHeight: '1.6' }}>{renderInline(content)}</span>
          </li>
        );
        num++;
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ listStyle: 'none', padding: 0, margin: '6px 0' }}>
          {listItems}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} style={{ borderLeft: '3px solid #22C55E', paddingLeft: '12px', margin: '8px 0', color: '#9CA3AF', fontStyle: 'italic', fontSize: '13px' }}>
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} style={{ marginBottom: '8px', lineHeight: '1.7', color: '#F5F5F5', fontSize: '14px' }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return elements;
};

const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} style={{ color: '#22C55E', fontWeight: 700 }}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // Italic *text*
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch && italicMatch.index !== undefined) {
      if (italicMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, italicMatch.index)}</span>);
      }
      parts.push(<em key={key++} style={{ color: '#A3E635', fontStyle: 'italic' }}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
      continue;
    }

    // Inline code `code`
    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch && codeMatch.index !== undefined) {
      if (codeMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>);
      }
      parts.push(
        <code key={key++} style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E', padding: '1px 6px', borderRadius: '5px', fontSize: '13px', fontFamily: 'monospace' }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
};

export default function ChatTab({ profile }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;
    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await response.json();
      const { text: parsedText, options } = parseMessage(data.message);
      setMessages([...newMessages, { role: 'assistant', content: parsedText, options }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Context Ribbon */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        display: 'flex', gap: '8px', overflowX: 'auto', flexShrink: 0,
      }}>
        {['AI Ready', 'Logs connected', 'Memory active'].map((item, i) => (
          <span key={i} style={{
            whiteSpace: 'nowrap', fontSize: '11px', padding: '4px 10px',
            borderRadius: '20px', backgroundColor: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.15)', color: '#22C55E',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} />
            {item}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '20px 16px',
        WebkitOverflowScrolling: 'touch' as any,
      }}>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}
          >
            <GlowOrb size={80} color="green" pulse emoji="🧠" />
            <p style={{ fontSize: '22px', fontWeight: 700, marginTop: '24px', marginBottom: '8px', letterSpacing: '-0.02em' }} className="gradient-text">
              {profile?.name ? `Hey ${profile.name} 👋` : 'Health Brain'}
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6', maxWidth: '260px' }}>
              Your AI health OS is ready. Ask me anything.
            </p>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: '4px' }}>
                      <GlowOrb size={28} color="blue" pulse={false} emoji="🧠" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: msg.role === 'user' ? '78%' : '88%',
                    padding: msg.role === 'user' ? '11px 16px' : '14px 18px',
                    borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    ...(msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                      color: '#fff', fontSize: '14px', lineHeight: '1.6',
                      boxShadow: '0 4px 20px rgba(34,197,94,0.25)'
                    } : {
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(16px)',
                    })
                  }}>
                    {msg.role === 'user' ? (
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#fff' }}>{msg.content}</p>
                    ) : (
                      <div>{renderMarkdown(msg.content)}</div>
                    )}
                  </div>
                </div>

                {/* Options */}
                {msg.role === 'assistant' && msg.options && msg.options.length > 0 && i === messages.length - 1 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ marginTop: '10px', marginLeft: '36px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                  >
                    {msg.options.map((option, oi) => (
                      <motion.button key={oi}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => sendMessage(option)}
                        style={{
                          padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
                          backgroundColor: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.3)',
                          color: '#22C55E', cursor: 'pointer', backdropFilter: 'blur(12px)',
                        }}
                      >{option}</motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <GlowOrb size={28} color="blue" pulse emoji="🧠" />
              <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px' }}>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9CA3AF', animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        flexShrink: 0, padding: '12px 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      }}>
        <div style={{
          display: 'flex', gap: '10px', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '28px', padding: '8px 8px 8px 20px',
        }}>
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message Health Brain..."
            style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#F5F5F5', fontSize: '16px', outline: 'none' }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()} disabled={loading}
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #22C55E, #16A34A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.4)',
            }}
          >➤</motion.button>
        </div>
      </div>
    </div>
  );
}