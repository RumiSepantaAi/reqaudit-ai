import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Key, Lock, ExternalLink, ChevronRight, ShieldCheck, PlayCircle, Server, Settings2, Info } from 'lucide-react';

const ApiKeyModal: React.FC = () => {
  const { setApiKey } = useApiKey();
  const [mode, setMode] = useState<'cloud' | 'local'>('cloud');
  
  // Cloud State
  const [inputVal, setInputVal] = useState('');
  
  // Local State
  const [localUrl, setLocalUrl] = useState('http://localhost:11434/v1');
  const [localModel, setLocalModel] = useState('llama3');
  
  const [error, setError] = useState('');

  const handleSubmitCloud = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim().length < 30) {
      setError('Invalid API Key format. Keys usually start with AIza...');
      return;
    }
    setApiKey(inputVal.trim());
  };

  const handleSubmitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localUrl || !localModel) {
        setError('URL and Model Name are required');
        return;
    }
    const configString = `CUSTOM_LLM::${localUrl}::${localModel}`;
    setApiKey(configString);
  };

  const handleDemoMode = () => {
    setApiKey('DEMO');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/50">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">ReqAudit AI</h2>
          <p className="text-slate-400 text-sm mt-2">Enterprise Requirements Analysis</p>
        </div>

        {/* Portfolio / Recruiter Friendly Banner */}
        <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-800">
                <p className="font-bold mb-1">Visiting from a Portfolio?</p>
                <p>Use <b>Demo Mode</b> to explore the UI/UX without an API key, or connect your own Google/Local LLM for full functionality.</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
            <button 
                onClick={() => { setMode('cloud'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'cloud' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Key className="w-4 h-4" /> Google Cloud
            </button>
            <button 
                onClick={() => { setMode('local'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'local' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Server className="w-4 h-4" /> Local LLM
            </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {mode === 'cloud' ? (
              <form onSubmit={handleSubmitCloud} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="password" 
                      value={inputVal}
                      onChange={(e) => { setInputVal(e.target.value); setError(''); }}
                      placeholder="AIzaSy..."
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  <div className="text-right">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors"
                    >
                        Get free key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button 
                  type="submit"
                  disabled={!inputVal}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Connect Cloud <ChevronRight className="w-4 h-4" />
                </button>
              </form>
          ) : (
              <form onSubmit={handleSubmitLocal} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-2">
                    <p><strong>Dev Note:</strong> Ensure your local instance allows CORS (<code>OLLAMA_ORIGINS="*"</code>).</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">API Base URL</label>
                  <input 
                      type="text" 
                      value={localUrl}
                      onChange={(e) => setLocalUrl(e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Model Name</label>
                  <input 
                      type="text" 
                      value={localModel}
                      onChange={(e) => setLocalModel(e.target.value)}
                      placeholder="llama3"
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button 
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Connect Local <Server className="w-4 h-4" />
                </button>
              </form>
          )}

            <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">or for visitors</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button 
              type="button"
              onClick={handleDemoMode}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold py-4 px-4 rounded-xl transition-all border border-slate-200 hover:border-indigo-300 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
            >
              <div className="p-2 bg-indigo-100 rounded-full group-hover:scale-110 transition-transform">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-left">
                  <span className="block text-sm font-bold text-indigo-900">Live Demo Mode</span>
                  <span className="block text-xs text-slate-500">Explore UI with mock data (No Key required)</span>
              </div>
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <ShieldCheck className="w-3 h-3" />
                <p>Architecture: Client-Side Only. Your keys never leave this browser.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;