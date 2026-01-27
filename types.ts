export interface Requirement {
  req_id: string;
  source_doc: string;
  section: string;
  category: string;
  subcategory: string;
  criticality: 'MUST' | 'SHOULD' | 'MAY' | string;
  text_original: string;
  ctonote?: string;
}

export enum ViewMode {
  IMPORT = 'IMPORT',
  DASHBOARD = 'DASHBOARD',
  GRID = 'GRID',
  AI_ANALYSIS = 'AI_ANALYSIS',
  TLDR = 'TLDR'
}

export interface FilterState {
  search: string;
  category: string | 'ALL';
  criticality: string | 'ALL';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type AuditType = 'DUPLICATE' | 'VAGUE' | 'SPELLING' | 'CONSISTENCY';

export interface AuditSuggestion {
  id: string; // The ID of the requirement to change
  type: 'UPDATE' | 'DELETE';
  issue: string; // Explanation of the problem
  suggested_text?: string; // Only for UPDATE
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
