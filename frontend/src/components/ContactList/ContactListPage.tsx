import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle } from 'lucide-react';
import type { AppDispatch, RootState } from '../../store';
import { fetchContacts, fetchTags, fetchCompanies, selectAllContacts, clearContactSelection, clearBulkResult, bulkAssignTag } from '../../store/contactsSlice';
import { ContactFilters } from './ContactFilters';
import { ContactTable } from './ContactTable';
import { Pagination } from './Pagination';
import type { ContactListQuery } from '../../types/contact';

export const ContactListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const {
    items,
    pagination,
    availableTags,
    availableCompanies,
    listLoading,
    listError,
    selectedContactIds,
    bulkAssignLoading,
    bulkAssignResult,
  } = useSelector((state: RootState) => state.contacts);

  const [bulkTagId, setBulkTagId] = useState<number | ''>('');

  // Extract query values from URL
  const search = searchParams.get('search') || '';
  const company = searchParams.get('company') || '';
  const tag = searchParams.get('tag') || '';
  const sortBy = (searchParams.get('sortBy') as 'name' | 'createdAt') || 'createdAt';
  const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Load tags and companies on mount
  useEffect(() => {
    dispatch(fetchTags());
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Construct query object
  const currentQuery: ContactListQuery = useMemo(() => {
    const q: ContactListQuery = {
      page,
      limit,
      sortBy,
      order,
    };
    if (search) q.search = search;
    if (company) q.company = company;
    if (tag) q.tag = tag;
    return q;
  }, [page, limit, search, company, tag, sortBy, order]);

  // Dispatch fetchContacts whenever URL search parameters change
  useEffect(() => {
    dispatch(fetchContacts(currentQuery));
  }, [dispatch, currentQuery]);

  // Update URL search params
  const handleFilterChange = useCallback((updates: Record<string, string | number | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === undefined || val === '') {
          next.delete(key);
        } else {
          next.set(key, String(val));
        }
      });
      return next;
    });
  }, [setSearchParams]);

  // Reset all filters to default
  const handleResetFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    handleFilterChange({ page: newPage });
  }, [handleFilterChange]);

  const hasFilters = Boolean(search || company || tag || sortBy !== 'createdAt' || order !== 'asc' || limit !== 20);

  const allSelected = items.length > 0 && items.every(c => selectedContactIds.includes(c.id));

  const handleSelectAll = useCallback((ids: number[]) => {
    if (ids.length === 0) dispatch(clearContactSelection());
    else dispatch(selectAllContacts(ids));
  }, [dispatch]);

  // Clear selection when filters change
  useEffect(() => {
    dispatch(clearContactSelection());
  }, [dispatch, currentQuery]);

  // Auto-clear bulk result after 5 seconds and re-fetch
  useEffect(() => {
    if (bulkAssignResult) {
      dispatch(fetchContacts(currentQuery));
      const t = setTimeout(() => dispatch(clearBulkResult()), 5000);
      return () => clearTimeout(t);
    }
  }, [bulkAssignResult, dispatch, currentQuery]);

  const handleBulkAssign = useCallback(() => {
    if (bulkTagId === '' || selectedContactIds.length === 0) return;
    dispatch(bulkAssignTag({ contactIds: selectedContactIds, tagId: bulkTagId as number }));
  }, [dispatch, bulkTagId, selectedContactIds]);

  return (
    <div className="contact-list-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">
            Manage your workspace contacts, search across details, and filter by company or tags.
          </p>
        </div>
      </div>

      <ContactFilters
        search={search}
        company={company}
        tag={tag}
        sortBy={sortBy}
        order={order}
        limit={limit}
        availableCompanies={availableCompanies}
        availableTags={availableTags}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {selectedContactIds.length > 0 && (
        <div className="bulk-toolbar">
          <span className="bulk-count">{selectedContactIds.length} contact{selectedContactIds.length > 1 ? 's' : ''} selected</span>
          <select
            className="filter-select bulk-tag-select"
            value={bulkTagId}
            onChange={(e) => setBulkTagId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Assign tag…</option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={bulkTagId === '' || bulkAssignLoading}
            onClick={handleBulkAssign}
          >
            {bulkAssignLoading ? 'Assigning…' : 'Assign'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { dispatch(clearContactSelection()); setBulkTagId(''); }}
          >
            Cancel
          </button>
        </div>
      )}

      {bulkAssignResult && (
        <div className="alert-banner alert-success bulk-result-banner">
          <CheckCircle size={18} className="alert-icon" />
          <span>
            Tag assigned to <strong>{bulkAssignResult.assigned}</strong> contact{bulkAssignResult.assigned !== 1 ? 's' : ''}.
            {bulkAssignResult.skipped > 0 && ` (${bulkAssignResult.skipped} already had it)`}
          </span>
        </div>
      )}

      <ContactTable
        contacts={items}
        loading={listLoading}
        error={listError}
        onClearFilters={handleResetFilters}
        hasFilters={hasFilters}
        onSelectAll={handleSelectAll}
        allSelected={allSelected}
      />

      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
