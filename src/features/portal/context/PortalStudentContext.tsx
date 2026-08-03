import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetPortalStudents, WaliSantriLink } from '../hooks/useGetPortalStudents';

const STORAGE_KEY = 'portal_selected_student_id';

interface PortalStudentContextType {
  links: WaliSantriLink[];
  selectedStudentId: string | null;
  selectedLink: WaliSantriLink | null;
  setSelectedStudentId: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
}

const PortalStudentContext = createContext<PortalStudentContextType | null>(null);

export const PortalStudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: links = [], isLoading, isError } = useGetPortalStudents();
  const [selectedStudentId, setSelectedStudentIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    if (isLoading) return;
    const validIds = links.map((l) => l.studentId);
    if (!selectedStudentId || !validIds.includes(selectedStudentId)) {
      const fallback = links[0]?.studentId ?? null;
      setSelectedStudentIdState(fallback);
      if (fallback) localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [isLoading, links, selectedStudentId]);

  const setSelectedStudentId = (id: string) => {
    setSelectedStudentIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedLink = links.find((l) => l.studentId === selectedStudentId) ?? null;

  return (
    <PortalStudentContext.Provider value={{ links, selectedStudentId, selectedLink, setSelectedStudentId, isLoading, isError }}>
      {children}
    </PortalStudentContext.Provider>
  );
};

export const usePortalStudent = () => {
  const ctx = useContext(PortalStudentContext);
  if (!ctx) throw new Error('usePortalStudent must be used within a PortalStudentProvider');
  return ctx;
};
