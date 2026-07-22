'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Minimize2, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export function DoubtChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'ai', content: 'Hi! I am your AI Study Assistant. I can help you with physics, chemistry, biology, and math concepts. What do you need help with?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/student/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'ai', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'ai', content: 'Sorry, I am having trouble connecting to the intelligence server.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', role: 'ai', content: 'Network error. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-indigo-700 hover:scale-105 transition-all z-50 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
          Ask AI Tutor
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.16)] flex flex-col z-50 overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-none">AI Study Assistant</h3>
            <p className="text-[10px] text-indigo-200 mt-1 uppercase font-bold tracking-wider">JEE/NEET Tutor</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a concept doubt..."
          className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
