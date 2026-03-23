import { useState, useRef, useEffect } from 'react';

export interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  suggestions?: string[];
}

interface UserProfile {
  name: string;
  [key: string]: any;
}

const parseMessage = (content: string): { text: string; suggestions: string[] } => {
  const match = content.match(/\[OPCIJE:\s*([^\]]+)\]/);
  if (match) {
    const suggestions = match[1].split('|').map(o => o.trim()).filter(Boolean);
    return { text: content.replace(/\[OPCIJE:[^\]]+\]/, '').trim(), suggestions };
  }
  return { text: content, suggestions: [] };
};

export function useChat(profile: UserProfile | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.name) {
      setMessages([{
        id: 1,
        type: 'ai',
        text: `Hey ${profile.name}! I've reviewed your health data. How are you feeling today?`,
        suggestions: ['Feeling great', 'A bit tired', 'Not great today']
      }]);
    } else {
      setMessages([{
        id: 1,
        type: 'ai',
        text: "Welcome to Health Brain! I'm your personal AI health assistant. How are you feeling today?",
        suggestions: ['Feeling great', 'A bit tired', 'Tell me more']
      }]);
    }
  }, [profile?.name]);

  useEffect(() => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), type: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();
      const { text: parsedText, suggestions } = parseMessage(data.message || '');

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: parsedText,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: 'Sorry, something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, messagesEndRef };
}