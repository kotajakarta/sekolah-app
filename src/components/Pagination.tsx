import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
}: PaginationProps) {
  // Auto-clamp currentPage if out of bounds (e.g. after filtering)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      onPageChange(totalPages);
    } else if (currentPage < 1) {
      onPageChange(1);
    }
  }, [currentPage, totalPages, onPageChange]);

  if (totalPages <= 1) return null;

  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Generate page numbers to show cleanly with ellipses
  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];

    // Always show page 1
    pages.push(1);

    if (validCurrentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, validCurrentPage - 1);
    const end = Math.min(totalPages - 1, validCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (validCurrentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always show last page if > 1
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    // Deduplicate consecutive entries
    return pages.filter((page, index, arr) => arr.indexOf(page) === index);
  };

  const pageNumbers = getPageNumbers();

  const startItem = (validCurrentPage - 1) * itemsPerPage + 1;
  const endItem =
    totalItems !== undefined ? Math.min(validCurrentPage * itemsPerPage, totalItems) : validCurrentPage * itemsPerPage;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6">
      {/* Mobile view */}
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => onPageChange(validCurrentPage - 1)}
          disabled={validCurrentPage <= 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(validCurrentPage + 1)}
          disabled={validCurrentPage >= totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Desktop view */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700">
            {totalItems !== undefined ? (
              <>
                Menampilkan <span className="font-medium">{startItem}</span> hingga{' '}
                <span className="font-medium">{endItem}</span> dari{' '}
                <span className="font-medium">{totalItems}</span> hasil
              </>
            ) : (
              <>
                Halaman <span className="font-medium">{validCurrentPage}</span> dari{' '}
                <span className="font-medium">{totalPages}</span>
              </>
            )}
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(validCurrentPage - 1)}
              disabled={validCurrentPage <= 1}
              className="relative inline-flex items-center px-2.5 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Page Number Buttons & Ellipses */}
            {pageNumbers.map((page, idx) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="relative inline-flex items-center px-3 py-2 border border-slate-300 bg-slate-50 text-sm font-medium text-slate-400 select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = page === validCurrentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-3.5 py-2 border text-sm font-medium cursor-pointer transition-colors ${
                    isCurrent
                      ? 'z-10 bg-indigo-600 border-indigo-600 text-white font-bold'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(validCurrentPage + 1)}
              disabled={validCurrentPage >= totalPages}
              className="relative inline-flex items-center px-2.5 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
