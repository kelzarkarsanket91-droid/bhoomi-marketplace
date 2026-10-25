import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { apiFetch } from '../../lib/api.js';

interface Message {
  sender: 'USER' | 'ASSISTANT';
  text: string;
  metadata?: any;
  handOffToBroker?: boolean;
  brokerContact?: {
    name: string;
    role: string;
    phone: string;
  };
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ASSISTANT',
      text: 'Namaste! I am Bhoomi AI, your grounded real estate assistant for Nagpur and Wardha. Select any listing or ask me about property specs, legal valuations, and Maharashtra stamp duty estimates.',
    },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);

  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Check if current route is /property/:id
  useEffect(() => {
    const match = location.pathname.match(/\/property\/([a-zA-Z0-9-]+)/);
    if (match && match[1]) {
      setActivePropertyId(match[1]);
    } else {
      setActivePropertyId(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || loading) return;

    // Use active property ID or fallback to sample featured property
    const propId = activePropertyId;

    if (!propId) {
      setMessages((prev) => [
        ...prev,
        { sender: 'USER', text: textToSend },
        {
          sender: 'ASSISTANT',
          text: 'To get exact grounded calculations and specs, please open any property page from the listings or search catalog, and I will answer with verified data from its registered records!',
        },
      ]);
      setInput('');
      return;
    }

    const userMsg: Message = { sender: 'USER', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch<{
        reply: string;
        sessionId: string;
        handOffToBroker: boolean;
        brokerContact?: any;
      }>('/chat/message', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: propId,
          message: textToSend,
          sessionId: sessionId || undefined,
        }),
      });

      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ASSISTANT',
          text: res.reply,
          handOffToBroker: res.handOffToBroker,
          brokerContact: res.brokerContact,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ASSISTANT',
          text: 'I apologize, but I could not retrieve verified listing data at this moment. Please check your connection or contact the broker directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-brand-800 to-brand-600 text-white shadow-2xl hover:shadow-brand-600/40 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide">Bhoomi AI</span>
          {activePropertyId && (
            <span className="text-[10px] bg-brand-900/60 px-2 py-0.5 rounded-full border border-brand-400/30">
              Grounded
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] max-h-[85vh] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm">Bhoomi AI Advisor</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[11px] text-emerald-200">
                  {activePropertyId ? 'Grounded on Current Listing' : 'Vidarbha Real Estate'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ASSISTANT' && (
                  <div className="w-7 h-7 rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'USER'
                      ? 'bg-brand-700 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {m.text}

                  {/* Broker Hand-off Card */}
                  {m.handOffToBroker && m.brokerContact && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {m.brokerContact.name}
                          </div>
                          <div className="text-[10px] text-slate-500">{m.brokerContact.role}</div>
                        </div>
                        <a
                          href={`tel:${m.brokerContact.phone}`}
                          className="px-2.5 py-1.5 rounded-lg bg-brand-700 text-white font-semibold flex items-center gap-1 hover:bg-brand-800 transition"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {m.sender === 'USER' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-slate-400 italic">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Checking listing records & statutory calculations...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Context Prompts */}
          {activePropertyId && (
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
              <button
                onClick={() => handleSendMessage('What is the price per sq ft and total cost?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                💰 Price / Sq.Ft
              </button>
              <button
                onClick={() => handleSendMessage('Estimate Maharashtra stamp duty and registration')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                📜 Stamp Duty & Tax
              </button>
              <button
                onClick={() => handleSendMessage('What amenities are provided?')}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex-shrink-0"
              >
                🏊 Amenities
              </button>
              <button
                onClick={() => handleSendMessage('Please connect me with the broker')}
                className="px-2.5 py-1 rounded-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 flex-shrink-0 font-semibold"
              >
                📞 Contact Broker
              </button>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this property..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
