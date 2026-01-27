import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, Requirement, ChatMessage, AuditSuggestion } from './types';
import { SAMPLE_DATA } from './constants';
import Dashboard from './components/Dashboard';
import RequirementsTable from './components/RequirementsTable';
import AiAnalysis from './components/AiAnalysis';
import TldrView from './components/TldrView';
import ApiKeyModal from './components/ApiKeyModal';
import { useApiKey } from './contexts/ApiKeyContext';
import { parseTextToRequirements, generateExecutiveSummary } from './services/geminiService';
import { LayoutDashboard, Database, Bot, Upload, AlertCircle, Code, FileUp, AlertTriangle, Loader2, Wand2, FileText, Undo2, Key, PlayCircle } from 'lucide-react';

const App: React.FC = () => {
  const { apiKey, removeApiKey, hasKey } = useApiKey();
  const [data, setData] = useState<Requirement[]>([]);
  const [restorePoint, setRestorePoint] = useState<Requirement[] | null>(null);
  
  const [view, setView] = useState<ViewMode>(ViewMode.IMPORT);
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  const [tldrSummary, setTldrSummary] = useState<string>('');
  const [isTldrLoading, setIsTldrLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const [importStats, setImportStats] = useState<{ 
    total: number; 
    duplicatesFixed: number;
    sequenceGap?: {
      min: number;
      max: number;
      expected: number;
      actual: number;
    }
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE CLEANUP ---
  // When the API Key changes (Reset, switch to Demo, login), clear EVERYTHING.
  // This ensures the user lands on the Import screen with a clean slate.
  useEffect(() => {
    setError(null);
    setImportStats(null);
    setIsParsing(false);
    
    // Hard Reset of all Data & Views
    setData([]);
    setView(ViewMode.IMPORT);
    setJsonInput('');
    setTldrSummary('');
    setIsTldrLoading(false);
    setRestorePoint(null);
    setChatHistory([]);
  }, [apiKey]);

  // If no key is present (and not in Demo mode), strictly show ONLY the Modal.
  // This prevents the App UI from rendering in the background.
  if (!hasKey) {
    return <ApiKeyModal />;
  }

  const handleRestore = () => {
    if (restorePoint) {
        setData(restorePoint);
        setRestorePoint(null);
    }
  };

  const handleApplyCleanUp = (suggestions: AuditSuggestion[]) => {
      setRestorePoint([...data]);
      let newData = [...data];
      const itemsToDelete = new Set<string>();
      const updatesMap = new Map<string, string>();

      suggestions.forEach(s => {
          if (s.type === 'DELETE') {
              itemsToDelete.add(s.id);
          } else if (s.type === 'UPDATE' && s.suggested_text) {
              updatesMap.set(s.id, s.suggested_text);
          }
      });

      newData = newData.filter(item => !itemsToDelete.has(item.req_id));
      
      newData = newData.map(item => {
          if (updatesMap.has(item.req_id)) {
              return { ...item, text_original: updatesMap.get(item.req_id)! };
          }
          return item;
      });

      setData(newData);
      setTldrSummary(''); 
  };

  const handleGenerateTldr = async () => {
    if (data.length === 0 || tldrSummary || isTldrLoading || !apiKey) return;

    setIsTldrLoading(true);
    try {
      const result = await generateExecutiveSummary(data, apiKey);
      setTldrSummary(result);
    } catch (e) {
      setTldrSummary("Error loading summary. Please try again or check API Key.");
    } finally {
      setIsTldrLoading(false);
    }
  };

  const resetAnalysisStates = (itemCount: number) => {
      setTldrSummary('');
      setIsTldrLoading(false);
      setRestorePoint(null);
      setChatHistory([
        {
            role: 'model',
            text: `Hello! I am your Senior Technical Analyst running on **Gemini 3 Pro**. I have analyzed ${itemCount} requirements in detail. What would you like to know?`,
            timestamp: Date.now()
        }
      ]);
  };

  const processRawData = (rawItems: any[]) => {
      const uniqueData: Requirement[] = [];
      const seenIds = new Set<string>();
      let duplicatesFixed = 0;

      const idRegex = /.*?(\d+)$/;
      let minId = Infinity;
      let maxId = -Infinity;
      let numericIdsFound = 0;

      rawItems.forEach((item: any) => {
        if (typeof item !== 'object' || item === null) return;

        let originalId = item.req_id ? String(item.req_id).trim() : '';
        if (!originalId) {
             originalId = `UNK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }

        const match = originalId.match(idRegex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num)) {
            if (num < minId) minId = num;
            if (num > maxId) maxId = num;
            numericIdsFound++;
          }
        }
        
        let uniqueId = originalId;
        let counter = 1;

        while (seenIds.has(uniqueId)) {
          uniqueId = `${originalId}_${counter}`;
          counter++;
          if (counter === 2) { 
             duplicatesFixed++; 
          }
        }

        seenIds.add(uniqueId);

        const cleanItem: Requirement = {
          req_id: uniqueId,
          source_doc: item.source_doc || 'Unknown Source',
          section: item.section || '',
          category: item.category || 'Uncategorized',
          subcategory: item.subcategory || '',
          criticality: item.criticality || 'MAY',
          text_original: item.text_original || '',
          ctonote: item.ctonote || undefined
        };

        uniqueData.push(cleanItem);
      });

      if (uniqueData.length === 0) {
         throw new Error("No valid requirement objects found.");
      }
      
      let sequenceGap = undefined;
      if (numericIdsFound > uniqueData.length * 0.5 && maxId > -Infinity) {
         const expectedCount = maxId - minId + 1;
         if (uniqueData.length < expectedCount) {
            sequenceGap = {
              min: minId,
              max: maxId,
              expected: expectedCount,
              actual: uniqueData.length
            };
         }
      }

      setData(uniqueData);
      setImportStats({ total: uniqueData.length, duplicatesFixed, sequenceGap });
      resetAnalysisStates(uniqueData.length);
      setView(ViewMode.DASHBOARD);
  };

  const handleSmartImport = async () => {
    if (!apiKey) return;
    try {
      setError(null);
      setImportStats(null);
      
      const trimmed = jsonInput.trim();
      if (!trimmed) return;

      // Initialize to null to satisfy TypeScript definitive assignment checks
      let parsed: any = null;
      
      try {
        parsed = JSON.parse(trimmed);
        
        // --- SMART SCHEMA DETECTION ---
        // Heuristic: Does this JSON look like our Requirement format?
        // If it's just raw data (e.g. { "countries": [...] }), we force AI parsing.
        const sampleItem = Array.isArray(parsed) ? (parsed.length > 0 ? parsed[0] : null) : parsed;
        const looksLikeRequirement = sampleItem && typeof sampleItem === 'object' && (
          'req_id' in sampleItem || 
          'text_original' in sampleItem || 
          'criticality' in sampleItem ||
          'source_doc' in sampleItem
        );

        if (parsed && !looksLikeRequirement) {
           console.log("Valid JSON detected, but schema mismatch. Delegating to AI agent.");
           parsed = null; // This forces the code to fall into the AI parsing block below
        }
        // -----------------------------

        if (parsed && !Array.isArray(parsed) && trimmed.includes('][')) {
            throw new Error("Potential multi-array"); 
        }
      } catch (e) {
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
             try {
               const fixed = `[${trimmed.replace(/\]\s*\[/g, '],[')}]`;
               const temp = JSON.parse(fixed);
               parsed = temp.flat(); 
             } catch (e2) {
               parsed = [];
             }
        }
      }
        
      if (!parsed || parsed.length === 0) {
           setIsParsing(true);
           try {
             parsed = await parseTextToRequirements(trimmed, apiKey);
           } catch (aiError) {
             throw aiError;
           } finally {
             setIsParsing(false);
           }
      }

      if (parsed === null || parsed === undefined) {
         // Should not happen if AI succeeds, but handle safe fallback
         throw new Error("Could not parse content.");
      }

      if (!Array.isArray(parsed)) {
        parsed = [parsed]; 
      }
      
      processRawData(parsed);

    } catch (e) {
      setIsParsing(false);
      setError((e as Error).message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setImportStats(null);

    try {
      const filePromises = Array.from(files).map(file => {
        return new Promise<any[]>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
             try {
               const text = event.target?.result as string;
               const json = JSON.parse(text);
               resolve(Array.isArray(json) ? json : [json]);
             } catch (err) {
               reject(new Error(`Failed to parse ${file.name}: Invalid JSON`));
             }
          };
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsText(file);
        });
      });

      const results = await Promise.all(filePromises);
      const combined = results.flat();
      
      processRawData(combined);

    } catch (err) {
      setError((err as Error).message);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadSample = () => {
    setError(null);
    setImportStats(null);
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2));
    processRawData(SAMPLE_DATA);
  };

  const renderContent = () => {
    switch (view) {
      case ViewMode.DASHBOARD:
        return <Dashboard data={data} />;
      case ViewMode.GRID:
        return (
            <RequirementsTable 
                data={data} 
                onApplyCleanUp={handleApplyCleanUp} 
            />
        );
      case ViewMode.AI_ANALYSIS:
        return (
          <AiAnalysis 
            data={data} 
            history={chatHistory} 
            onHistoryUpdate={setChatHistory} 
          />
        );
      case ViewMode.TLDR:
        return (
          <TldrView 
            data={data} 
            summary={tldrSummary} 
            loading={isTldrLoading}
            onGenerate={handleGenerateTldr}
          />
        );
      case ViewMode.IMPORT:
      default:
        return (
          <div className="max-w-3xl mx-auto mt-10 pb-10">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 bg-indigo-900 text-white">
                <h2 className="text-3xl font-bold mb-2">Import Requirements</h2>
                <p className="text-indigo-200">
                  Paste JSON <b>OR</b> unstructured text (e.g., from emails/docs). 
                  <br/>AI will automatically structure text inputs.
                </p>
              </div>
              <div className="p-8 space-y-6">
                
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Import Failed</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    multiple 
                    accept=".json"
                    onChange={handleFileUpload}
                  />
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileUp className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">Drop JSON files here</h3>
                  <p className="text-slate-500 text-sm mt-1">For text files, copy content below</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-slate-500">Or paste content</span>
                  </div>
                </div>

                <div>
                  <textarea
                    className="w-full h-48 p-4 font-mono text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder={`Paste valid JSON array OR raw text here.\n\nExample Text:\n"The system MUST encrypt data at rest using AES-256. API responses SHOULD be under 200ms."`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2 text-right">
                    Smart Parser: Detects JSON automatically. Uses AI for raw text.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleSmartImport}
                    disabled={!jsonInput.trim() || isParsing}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI Parsing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        Smart Import
                      </>
                    )}
                  </button>
                  <button 
                    onClick={loadSample}
                    disabled={isParsing}
                    className="px-6 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Code className="w-6 h-6 text-indigo-500" />
              ReqAudit AI
            </h1>
            <p className="text-xs text-slate-500 mt-1">CTO Workflow Suite</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setView(ViewMode.DASHBOARD)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.DASHBOARD ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>
            <button 
              onClick={() => setView(ViewMode.GRID)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.GRID ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <Database className="w-5 h-5" />
              Data Grid
            </button>
            <button 
              onClick={() => setView(ViewMode.AI_ANALYSIS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === ViewMode.AI_ANALYSIS ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
            >
              <Bot className="w-5 h-5" />
              AI Analyst
            </button>

            <div className="py-2">
                <div className="border-t border-slate-800 mx-2"></div>
            </div>

            <button 
              onClick={() => setView(ViewMode.TLDR)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border border-indigo-900 ${view === ViewMode.TLDR ? 'bg-indigo-800 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-900 hover:bg-slate-800 text-indigo-300'}`}
            >
              <FileText className="w-5 h-5" />
              <div className="flex flex-col items-start">
                  <span className="font-bold tracking-wide">TL;DR</span>
                  <span className="text-[10px] uppercase opacity-70">Summary</span>
              </div>
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800 space-y-2">
            <button 
              onClick={() => { setData([]); setView(ViewMode.IMPORT); setJsonInput(''); setImportStats(null); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-700 rounded-lg text-xs hover:bg-slate-800 transition-colors"
            >
              <Upload className="w-3 h-3" />
              Load New Data
            </button>
             <button 
              onClick={removeApiKey}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs hover:bg-red-900/30 hover:text-red-400 transition-colors"
            >
              <Key className="w-3 h-3" />
              Reset API Key
            </button>
          </div>
        </aside>

      <main className="flex-1 p-4 md:p-8 h-screen overflow-hidden flex flex-col relative">
        {apiKey === 'DEMO' && (
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-gradient z-50"></div>
        )}

        {view !== ViewMode.IMPORT && (
          <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                {view === ViewMode.DASHBOARD && 'Analytics Overview'}
                {view === ViewMode.GRID && 'Requirements Registry'}
                {view === ViewMode.AI_ANALYSIS && 'Intelligent Analysis'}
                {view === ViewMode.TLDR && 'Executive Summary'}
                
                {apiKey === 'DEMO' && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> DEMO MODE
                  </span>
                )}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  {data.length} Records Loaded
                </span>

                {importStats && importStats.duplicatesFixed > 0 && (
                   <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" />
                     Fixed {importStats.duplicatesFixed} ID collisions
                   </span>
                )}

                {importStats && importStats.sequenceGap && (
                   <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1" title={`Expected ${importStats.sequenceGap.expected} items (ID ${importStats.sequenceGap.min} to ${importStats.sequenceGap.max}), but found ${importStats.sequenceGap.actual}.`}>
                     <AlertTriangle className="w-3 h-3" />
                     Sequence Gaps Detected (Max ID: {importStats.sequenceGap.max})
                   </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {restorePoint && (
                  <button 
                    onClick={handleRestore}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg animate-pulse"
                    title="Undo last Clean Up"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Undo Changes</span>
                  </button>
              )}

              <div className="text-right hidden sm:block">
                 <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Project</p>
                 <p className="text-sm font-semibold text-slate-800">Compliance Audit</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                P1
              </div>
            </div>
          </header>
        )}
        
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
