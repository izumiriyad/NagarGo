'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mic, Copy, Volume2, ThumbsUp, ThumbsDown, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const QUICK_ACTIONS = [
  'Rider হতে চাই',
  'Payment কীভাবে করব?',
  'আমার application কোথায়?',
  'আমার earning কীভাবে দেখব?',
  'Location কীভাবে চালু করব?',
  'Delivery কীভাবে accept করব?',
  'Maintenance fee কী?',
  'Customer-এর সাথে সমস্যা হলে কী করব?',
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'আমি আপনাকে NagarGo ব্যবহার করতে সাহায্য করতে পারি। আপনার প্রশ্ন লিখুন অথবা নিচের অপশন থেকে বেছে নিন।' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply || 'আমি বুঝতে পারিনি। আবার বলুন।' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'দুঃখিত, এই মুহূর্তে কিছু সমস্যা হয়েছে। আবার চেষ্টা করুন।' }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('আপনার ব্রাউজারে voice input support নেই। অনুগ্রহ করে লিখে প্রশ্ন করুন।');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
      toast.error('Voice input কাজ করেনি। আবার চেষ্টা করুন।');
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    toast.info('শুনছি...');
  }, [listening]);

  const readAloud = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error('আপনার ব্রাউজারে text-to-speech support নেই।');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('কপি হয়েছে');
  };

  return (
    <>
      {/* Floating robot button — right side, above WhatsApp contacts */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            onClick={() => setOpen(true)}
            className="fixed right-4 z-50 group flex items-center gap-2"
            style={{ bottom: 'calc(240px + 2rem)' }}
            aria-label="NagarGo AI Assistant"
          >
            {/* Always-visible 2-line label */}
            <span className="glass-strong rounded-lg border border-border/60 px-2.5 py-1.5 text-[11px] leading-tight font-medium text-foreground text-right whitespace-normal w-max max-w-[90px]">
              কোন সহযোগিতা
              <br />
              প্রয়োজন হলে আমাকে বলুন
            </span>
            {/* Robot icon with fade-loop glow */}
            <span className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-black to-secondary border border-primary/40 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all">
              <motion.span
                className="absolute inset-0 rounded-2xl bg-primary/20"
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute -inset-0.5 rounded-2xl border border-primary/30"
                animate={{ opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <Bot className="relative w-7 h-7 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-black" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 bottom-0 top-16 z-50 w-full sm:w-96 max-w-full glass-strong border-l border-border/60 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-black to-secondary border border-primary/40">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-black" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">NagarGo Assistant</p>
                    <p className="text-xs text-muted-foreground">আমি আপনাকে সাহায্য করতে পারি</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary/40 transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={`max-w-[85%] ${msg.role === 'user' ? '' : ''}`}>
                      <div
                        className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary/50 border border-border/40 text-foreground'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.role === 'assistant' && i > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <button onClick={() => copyText(msg.text)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button onClick={() => readAloud(msg.text)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded">
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded">
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button className="text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 border border-border/40 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Bot className="w-4 h-4 text-primary" />
                        AI উত্তর তৈরি করছে
                        <span className="inline-flex">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce mx-0.5" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Quick actions (only show at start) */}
                {messages.length <= 1 && !loading && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2">আপনি কী জানতে চান?</p>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_ACTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleVoice}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all shrink-0 ${
                      listening
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary'
                    }`}
                    aria-label="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }}
                    placeholder="আপনার প্রশ্ন লিখুন..."
                    className="flex-1 px-3 h-10 rounded-lg bg-secondary/40 border border-border/60 text-sm outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary-bright transition-all shrink-0"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {listening && (
                  <p className="text-xs text-primary mt-1.5 text-center animate-pulse">শুনছি...</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
