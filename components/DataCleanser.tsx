import React, { useState } from 'react';
import { Requirement, AuditSuggestion, AuditType } from '../types';
import { auditRequirements } from '../services/geminiService';
import { useApiKey } from '../contexts/ApiKeyContext';
import { Sparkles, Trash2, Check, AlertTriangle, ArrowRight, Loader2, X, Zap, BrainCircuit } from 'lucide-react';

interface Props {
  data: Requirement[];
  categories: string[];
  onClose: () => void;
  onApply: (suggestions: AuditSuggestion[]) => void;
}

const DataCleanser: React.FC<Props> = ({ data, categories, onClose, onApply }) => {
  const { apiKey } = useApiKey();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'ALL');
  const [mode, setMode] = useState<AuditType>('DUPLICATE');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AuditSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleRun = async () => {
    if (!apiKey) return;
    setLoading(true);
    setStep(2);
    
    // Filter data to send
    const targets = selectedCategory === 'ALL' 
        ? data 
        : data.filter(d => d.category === selectedCategory);

    try {
      const results = await auditRequirements(targets, mode, apiKey);
      setSuggestions(results);
      // Select all high confidence by default
      const initialIds = new Set(results.filter(r => r.confidence === 'HIGH').map(r => r.id));
      setSelectedIds(initialIds);
      setStep(3);
    } catch (e) {
      alert("Analysis failed. All models (Pro/Flash/Gemma) busy. Please try again in a minute.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApply = () => {
    const toApply = suggestions.filter(s => selectedIds.has(s.id));
    onApply(toApply);
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">1. Scope: Which Category?</label>
        <select 
            className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
        >
            <option value="ALL">All Categories (Entire Dataset)</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">2. Goal: What to clean?</label>
        <div className="grid grid-cols-2 gap-3">
            {[
                { id: 'DUPLICATE', label: 'Remove Duplicates', desc: 'Finds redundant requirements' },
                { id: 'VAGUE', label: 'Sharpen Text', desc: 'Finds vague words (fast, good)' },
                { id: 'SPELLING', label: 'Fix Grammar', desc: 'Corrects typos & casing' },
                { id: 'CONSISTENCY', label: 'Check Consistency', desc: 'Standardizes terminology' }
            ].map((opt) => (
                <div 
                    key={opt.id}
                    onClick={() => setMode(opt.id as AuditType)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${mode === opt.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                >
                    <p className="font-semibold text-slate-800">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                </div>
            ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button 
            onClick={handleRun}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"
        >
            <Sparkles className="w-4 h-4" />
            Start Analysis
        </button>
      </div>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800">Auditing Requirements...</h3>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-600 bg-slate-100 py-1 px-3 rounded-full mx-auto w-fit">
               <BrainCircuit className="w-4 h-4 text-purple-600" />
               <span>Strategy: <b>Pro</b> &rarr; <b>Flash</b> &rarr; <b>Gemma (Open)</b></span>
            </div>
            <p className="text-xs text-slate-400 mt-4">
               Checking {selectedCategory === 'ALL' ? data.length : data.filter(d => d.category === selectedCategory).length} items for {mode.toLowerCase()} issues.
            </p>
        </div>
    </div>
  );

  const renderReview = () => {
    if (suggestions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Clean Sheet!</h3>
                <p className="text-slate-600">No issues found in this category.</p>
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg">Close</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="mb-4 bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                    <p className="text-sm text-blue-800">
                        Found <b>{suggestions.length}</b> potential improvements. 
                        Review carefully before applying.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white min-h-0">
                {suggestions.map((sugg) => {
                    const original = data.find(d => d.req_id === sugg.id);
                    if (!original) return null;

                    const isSelected = selectedIds.has(sugg.id);

                    return (
                        <div key={sugg.id} className={`p-4 transition-colors ${isSelected ? 'bg-indigo-50/30' : 'bg-white'}`}>
                            <div className="flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => toggleSelection(sugg.id)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{sugg.id}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${sugg.type === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                                            {sugg.type}
                                        </span>
                                        <span className="text-xs text-slate-400">— {sugg.issue}</span>
                                    </div>

                                    <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center text-sm">
                                        <div className={`${sugg.type === 'DELETE' ? 'text-red-800 line-through bg-red-50 p-2 rounded' : 'text-slate-600 p-2'}`}>
                                            {original.text_original}
                                        </div>
                                        
                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                        
                                        <div className="font-medium text-slate-800 bg-white p-2 border border-slate-200 rounded">
                                            {sugg.type === 'DELETE' ? (
                                                <span className="text-slate-400 italic">Item will be removed</span>
                                            ) : (
                                                <span className="text-green-700">{sugg.suggested_text}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100 flex-shrink-0">
                <span className="text-sm text-slate-500">
                    {selectedIds.size} of {suggestions.length} selected
                </span>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                    <button 
                        onClick={handleApply}
                        disabled={selectedIds.size === 0}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-900 text-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-800 rounded-lg">
                        <Sparkles className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Smart Data Cleanser</h2>
                        <div className="flex items-center gap-1.5 text-indigo-200 text-xs mt-0.5">
                            <Zap className="w-3 h-3" />
                            <span>Hybrid Cascade: <b>Pro</b> &rarr; <b>Flash</b> &rarr; <b>Gemma</b></span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>
            
            <div className="p-6 flex-1 overflow-hidden flex flex-col min-h-0">
                {step === 1 && renderStep1()}
                {step === 2 && renderLoading()}
                {step === 3 && renderReview()}
            </div>
        </div>
    </div>
  );
};

export default DataCleanser;