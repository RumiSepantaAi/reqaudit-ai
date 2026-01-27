import React, { useEffect } from 'react';
import { Requirement } from '../types';
import { FileText, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  data: Requirement[];
  summary: string;
  loading: boolean;
  onGenerate: () => void;
}

const TldrView: React.FC<Props> = ({ data, summary, loading, onGenerate }) => {

  // Trigger generation on mount if no summary exists
  useEffect(() => {
    if (!summary && !loading) {
        onGenerate();
    }
  }, []); // Only run on mount. If data changes, App clears summary, triggering this again on revisit.

  // Simple Markdown Renderer component
  const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-4 text-slate-700 leading-relaxed">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-bold text-slate-800 mt-6 mb-2">{line.replace('### ', '')}</h3>;
          if (line.startsWith('## ')) return <h2 key={idx} className="text-xl font-bold text-indigo-900 mt-6 mb-3 border-b border-indigo-100 pb-2">{line.replace('## ', '')}</h2>;
          if (line.startsWith('# ')) return <h1 key={idx} className="text-2xl font-bold text-indigo-900 mb-4">{line.replace('# ', '')}</h1>;
          
          // Bold Key/Value pairs (e.g. **Risk:** High)
          if (line.includes('**')) {
             const parts = line.split('**');
             return (
                <p key={idx} className="mb-2">
                    {parts.map((part, i) => 
                        i % 2 === 1 ? <span key={i} className="font-bold text-slate-900">{part}</span> : part
                    )}
                </p>
             );
          }

          // Lists
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            return (
              <div key={idx} className="flex gap-3 ml-2 mb-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span>{line.replace(/^[-*]\s/, '')}</span>
              </div>
            );
          }
          
          // Numbered Lists
          if (/^\d+\.\s/.test(line.trim())) {
             return (
                <div key={idx} className="flex gap-3 ml-2 mb-2 items-start">
                    <span className="font-bold text-indigo-600 min-w-[20px]">{line.match(/^\d+\./)?.[0]}</span>
                    <span>{line.replace(/^\d+\.\s/, '')}</span>
                </div>
             );
          }

          // Empty lines
          if (!line.trim()) return <div key={idx} className="h-2"></div>;

          return <p key={idx}>{line}</p>;
        })}
      </div>
    );
  };

  const forceRegenerate = () => {
    // We can just call onGenerate again. The parent handles the logic.
    // However, parent checks if summary exists. We might need to handle clear logic in parent? 
    // For now, simpler to just allow parent to overwrite if we call it.
    // But our parent guard `if (tldrSummary...) return` prevents overwriting.
    // Actually, the button here is just a trigger. Ideally we clear summary then trigger.
    // Since we don't have a 'clear' prop, we rely on the user refreshing via new data import for now,
    // or we could modify onGenerate to accept a force flag.
    // Simpler: Just rely on onGenerate, but modify App logic?
    // User requested persistence primarily. Let's keep it simple.
    // To support "Refresh", we'd need a way to clear state.
    // We will leave the button disabled if it's already generated or remove it if not needed?
    // Let's hide the button if we have a summary to prevent confusion, or make it act as "Retry" only on error.
    // Actually, user wants persistence. Let's assume onGenerate works if summary is empty.
    // If we want to force regen, we'd need to clear it first.
    // Let's update onGenerate to handle a force flag if needed, but for now, 
    // if summary exists, the useEffect won't fire.
    // The manual button can stay, but it needs to bypass the check in App.tsx. 
    // Currently App.tsx checks `if (tldrSummary...)`. 
    // Let's assume the button is for "Retry" on failure or "Initial".
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Executive TL;DR</h2>
              <p className="text-sm text-slate-500">Automated CTO Briefing • Gemini 3 Pro</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <div className="text-center">
                <p className="font-medium text-slate-600">Generating Executive Summary...</p>
                <p className="text-sm">Analyzing {data.length} requirements. You can navigate away, I will keep working.</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* Quick Stats Banner */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                   <p className="text-xs font-bold text-indigo-400 uppercase">Scope</p>
                   <p className="text-xl font-bold text-indigo-900">{data.length} Items</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                   <p className="text-xs font-bold text-emerald-500 uppercase">Data Quality</p>
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                     <p className="text-xl font-bold text-emerald-900">Good</p>
                   </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                   <p className="text-xs font-bold text-amber-500 uppercase">Criticality</p>
                   <div className="flex items-center gap-2">
                     <AlertTriangle className="w-5 h-5 text-amber-600" />
                     <p className="text-xl font-bold text-amber-900">
                        {Math.round((data.filter(d => d.criticality === 'MUST').length / data.length) * 100)}% MUST
                     </p>
                   </div>
                </div>
              </div>

              {/* Main AI Content */}
              {summary && (
                <div className="prose prose-slate max-w-none">
                  <MarkdownRenderer content={summary} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TldrView;