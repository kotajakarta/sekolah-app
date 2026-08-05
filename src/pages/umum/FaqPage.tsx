import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Loader2, HelpCircle, ChevronDown, ChevronUp, Search, BookOpen } from 'lucide-react';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: faqs = [], isLoading, isError } = useQuery<Faq[]>({
    queryKey: ['faqs'],
    queryFn: async () => {
      const res = await apiClient.get('/faq');
      return res.data;
    }
  });

  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqs;
    return faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [faqs, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
        Gagal memuat data FAQ. Silakan coba beberapa saat lagi.
      </div>
    );
  }

  return (
    <div className="font-sans text-slate-800 animate-in fade-in duration-300 pb-12 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center py-10 px-4 mb-8 bg-gradient-to-br from-indigo-50/50 to-slate-50 border border-slate-200/80 rounded-2xl">
        <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pusat Bantuan & FAQ</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Temukan jawaban atas pertanyaan yang paling sering diajukan mengenai sistem eSantri.
        </p>

        {/* Live Search Input */}
        <div className="max-w-lg mx-auto mt-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari topik bantuan atau pertanyaan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-350 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
      </div>

      {/* Accordion FAQ list */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            Tidak ada FAQ yang cocok dengan kata kunci pencarian Anda.
          </div>
        ) : (
          filteredFaqs.map(faq => (
            <div key={faq.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
              <button
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/40 text-left cursor-pointer focus:outline-none"
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
              >
                <h3 className="font-semibold text-slate-800 pr-6 text-sm sm:text-base leading-snug">{faq.question}</h3>
                <span className="text-slate-400 shrink-0">
                  {expandedId === faq.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </span>
              </button>

              {expandedId === faq.id && (
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
