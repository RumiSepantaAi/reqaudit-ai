import { GoogleGenAI } from "@google/genai";
import { Requirement, AuditSuggestion, AuditType } from '../types';
import { SAMPLE_DATA } from '../constants';

// --- HELPER FOR "PACKED" CONFIG ---
// We pack the local config into the apiKey string to avoid changing all component signatures
// Format: CUSTOM_LLM::BaseUrl::ModelName
interface AiConfig {
    provider: 'google' | 'custom' | 'demo';
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
}

const parseConfig = (keyString: string): AiConfig => {
    if (keyString === 'DEMO') return { provider: 'demo' };
    if (keyString.startsWith('CUSTOM_LLM::')) {
        const parts = keyString.split('::');
        return {
            provider: 'custom',
            baseUrl: parts[1],
            modelName: parts[2]
        };
    }
    return { provider: 'google', apiKey: keyString };
};

// --- OPENAI COMPATIBLE ADAPTER (FOR OLLAMA / LOCAL AI) ---

async function runOpenAiCompatible(
    baseUrl: string, 
    modelName: string, 
    systemPrompt: string, 
    userPrompt: string,
    jsonMode: boolean = false
): Promise<string> {
    try {
        const endpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
        
        const payload = {
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            stream: false,
            // Add format: json_object if supported by the local backend (Ollama supports it for some models)
            ...(jsonMode ? { format: "json" } : {}) 
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Authorization header is usually not needed for local Ollama, but some proxies might need it.
                // We leave it empty for localhost.
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Local LLM Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        
        if (!content) throw new Error("Local LLM returned empty response");
        return content;

    } catch (e: any) {
        console.error("Local LLM Call Failed:", e);
        if (e.name === 'TypeError' && e.message.includes('Failed to fetch')) {
             throw new Error("Connection failed. Is Ollama running? Did you set OLLAMA_ORIGINS=\"*\"?");
        }
        throw e;
    }
}


// --- MOCKED DATA FOR DEMO MODE ---

const MOCK_TLDR = `
## Executive Summary (DEMO)
The analyzed requirements define a **System of Record (SoT)** architecture with a strong emphasis on **auditability**, **security**, and **standardization**. The scope covers core database principles, API governance, and encryption standards. The overall maturity level is high, with explicit "MUST" constraints on critical paths.

## Risk Analysis
- **Criticality Distribution:** 60% MUST, 40% SHOULD. 
- **High Risk:** The strict requirement for *immutable lineage* (R-002) poses a significant implementation challenge for legacy data integration.
- **Security:** AES-256 encryption (R-004) is correctly mandated, but key rotation policies need to be explicitly automated.

## Key Domains
*   **Architecture:** Data lineage & Postgres SoT.
*   **Governance:** Compliance & Audit trails.
*   **Security:** Data-at-rest encryption.

## CTO Recommendations
1.  **Prioritize Lineage Engine:** Start the engineering of the lineage tracking mechanism immediately.
2.  **Standardize API Gateway:** Enforce OpenAPI 3.0 validation at the gateway level.
3.  **Define SLA Monitoring:** Implement distributed tracing (OpenTelemetry).
`;

const MOCK_AUDIT_RESULTS: AuditSuggestion[] = [
    {
        id: "R-005",
        type: "UPDATE",
        issue: "Vague latency target without conditions.",
        suggested_text: "The API response time MUST be under 200ms for 99% of requests (p99) measured at the gateway, excluding cold starts.",
        confidence: "HIGH"
    },
    {
        id: "R-003",
        type: "UPDATE",
        issue: "Standardize wording for 'RESTful'.",
        suggested_text: "External interfaces MUST adhere to REST maturity level 2 and be defined via OpenAPI 3.0 specification.",
        confidence: "MEDIUM"
    }
];

// Helper to simulate network latency
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to chunk text.
function chunkText(text: string, maxLength: number = 15000): string[] {
  if (text.length <= maxLength) return [text];
  
  const chunks: string[] = [];
  let currentChunk = '';
  // Split by double newlines to preserve paragraph integrity
  const paragraphs = text.split(/\n\s*\n/);
  
  for (const para of paragraphs) {
    if (para.length > maxLength) {
        const lines = para.split('\n');
        for (const line of lines) {
             if ((currentChunk.length + line.length) > maxLength) {
                chunks.push(currentChunk);
                currentChunk = line;
             } else {
                currentChunk += (currentChunk ? '\n' : '') + line;
             }
        }
        continue;
    }

    if ((currentChunk.length + para.length) > maxLength) {
      chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

// --- CONFIGURATION ---

const CASCADE_MODELS = [
    'gemini-3-pro-preview',        // 1. Flagship (Smartest)
    'gemini-3-flash-preview',      // 2. High Speed Fallback
    'gemini-2.0-flash',            // 3. Stable Flash
    'gemma-2-27b-it',              // 4. Open Source (Strong) - Google hosted
    'gemma-2-9b-it'                // 5. Open Source (Fast) - Google hosted
];

// Helper um API Calls mit Fallback zu machen (ONLY FOR GOOGLE)
async function runWithCascade(
    operationName: string, 
    fn: (model: string) => Promise<any>
): Promise<any> {
    let lastError: any = null;

    for (const model of CASCADE_MODELS) {
        try {
            return await fn(model);
        } catch (error: any) {
            const msg = error.message || '';
            const isQuotaError = msg.includes('429') || msg.includes('quota') || msg.includes('resource exhausted');
            const isOverload = msg.includes('503') || msg.includes('overloaded');

            if (isQuotaError || isOverload) {
                console.warn(`Model ${model} exhausted/busy (${msg}). Switching to next fallback...`);
                lastError = error;
                continue;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`All models failed for ${operationName}. Last error: ${lastError?.message}`);
}

// --- EXPORTED FUNCTIONS ---

export const parseTextToRequirements = async (rawText: string, apiKeyString: string): Promise<any[]> => {
  const config = parseConfig(apiKeyString);

  // 1. DEMO MODE
  if (config.provider === 'demo') {
      await simulateDelay(2000); 
      if (rawText.includes("Source of Truth") || rawText.length < 500) {
          return SAMPLE_DATA;
      }
      return [{
          req_id: "DEMO-001",
          category: "Demo",
          criticality: "MAY",
          text_original: "Demo Mode Active: Real AI parsing requires a valid API Key or Local LLM. This is a placeholder.",
          section: "Simulation"
      }];
  }

  // 2. PROMPT
  const systemPrompt = `
    You are a High-Fidelity Data Extraction Engine.
    **TASK**: Extract engineering requirements from the text into a JSON array.
    **JSON SCHEMA**: { "req_id", "source_doc", "section", "category", "subcategory", "criticality", "text_original", "ctonote" }.
    **RULES**: Output ONLY valid JSON. No markdown.
  `;

  // 3. EXECUTION
  const chunks = chunkText(rawText, 25000); 
  const allResults: any[] = [];

  for (const chunk of chunks) {
    let text = "";

    if (config.provider === 'custom') {
        // LOCAL LLM
        text = await runOpenAiCompatible(
            config.baseUrl!, 
            config.modelName!, 
            systemPrompt, 
            `EXTRACT REQUIREMENTS FROM:\n\n${chunk}`,
            true
        );
    } else {
        // GOOGLE GEMINI
        const ai = new GoogleGenAI({ apiKey: config.apiKey! });
        const chunkResult = await runWithCascade('Parsing Chunk', async (model) => {
            const response = await ai.models.generateContent({
                model: model,
                contents: [
                  { role: 'user', parts: [{ text: `EXTRACT REQUIREMENTS FROM THIS PARTIAL TEXT:\n\n${chunk}` }] }
                ],
                config: {
                  systemInstruction: systemPrompt,
                  responseMimeType: 'application/json'
                }
            });
            return response.text;
        });
        text = chunkResult || "";
    }

    if (!text) throw new Error("Empty response from AI");

    // CLEANUP JSON
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBracket = cleanText.indexOf('[');
    const lastBracket = cleanText.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    } else {
        const firstCurly = cleanText.indexOf('{');
        const lastCurly = cleanText.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
            cleanText = `[${cleanText.substring(firstCurly, lastCurly + 1)}]`;
        }
    }

    try {
        const parsed = JSON.parse(cleanText);
        const arrayResult = Array.isArray(parsed) ? parsed : [parsed];
        allResults.push(...arrayResult);
    } catch (parseErr) {
        console.error("JSON Parse failed", cleanText);
        throw new Error("Invalid JSON returned by AI. Try a smaller text or stronger model.");
    }
  }

  return allResults;
};

export const analyzeRequirements = async (
  query: string, 
  data: Requirement[],
  history: { role: 'user' | 'model'; text: string }[] = [],
  apiKeyString: string
): Promise<string> => {
  const config = parseConfig(apiKeyString);

  // 1. DEMO MODE (IMPROVED SIMULATION)
  if (config.provider === 'demo') {
      await simulateDelay(1500);
      const lowerQ = query.toLowerCase();
      // Simple Keyword Matching to make Demo feel smarter
      if (lowerQ.includes('summary') || lowerQ.includes('overview')) return "Based on the Demo Data: We have 5 core requirements focusing on **Security**, **Governance**, and **Performance**.";
      if (lowerQ.includes('risk') || lowerQ.includes('critical')) return "High Risk: **R-002 (Auditability)** requires immutable lineage which is complex to implement.";
      if (lowerQ.includes('database') || lowerQ.includes('sql')) return "**R-001** mandates **PostgreSQL** as the single Source of Truth.";
      if (lowerQ.includes('security') || lowerQ.includes('encrypt')) return "**R-004** requires AES-256 for Data at Rest.";
      
      return "I am running in **Demo Mode**. I can answer basic questions about the sample dataset (Security, Architecture, Risks), but I cannot process custom queries dynamically without a real AI connection.";
  }

  const MAX_CONTEXT_ITEMS = 600; 
  const optimizedData = data.slice(0, MAX_CONTEXT_ITEMS).map(d => ({
    id: d.req_id,
    cat: d.category,
    crit: d.criticality === 'MUST' ? 'M' : d.criticality === 'SHOULD' ? 'S' : 'O', 
    txt: d.text_original.substring(0, 800), 
    note: d.ctonote
  }));
  const contextData = JSON.stringify(optimizedData);
  const isTruncated = data.length > MAX_CONTEXT_ITEMS;
  
  const systemPrompt = `
    You are an expert CTO assistant.
    Data Source: ${isTruncated ? `First ${MAX_CONTEXT_ITEMS} items` : 'Full dataset'}.
    Dataset (JSON): ${contextData}
    Instructions: Answer the user's question based strictly on this data. Be concise, technical. Format Markdown.
  `;

  if (config.provider === 'custom') {
      // LOCAL LLM CONTEXT HANDLING
      // We manually construct the history string for simple endpoints
      let fullPrompt = `System: ${systemPrompt}\n`;
      history.forEach(h => fullPrompt += `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}\n`);
      fullPrompt += `User: ${query}`;

      return await runOpenAiCompatible(config.baseUrl!, config.modelName!, systemPrompt, query);
  }

  // GOOGLE GEMINI
  const ai = new GoogleGenAI({ apiKey: config.apiKey! });
  try {
    const apiHistory = history.filter((h, index) => {
       if (index === 0 && h.role === 'model' && h.text.includes("Hello!")) return false;
       return true;
    }).map(h => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    let lastError = null;
    for (const model of CASCADE_MODELS) {
        try {
            const chat = ai.chats.create({
              model: model,
              config: { systemInstruction: systemPrompt },
              history: apiHistory,
            });
            const response = await chat.sendMessage({ message: query });
            return response.text || "No response generated.";
        } catch (e: any) {
             const msg = e.message || '';
             if (msg.includes('429') || msg.includes('503')) {
                 lastError = e;
                 continue;
             }
             throw e;
        }
    }
    return `Analysis failed. All models overloaded.`;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Analysis failed: ${(error as Error).message}.`;
  }
};

export const generateExecutiveSummary = async (data: Requirement[], apiKeyString: string): Promise<string> => {
    const config = parseConfig(apiKeyString);

    if (config.provider === 'demo') {
        await simulateDelay(2500); 
        return MOCK_TLDR;
    }

    const condensedData = data.map(d => ({
        id: d.req_id,
        category: d.category,
        criticality: d.criticality,
        text: d.text_original.substring(0, 300) 
    }));
    const contextData = JSON.stringify(condensedData);
    
    const prompt = `
      ACT AS: CTO / Principal Engineer.
      TASK: Generate a concise, high-impact "TL;DR" (Executive Summary) for the provided requirements dataset.
      DATASET (JSON): ${contextData}
      OUTPUT FORMAT: Markdown (Executive Summary, Risk Analysis, Key Domains, CTO Recommendations).
    `;
  
    if (config.provider === 'custom') {
        return await runOpenAiCompatible(config.baseUrl!, config.modelName!, "You are a CTO.", prompt);
    }

    const ai = new GoogleGenAI({ apiKey: config.apiKey! });
    try {
      return await runWithCascade('Summary', async (model) => {
          const response = await ai.models.generateContent({
            model: model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });
          return response.text || "Could not generate summary.";
      });
    } catch (error) {
      return "Failed to generate summary.";
    }
  };

export const auditRequirements = async (
    data: Requirement[], 
    mode: AuditType,
    apiKeyString: string
): Promise<AuditSuggestion[]> => {
    const config = parseConfig(apiKeyString);

    if (config.provider === 'demo') {
        await simulateDelay(2000);
        return MOCK_AUDIT_RESULTS;
    }

    const condensed = data.map(d => ({ id: d.req_id, text: d.text_original }));
    const systemPrompt = `
      You are a QA Engineer. Audit these requirements.
      MODE: ${mode} (DUPLICATE, VAGUE, SPELLING, CONSISTENCY).
      OUTPUT: JSON Array [{ "id", "type": "UPDATE"|"DELETE", "issue", "suggested_text", "confidence" }].
      Return ONLY valid JSON.
    `;

    let text = "";
    
    if (config.provider === 'custom') {
        text = await runOpenAiCompatible(config.baseUrl!, config.modelName!, systemPrompt, `AUDIT DATA:\n${JSON.stringify(condensed)}`, true);
    } else {
        const ai = new GoogleGenAI({ apiKey: config.apiKey! });
        try {
            text = await runWithCascade('Audit', async (model) => {
                const response = await ai.models.generateContent({
                    model: model,
                    contents: [{ role: 'user', parts: [{ text: JSON.stringify(condensed) }] }],
                    config: { systemInstruction: systemPrompt, responseMimeType: 'application/json' }
                });
                return response.text || "[]";
            });
        } catch (e) {
            throw new Error("Audit failed.");
        }
    }

    try {
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch(e) {
        console.error("Audit JSON parse error", text);
        return [];
    }
};
