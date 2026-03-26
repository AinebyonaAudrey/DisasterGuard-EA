import { useState, useEffect, useRef } from 'react';
import { Shield, Info, MapPin, Globe, AlertCircle, RefreshCcw, ExternalLink, BookOpen, User, Bot, Plus, MessageSquare, Trash2, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchBar } from './components/SearchBar';
import { RiskCard } from './components/RiskCard';
import { sendChatMessage } from './services/geminiService';
import { LocationData, Language, ChatMessage, ChatSession } from './types';
import { cn } from './lib/utils';

const STORAGE_KEY = 'disasterguard_ea_chats';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert string dates back to Date objects
        const formatted = parsed.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(formatted);
        if (formatted.length > 0) {
          setCurrentSessionId(formatted[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved chats", e);
      }
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const startNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
    if (updated.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSearch = async (text: string, lang: Language) => {
    let sessionId = currentSessionId;
    let updatedSessions = [...sessions];

    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
      };
      updatedSessions = [newSession, ...updatedSessions];
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      text,
      timestamp: new Date(),
    };

    // Update session with user message
    updatedSessions = updatedSessions.map(s => {
      if (s.id === sessionId) {
        const isFirstMessage = s.messages.length === 0;
        return {
          ...s,
          title: isFirstMessage ? text.slice(0, 30) + (text.length > 30 ? '...' : '') : s.title,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    });

    setSessions(updatedSessions);
    setIsLoading(true);
    setError(null);

    try {
      const history = updatedSessions.find(s => s.id === sessionId)?.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })) || [];

      const response = await sendChatMessage(text, history, lang);
      
      const botMessage: ChatMessage = {
        role: 'model',
        text: response.text,
        data: response.data,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, botMessage] } : s
      ));
    } catch (err) {
      setError("I encountered an issue while processing your request. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex selection:bg-blue-100 hero-gradient overflow-hidden">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-[70] flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-display font-black text-lg">History</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No previous chats</p>
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full group flex items-center gap-3 p-3 rounded-xl text-left transition-all border",
                  currentSessionId === session.id
                    ? "bg-blue-50 border-blue-100 text-blue-700"
                    : "bg-white border-transparent text-slate-500 hover:bg-slate-50"
                )}
              >
                <MessageSquare className={cn("w-4 h-4 shrink-0", currentSessionId === session.id ? "text-blue-600" : "text-slate-300")} />
                <span className="flex-1 text-xs font-bold truncate">{session.title}</span>
                <button
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">
            DisasterGuard EA v2.0
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-md border-b border-slate-100 shrink-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Shield className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl tracking-tight">DisasterGuard <span className="text-blue-600">EA</span></h1>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">East Africa Climate AI</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live System
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth" ref={scrollRef}>
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 mb-6 tracking-tight">
                  How can I help you <br />
                  <span className="text-blue-600">Stay Safe Today?</span>
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto text-lg font-medium">
                  Ask me about weather risks, flood warnings, or safety tips for any location in East Africa.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 text-left">
                  {[
                    "Is it safe to travel to Mbale today?",
                    "Flood warnings for Nairobi area",
                    "Drought preparation in Turkana",
                    "Landslide risks in Bududa"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSearch(suggestion, 'English')}
                      className="p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    
                    <div className="space-y-4">
                      <div className={`p-5 rounded-[2rem] shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-white border border-slate-100 rounded-tr-none' 
                          : 'bg-white border border-blue-50 rounded-tl-none'
                      }`}>
                        <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>

                      {msg.data && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-8 mt-6"
                        >
                          {/* Location Header */}
                          <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
                            <div className="p-3 bg-blue-600 rounded-2xl">
                              <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-display font-black text-slate-900 leading-none">
                                {msg.data.city}, <span className="text-slate-400">{msg.data.country}</span>
                              </h3>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">Detailed Risk Assessment</p>
                            </div>
                          </div>

                          {/* Risks Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {msg.data.risks.map((risk, i) => (
                              <RiskCard key={i} risk={risk} />
                            ))}
                          </div>

                          {/* Sources */}
                          {msg.data.sources && msg.data.sources.length > 0 && (
                            <div className="bg-slate-900 rounded-[2rem] p-6 text-white">
                              <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="text-xs font-black uppercase tracking-widest">Verified Sources</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.data.sources.map((s, i) => (
                                  <a 
                                    key={i} 
                                    href={s.url} 
                                    target="_blank" 
                                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                                  >
                                    {s.name} <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="p-5 bg-white border border-blue-50 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analyzing Data</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-md mx-auto p-6 bg-red-50 border border-red-100 rounded-3xl text-center"
                >
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                  <p className="text-red-900 text-sm font-bold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Input Area */}
        <div className="bg-white/70 backdrop-blur-md border-t border-slate-100 p-4 sm:p-8 shrink-0">
          <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
              DisasterGuard EA AI Assistant • Always follow local emergency instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
