// src/components/AIConsultant.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, ArrowRight, User, Settings, Info, RefreshCw, X, Send } from 'lucide-react';
import Image from 'next/image';

interface AIConsultantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIConsultant({ isOpen, onClose }: AIConsultantProps) {
  const [activeTab, setActiveTab] = useState<'consultation' | 'chat'>('consultation');
  
  // Consultation Form State
  const [gender, setGender] = useState('men');
  const [hairType, setHairType] = useState('curly');
  const [faceShape, setFaceShape] = useState('oval');
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I am your AI Beauty Consultant. I can help recommend hairstyles based on your face shape, advise on skincare routines, suggest hair treatment services, or help you find the best nail technicians in Addis Ababa. What are you looking to achieve today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollChat = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollChat();
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'consultation',
          gender,
          hairType,
          faceShape,
        }),
      });
      const data = await res.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || chatLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          message: userMessage,
          history: messages,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">AI Beauty Consultant</h3>
              <p className="text-xs text-zinc-500">Personalized beauty & style recommendations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-900 p-2 gap-2 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('consultation')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'consultation'
                ? 'bg-white dark:bg-zinc-950 text-amber-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Style Consultation
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-zinc-950 text-amber-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Advice
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          
          {/* CONSULTATION TAB */}
          {activeTab === 'consultation' && (
            <div className="flex-1 flex flex-col">
              {!recommendation ? (
                <form onSubmit={handleConsultationSubmit} className="flex flex-col gap-6 flex-1 justify-between">
                  <div className="flex flex-col gap-5">
                    {/* Gender picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">I am looking for styles for:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['men', 'women', 'kids'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                              gender === g
                                ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hair type picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">My Hair Type is:</label>
                      <div className="grid grid-cols-5 gap-2">
                        {['straight', 'wavy', 'curly', 'coily', 'kinky'].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setHairType(t)}
                            className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                              hairType === t
                                ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Face Shape Picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">My Face Shape is:</label>
                      <div className="grid grid-cols-5 gap-2">
                        {['oval', 'round', 'square', 'heart', 'diamond'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFaceShape(s)}
                            className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                              faceShape === s
                                ? 'border-amber-500 bg-amber-500/5 text-amber-500'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Get AI Recommendations
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  {/* Results Showcase */}
                  <div className="flex flex-col md:flex-row gap-5 bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                    <div className="relative w-full md:w-40 h-40 rounded-xl overflow-hidden shadow-md shrink-0">
                      <Image
                        src={recommendation.imageUrl}
                        alt={recommendation.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Recommended Style
                      </span>
                      <h4 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">{recommendation.title}</h4>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{recommendation.description}</p>
                    </div>
                  </div>

                  {/* Matching Services */}
                  <div className="flex flex-col gap-2.5">
                    <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5" /> Book Matching Services
                    </h5>
                    <div className="flex flex-col gap-2">
                      {recommendation.matchingServices.map((serviceName: string) => (
                        <div
                          key={serviceName}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-500/50 transition-colors"
                        >
                          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{serviceName}</span>
                          <button
                            onClick={() => {
                              onClose();
                              window.location.href = `/search?query=${encodeURIComponent(serviceName)}`;
                            }}
                            className="text-xs font-extrabold text-amber-500 hover:text-amber-600 flex items-center gap-0.5"
                          >
                            Find Salons <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Redo consultation */}
                  <button
                    onClick={() => setRecommendation(null)}
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors self-center"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Redo Style Questionnaire
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full justify-between">
              {/* Message History */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 pb-4 max-h-[340px]">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shrink-0 ${isUser ? 'bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800' : 'bg-amber-500'}`}>
                        {isUser ? <User className="h-4.5 w-4.5" /> : <Sparkles className="h-4 w-4" />}
                      </div>
                      <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-zinc-900 text-white rounded-tr-none'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-tl-none border border-zinc-200/40 dark:border-zinc-800/40'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                {chatLoading && (
                  <div className="flex gap-3 max-w-[80%] self-start animate-pulse">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shrink-0">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-900 p-3.5 rounded-2xl rounded-tl-none text-xs font-bold text-zinc-400">
                      AI Consultant is typing...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input box */}
              <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about skin care, Morrocan hair treatment, CBE Birr..."
                  className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:border-amber-500 text-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !inputValue.trim()}
                  className="p-3 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
