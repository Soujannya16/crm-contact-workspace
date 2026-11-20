import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { toggleContactSelection } from '../../store/contactsSlice';
import type { Contact } from '../../types/contact';

interface ContactTableProps {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  onClearFilters: () => void;
  hasFilters: boolean;
  onSelectAll: (ids: number[]) => void;
  allSelected: boolean;
}

const TAG_COLOR_MAP: Record<string, string> = {
  VIP: 'tag-vip',
  Partner: 'tag-partner',
  Customer: 'tag-customer',
  Lead: 'tag-lead',
  Prospect: 'tag-prospect',
};

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  loading,
  error,
  onClearFilters,
  hasFilters,
  onSelectAll,
  allSelected,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedContactIds = useSelector((state: RootState) => state.contacts.selectedContactIds);
  if (error) {
    return (
      <div className="error-card">
        <AlertCircle size={24} className="error-icon" />
        <div>
          <h4>Failed to load contacts</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="table-container">
        <table className="contacts-table">
          <thead>
            <tr>
              <th className="checkbox-col"></th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Tags</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td className="checkbox-col"><div className="skeleton-cell w-4"></div></td>
                <td><div className="skeleton-cell w-32"></div></td>
                <td><div className="skeleton-cell w-48"></div></td>
                <td><div className="skeleton-cell w-28"></div></td>
                <td><div className="skeleton-cell w-24"></div></td>
                <td><div className="skeleton-cell w-20"></div></td>
                <td><div className="skeleton-cell w-24"></div></td>
                <td><div className="skeleton-cell w-16"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <Users size={48} className="empty-icon" />
        <h3>No contacts found</h3>
        <p>
          {hasFilters
            ? 'No contacts matched your search or filter criteria. Try adjusting your filters.'
            : 'There are no contacts available in the workspace.'}
        </p>
        {hasFilters && (
          <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
            Clear All Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="contacts-table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                checked={allSelected && contacts.length > 0}
                onChange={(e) => e.target.checked ? onSelectAll(contacts.map(c => c.id)) : onSelectAll([])}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company</th>
            <th>Tags</th>
            <th>Created</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="contact-row">
              <td className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedContactIds.includes(contact.id)}
                  onChange={() => dispatch(toggleContactSelection(contact.id))}
                />
              </td>
              <td className="font-medium">
                <Link to={`/contacts/${contact.id}`} className="contact-name-link">
                  {contact.firstName} {contact.lastName}
                </Link>
              </td>
              <td className="text-muted">{contact.email}</td>
              <td className="text-muted">{contact.phone || '—'}</td>
              <td>
                {contact.company ? (
                  <span className="company-badge">{contact.company}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <div className="tags-cell">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tagName) => (
                      <span
                        key={tagName}
                        className={`tag-badge ${TAG_COLOR_MAP[tagName] || 'tag-default'}`}
                      >
                        {tagName}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted text-sm">—</span>
                  )}
                </div>
              </td>
              <td className="text-muted text-sm">{formatDate(contact.createdAt)}</td>
              <td className="text-right">
                <Link to={`/contacts/${contact.id}`} className="btn-link">
                  <span>View / Edit</span>
                  <ExternalLink size={14} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
