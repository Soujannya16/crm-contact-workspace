import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
import type { Tag } from '../../types/contact';

interface ContactFiltersProps {
  search: string;
  company: string;
  tag: string;
  sortBy: string;
  order: string;
  limit: number;
  availableCompanies: string[];
  availableTags: Tag[];
  onFilterChange: (updates: Record<string, string | number | undefined>) => void;
  onReset: () => void;
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
  search,
  company,
  tag,
  sortBy,
  order,
  limit,
  availableCompanies,
  availableTags,
  onFilterChange,
  onReset,
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync local search when parent search prop changes during render
  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onFilterChange({ search: localSearch.trim() || undefined, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, search, onFilterChange]);

  const sortValue = `${sortBy}:${order}`;

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [newSortBy, newOrder] = e.target.value.split(':');
    onFilterChange({ sortBy: newSortBy, order: newOrder, page: 1 });
  };

  const hasActiveFilters = Boolean(search || company || tag || sortBy !== 'createdAt' || order !== 'asc' || limit !== 20);

  return (
    <div className="filter-card">
      <div className="filter-row">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or phone..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setLocalSearch('');
                onFilterChange({ search: undefined, page: 1 });
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Company Filter */}
        <div className="select-wrapper">
          <Filter size={16} className="select-icon" />
          <select
            className="filter-select"
            value={company}
            onChange={(e) => onFilterChange({ company: e.target.value || undefined, page: 1 })}
          >
            <option value="">All Companies</option>
            {availableCompanies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div className="select-wrapper">
          <span className="tag-filter-icon">🏷️</span>
          <select
            className="filter-select"
            value={tag}
            onChange={(e) => onFilterChange({ tag: e.target.value || undefined, page: 1 })}
          >
            <option value="">All Tags</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select */}
        <div className="select-wrapper">
          <ArrowUpDown size={16} className="select-icon" />
          <select
            className="filter-select"
            value={sortValue}
            onChange={handleSortChange}
          >
            <option value="createdAt:asc">Created: Oldest First</option>
            <option value="createdAt:desc">Created: Newest First</option>
            <option value="name:asc">Name: A to Z</option>
            <option value="name:desc">Name: Z to A</option>
          </select>
        </div>

        {/* Items per page */}
        <div className="select-wrapper limit-select">
          <select
            className="filter-select"
            value={limit}
            onChange={(e) => onFilterChange({ limit: Number(e.target.value), page: 1 })}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            className="reset-filters-btn"
            onClick={onReset}
            title="Reset all filters"
          >
            <RotateCcw size={15} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
