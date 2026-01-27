import React, { useState, useMemo } from 'react';
import { Requirement, FilterState, AuditSuggestion } from '../types';
import { Search, Filter, ArrowUp, ArrowDown, Tag, FileText, Download, Sparkles } from 'lucide-react';
import DataCleanser from './DataCleanser';

interface Props {
  data: Requirement[];
  onApplyCleanUp: (suggestions: AuditSuggestion[]) => void;
}

const RequirementsTable: React.FC<Props> = ({ data, onApplyCleanUp }) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'ALL',
    criticality: 'ALL'
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof Requirement; direction: 'asc' | 'desc' } | null>(null);
  const [showCleanser, setShowCleanser] = useState(false);

  // Derive unique options for dropdowns
  const categories = useMemo(() => Array.from(new Set(data.map(d => d.category))).sort(), [data]);
  const criticalities = useMemo(() => Array.from(new Set(data.map(d => d.criticality))).sort(), [data]);

  // Filter Logic
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = 
        item.text_original.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.req_id.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.category.toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.ctonote && item.ctonote.toLowerCase().includes(filters.search.toLowerCase()));
      
      const matchesCategory = filters.category === 'ALL' || item.category === filters.category;
      const matchesCriticality = filters.criticality === 'ALL' || item.criticality === filters.criticality;

      return matchesSearch && matchesCategory && matchesCriticality;
    });
  }, [data, filters]);

  // Sort Logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      // @ts-ignore - dynamic key access
      const aVal = a[sortConfig.key] || '';
      // @ts-ignore
      const bVal = b[sortConfig.key] || '';

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof Requirement) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleExport = () => {
    // Define columns to export
    const columns: (keyof Requirement)[] = [
      'req_id', 
      'category', 
      'subcategory', 
      'criticality', 
      'source_doc', 
      'section', 
      'text_original', 
      'ctonote'
    ];
    
    // Create header row
    const csvRows = [columns.join(',')];
    
    // Create data rows
    for (const row of sortedData) {
      const values = columns.map(col => {
        const val = row[col] || '';
        // Escape quotes by doubling them, and wrap value in quotes
        const escaped = String(val).replace(/"/g, '""'); 
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    // Add BOM for Excel UTF-8 compatibility so special chars (umlauts) display correctly
    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `requirements_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCriticalityBadge = (crit: string) => {
    switch (crit.toUpperCase()) {
      case 'MUST': return 'bg-red-100 text-red-800 border-red-200';
      case 'SHOULD': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'MAY': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-200px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search requirements, IDs, or content..." 
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Smart Clean Button */}
          <button
             onClick={() => setShowCleanser(true)}
             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
          >
             <Sparkles className="w-4 h-4" />
             Smart Clean
          </button>

          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              className="pl-10 pr-8 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer hover:bg-slate-50"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <select 
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-50"
            value={filters.criticality}
            onChange={(e) => setFilters(prev => ({ ...prev, criticality: e.target.value }))}
          >
            <option value="ALL">All Criticalities</option>
            {criticalities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors ml-2"
            title="Export filtered data to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {[
                { label: 'ID', key: 'req_id', width: 'w-24' },
                { label: 'Category', key: 'category', width: 'w-32' },
                { label: 'Subcategory', key: 'subcategory', width: 'w-32' },
                { label: 'Criticality', key: 'criticality', width: 'w-28' },
                { label: 'Requirement Text', key: 'text_original', width: 'flex-1' },
                { label: 'CTO Note', key: 'ctonote', width: 'w-48' }
              ].map((col) => (
                <th 
                  key={col.key}
                  onClick={() => handleSort(col.key as keyof Requirement)}
                  className={`p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors ${col.width}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No requirements found matching your filters.
                </td>
              </tr>
            ) : (
              sortedData.map((req) => (
                <tr key={req.req_id} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 align-top font-mono text-xs font-medium text-slate-600">
                    {req.req_id}
                  </td>
                  <td className="p-4 align-top">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                      {req.category}
                    </span>
                  </td>
                  <td className="p-4 align-top text-sm text-slate-600">
                    {req.subcategory}
                  </td>
                  <td className="p-4 align-top">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCriticalityBadge(req.criticality)}`}>
                      {req.criticality}
                    </span>
                  </td>
                  <td className="p-4 align-top">
                    <p className="text-sm text-slate-800 leading-relaxed">
                      {req.text_original}
                    </p>
                    <div className="flex gap-2 mt-2 text-xs text-slate-400">
                      <FileText className="w-3 h-3" /> {req.source_doc} • {req.section}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    {req.ctonote && (
                      <div className="flex gap-2 p-2 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 text-xs">
                         <Tag className="w-3 h-3 flex-shrink-0 mt-0.5" />
                         {req.ctonote}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
        <span>Showing {sortedData.length} of {data.length} records</span>
      </div>

      {showCleanser && (
        <DataCleanser 
            data={data}
            categories={categories}
            onClose={() => setShowCleanser(false)}
            onApply={onApplyCleanUp}
        />
      )}
    </div>
  );
};

export default RequirementsTable;