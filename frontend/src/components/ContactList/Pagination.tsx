import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}) => {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      
      const startRange = Math.max(2, page - 1);
      const endRange = Math.min(totalPages - 1, page + 1);
      
      for (let i = startRange; i <= endRange; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong> contacts
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn nav-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
          <span>Previous</span>
        </button>

        <div className="page-numbers">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={p}
                type="button"
                className={`page-btn number-btn ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ) : (
              <span key={`dots-${idx}`} className="page-ellipsis">
                {p}
              </span>
            )
          )}
        </div>

        <button
          type="button"
          className="page-btn nav-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
