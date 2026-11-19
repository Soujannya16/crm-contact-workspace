import React, { useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchContacts, fetchTags, fetchCompanies } from '../../store/contactsSlice';
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
  } = useSelector((state: RootState) => state.contacts);

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

      <ContactTable
        contacts={items}
        loading={listLoading}
        error={listError}
        onClearFilters={handleResetFilters}
        hasFilters={hasFilters}
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
