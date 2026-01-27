import React, { useState, useRef, useEffect } from 'react';
import { Requirement, ChatMessage } from '../types';
import { analyzeRequirements } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Send, Bot, User, Loader2, Sparkles, Zap, Server } from 'lucide-react';

interface Props {
  data: Requirement[];
  history: ChatMessage[];
  onHistoryUpdate: (history: ChatMessage[]) => void;
}

const AiAnalysis: React.FC<Props> = ({ data, history, onHistoryUpdate }) => {
  const { apiKey } = useApiKey();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check provider type for UI feedback
  const isLocal = apiKey && apiKey.startsWith('CUSTOM_LLM');
  const isDemo = apiKey === 'DEMO';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!query.trim() || isLoading || !apiKey) return;

    const userMsg: ChatMessage = { role: 'user', text: query, timestamp: Date.now() };
    const newHistory = [...history, userMsg];
    onHistoryUpdate(newHistory);
    setQuery('');
    setIsLoading(true);

    try {
      const contextHistory = history.map(h => ({ role: h.role, text: h.text }));
      const responseText = await analyzeRequirements(userMsg.text, data, contextHistory, apiKey);
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      onHistoryUpdate([...newHistory, aiMsg]);
    } catch (error) {
      onHistoryUpdate([...newHistory, { role: 'model', text: 'Sorry, I encountered an error analyzing the data.', timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-200px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`p-4 border-b border-slate-200 text-white flex items-center gap-2 ${isLocal ? 'bg-emerald-800' : 'bg-indigo-900'}`}>
        {isLocal ? <Server className="w-5 h-5 text-emerald-300" /> : <Sparkles className="w-5 h-5 text-indigo-300" />}
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            {isLocal ? 'Local LLM Analyst' : isDemo ? 'Demo Mode (Mock)' : 'Gemini 3 Pro Analyst'}
          </h2>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto border ${isLocal ? 'bg-emerald-700 text-emerald-100 border-emerald-600' : 'bg-indigo-700 text-indigo-100 border-indigo-600'}`}>
          {data.length} items context
        </span>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
        {history.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isLocal ? 'bg-emerald-100 border-emerald-200' : 'bg-indigo-100 border-indigo-200'}`}>
                <Bot className={`w-5 h-5 ${isLocal ? 'text-emerald-700' : 'text-indigo-700'}`} />
              </div>
            )}
            
            <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? (isLocal ? 'bg-emerald-600 text-white rounded-tr-none shadow-md' : 'bg-indigo-600 text-white rounded-tr-none shadow-md')
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${isLocal ? 'bg-emerald-100 border-emerald-200' : 'bg-indigo-100 border-indigo-200'}`}>
                <Bot className={`w-5 h-5 ${isLocal ? 'text-emerald-700' : 'text-indigo-700'}`} />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader2 className={`w-4 h-4 animate-spin ${isLocal ? 'text-emerald-600' : 'text-indigo-600'}`} />
                <span className="text-slate-500 text-xs font-medium">Thinking...</span>
              </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            className={`w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 outline-none transition-all shadow-sm ${isLocal ? 'focus:ring-emerald-500 focus:border-emerald-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
            placeholder="Ask complex questions about your requirements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !query.trim()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 ${isLocal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
           <p className="text-xs text-slate-400">
             Powered by <b>{isLocal ? 'Local LLM (OpenAI API)' : 'Google Gemini 3 Pro'}</b>. {isLocal ? 'Private & Offline.' : 'Best for complex reasoning.'}
           </p>
           {!isLocal && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>High Performance Mode</span>
            </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AiAnalysis;
