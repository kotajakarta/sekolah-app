import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import StudentProfileModal from '../../features/core_data/components/StudentProfileModal';
import StudentModal from '../../features/core_data/components/StudentModal';
import { createPortal } from 'react-dom';
import { normalizeTurkish } from '../../utils/text';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const searchStudents = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.get(`/students?search=${encodeURIComponent(debouncedQuery)}`);
        // If the API doesn't support ?search, we'll just filter client side for now if it returns all, 
        // wait, getStudents returns all for their scope. Let's fetch and filter client-side just to be safe if no search param is implemented yet.
        const allData = response.data;
        const q = normalizeTurkish(debouncedQuery).toLowerCase();
        const filtered = allData.filter((s: any) => 
          normalizeTurkish(s.biodata?.fullName || '').toLowerCase().includes(q) ||
          normalizeTurkish(s.biodata?.nik || '').toLowerCase().includes(q) ||
          normalizeTurkish(s.biodata?.nisn || '').toLowerCase().includes(q)
        ).slice(0, 10); // max 10 results
        setResults(filtered);
      } catch (error) {
        console.error('Failed to search', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchStudents();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <>
      <div ref={wrapperRef} className="relative w-full max-w-md hidden md:block z-50">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input 
        type="text" 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Cari data santri (Nama, NIK, NISN)..." 
        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm transition-all outline-none text-slate-800 placeholder:text-slate-400"
      />
      {isLoading && (
        <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
      )}

      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-2">
              {results.map((student) => (
                <li 
                  key={student.id} 
                  className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium text-sm text-slate-900">{student.biodata?.fullName}</div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-2">
                    {student.biodata?.nik && <span>NIK: {student.biodata.nik}</span>}
                    {student.biodata?.nik && student.biodata?.nisn && <span className="text-slate-300">|</span>}
                    {student.biodata?.nisn && <span>NISN: {student.biodata.nisn}</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {student.cabang?.name || student.wilayah?.name || 'Tidak ada penempatan'}
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800">
                      {student.statusPool}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !isLoading && (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                Tidak ada hasil untuk "{query}"
              </div>
            )
          )}
        </div>
      )}
    </div>
      
      {selectedStudent && createPortal(
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onEdit={() => {
            setStudentToEdit(selectedStudent);
            setSelectedStudent(null);
          }}
        />,
        document.body
      )}

      {studentToEdit && createPortal(
        <StudentModal
          student={studentToEdit}
          onClose={() => setStudentToEdit(null)}
        />,
        document.body
      )}
    </>
  );
};
