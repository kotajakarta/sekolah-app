import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import apiClient from '../../lib/apiClient';

function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await apiClient.get(`/search?q=${encodeURIComponent(query)}`);
      return res.data;
    },
    enabled: query.length >= 2,
  });
}

function ResultsDropdown({ query, results, isSearching, onSelect }: { query: string; results: any[]; isSearching: boolean; onSelect: (link: string) => void }) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto custom-scrollbar">
      {isSearching ? (
        <div className="p-3 text-center text-sm text-slate-500">Mencari...</div>
      ) : results.length > 0 ? (
        <ul className="py-1">
          {results.map((res: any) => (
            <li key={`${res.type}-${res.id}`}>
              <button
                onClick={() => onSelect(res.link)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col"
              >
                <span className="text-sm font-medium text-slate-800">{res.name}</span>
                <span className="text-xs text-slate-500">{res.type} • {res.subtitle}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-3 text-center text-sm text-slate-500">
          {query.length >= 2 ? 'Tidak ada hasil' : 'Ketik minimal 2 karakter'}
        </div>
      )}
    </div>
  );
}

export default function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isLoading: isSearching } = useGlobalSearch(query);

  const goTo = (link: string) => {
    const targetLink = link.startsWith('/dashboard') ? link : `/dashboard${link}`;
    setQuery('');
    setIsFocused(false);
    setIsMobileOpen(false);
    navigate(targetLink);
  };

  // Ctrl/Cmd+K focuses desktop search, or opens the mobile overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          inputRef.current?.focus();
        } else {
          setIsMobileOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileOpen) mobileInputRef.current?.focus();
  }, [isMobileOpen]);

  return (
    <>
      {/* Desktop: inline search bar */}
      <div className="relative hidden lg:block w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg h-9 pl-9 pr-14 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
          Ctrl K
        </span>

        {isFocused && query.length > 0 && (
          <ResultsDropdown query={query} results={results} isSearching={isSearching} onSelect={goTo} />
        )}
      </div>

      {/* Mobile: icon button that opens a full-width overlay */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors shrink-0"
        aria-label="Cari data"
      >
        <Search className="w-5 h-5" />
      </button>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="h-14 shrink-0 flex items-center gap-2 px-3 border-b border-slate-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Cari data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-0 text-sm focus:outline-none"
            />
            <button
              onClick={() => { setIsMobileOpen(false); setQuery(''); }}
              className="p-1.5 text-slate-400 hover:text-slate-700 shrink-0"
              aria-label="Tutup pencarian"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-slate-500">Mencari...</div>
            ) : query.length >= 2 && results.length > 0 ? (
              <ul className="py-1 divide-y divide-slate-100">
                {results.map((res: any) => (
                  <li key={`${res.type}-${res.id}`}>
                    <button
                      onClick={() => goTo(res.link)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col"
                    >
                      <span className="text-sm font-medium text-slate-800">{res.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{res.type} • {res.subtitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                {query.length >= 2 ? 'Tidak ada hasil' : 'Ketik minimal 2 karakter untuk mencari'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
