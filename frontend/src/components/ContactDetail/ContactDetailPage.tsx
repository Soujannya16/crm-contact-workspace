import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Save,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  Building,
  Mail,
  Phone,
  Tag as TagIcon,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { AppDispatch, RootState } from '../../store';
import {
  fetchContactById,
  fetchTags,
  updateContact,
  clearConflict,
  clearUpdateSuccess,
  resetSelectedContact,
  addTagToContact,
  removeTagFromContact,
  clearTagError,
  fetchActivities,
} from '../../store/contactsSlice';
import { ActivityHistory } from './ActivityHistory';
import type { Contact, Tag } from '../../types/contact';

const TAG_COLOR_MAP: Record<string, string> = {
  VIP: 'tag-vip',
  Partner: 'tag-partner',
  Customer: 'tag-customer',
  Lead: 'tag-lead',
  Prospect: 'tag-prospect',
};

function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

interface ContactEditFormProps {
  contact: Contact;
  updateLoading: boolean;
  onSubmit: (data: { firstName: string; lastName: string; email: string; phone: string | null; company: string | null; version: number }) => void;
}

const ContactEditForm: React.FC<ContactEditFormProps> = ({ contact, updateLoading, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone || '',
    company: contact.company || '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      version: contact.version,
    });
  };

  const handleReset = () => {
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
    });
    setFormErrors({});
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2>Edit Contact Information</h2>
        <p className="card-subtitle">
          Modify contact fields below. Submissions require the matching concurrency version.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="contact-form" noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">
              First Name <span className="required">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              className={`form-input ${formErrors.firstName ? 'input-error' : ''}`}
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value });
                if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
              }}
              disabled={updateLoading}
            />
            {formErrors.firstName && (
              <span className="field-error">{formErrors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Last Name <span className="required">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              className={`form-input ${formErrors.lastName ? 'input-error' : ''}`}
              value={formData.lastName}
              onChange={(e) => {
                setFormData({ ...formData, lastName: e.target.value });
                if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
              }}
              disabled={updateLoading}
            />
            {formErrors.lastName && (
              <span className="field-error">{formErrors.lastName}</span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email Address <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <Mail size={16} className="input-icon" />
            <input
              id="email"
              type="email"
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
              }}
              disabled={updateLoading}
            />
          </div>
          {formErrors.email && (
            <span className="field-error">{formErrors.email}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-with-icon">
              <Phone size={16} className="input-icon" />
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0000"
                disabled={updateLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Company</label>
            <div className="input-with-icon">
              <Building size={16} className="input-icon" />
              <input
                id="company"
                type="text"
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Google, Apple"
                disabled={updateLoading}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updateLoading}
          >
            <Save size={16} />
            <span>{updateLoading ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={updateLoading}
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

interface TagSelectorProps {
  contact: Contact;
  availableTags: Tag[];
  tagLoading: boolean;
  tagError: string | null;
  onAdd: (tagId: number) => void;
  onRemove: (tagId: number, tagName: string) => void;
  onClearError: () => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  contact,
  availableTags,
  tagLoading,
  tagError,
  onAdd,
  onRemove,
  onClearError,
}) => {
  const unassignedTags = availableTags.filter((t) => !contact.tags.includes(t.name));

  return (
    <div className="tag-selector">
      {/* Assigned chips */}
      <div className="tags-container">
        {contact.tags.length > 0 ? (
          contact.tags.map((tagName) => (
            <span key={tagName} className={`tag-chip-removable ${TAG_COLOR_MAP[tagName] || 'tag-default'}`}>
              {tagName}
              <button
                type="button"
                className="tag-remove-btn"
                aria-label={`Remove ${tagName}`}
                disabled={tagLoading}
                onClick={() => {
                  const tag = availableTags.find((t) => t.name === tagName);
                  if (tag) onRemove(tag.id, tag.name);
                }}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <p className="text-muted text-sm">No tags assigned.</p>
        )}
      </div>

      {/* Add tag dropdown */}
      {unassignedTags.length > 0 && (
        <div className="add-tag-row">
          <select
            className="filter-select"
            disabled={tagLoading}
            defaultValue=""
            value=""
            onChange={(e) => {
              const tagId = parseInt(e.target.value, 10);
              if (!isNaN(tagId)) onAdd(tagId);
            }}
          >
            <option value="" disabled>+ Add tag…</option>
            {unassignedTags.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {tagLoading && <span className="tag-loading-text">Saving…</span>}
        </div>
      )}

      {/* Error */}
      {tagError && (
        <div className="tag-error-banner">
          <AlertTriangle size={14} />
          <span>{tagError}</span>
          <button type="button" onClick={onClearError} className="tag-error-dismiss">×</button>
        </div>
      )}
    </div>
  );
};

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contactId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    selectedContact,
    detailLoading,
    detailError,
    updateLoading,
    updateSuccess,
    conflictError,
    availableTags,
    tagLoading,
    tagError,
    activities,
    activitiesLoading,
    activitiesError,
  } = useSelector((state: RootState) => state.contacts);

  // Fetch contact and activities on mount or ID change
  useEffect(() => {
    if (!isNaN(contactId)) {
      dispatch(fetchContactById(contactId));
      dispatch(fetchTags());
      dispatch(fetchActivities(contactId));
    }
    return () => {
      dispatch(resetSelectedContact());
    };
  }, [dispatch, contactId]);

  // Auto-clear success banner after 4 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearUpdateSuccess());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, dispatch]);

  const handleSubmit = async (data: { firstName: string; lastName: string; email: string; phone: string | null; company: string | null; version: number }) => {
    if (!selectedContact) return;
    const res = await dispatch(
      updateContact({
        id: selectedContact.id,
        data,
      })
    );
    if (updateContact.fulfilled.match(res)) {
      dispatch(fetchActivities(selectedContact.id));
    }
  };

  const handleAddTag = async (tagId: number) => {
    if (!selectedContact) return;
    const res = await dispatch(addTagToContact({ contactId: selectedContact.id, tagId }));
    if (addTagToContact.fulfilled.match(res)) {
      dispatch(fetchActivities(selectedContact.id));
    }
  };

  const handleRemoveTag = async (tagId: number, tagName: string) => {
    if (!selectedContact) return;
    const res = await dispatch(removeTagFromContact({ contactId: selectedContact.id, tagId, tagName }));
    if (removeTagFromContact.fulfilled.match(res)) {
      dispatch(fetchActivities(selectedContact.id));
    }
  };

  const handleReloadLatest = () => {
    dispatch(clearConflict());
    dispatch(fetchContactById(contactId));
    dispatch(fetchActivities(contactId));
  };

  if (detailLoading && !selectedContact) {
    return (
      <div className="detail-container">
        <div className="skeleton-card">
          <div className="skeleton-cell w-48 mb-4"></div>
          <div className="skeleton-cell w-full mb-3"></div>
          <div className="skeleton-cell w-full mb-3"></div>
          <div className="skeleton-cell w-3/4"></div>
        </div>
      </div>
    );
  }

  if (detailError || !selectedContact) {
    return (
      <div className="detail-container">
        <div className="error-card">
          <AlertTriangle size={28} className="error-icon" />
          <div>
            <h3>Contact Not Found</h3>
            <p>{detailError || 'The requested contact could not be found.'}</p>
            <Link to="/" className="btn btn-secondary mt-3">
              <ArrowLeft size={16} />
              <span>Back to Contacts</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-container">
      {/* Navigation Header */}
      <div className="detail-header">
        <button
          type="button"
          className="btn-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
          <span>Back to Contacts</span>
        </button>

        <div className="version-pill">
          <ShieldCheck size={16} />
          <span>Version: <strong>v{selectedContact.version}</strong></span>
        </div>
      </div>

      {/* Conflict Alert Banner */}
      {conflictError && conflictError.type === 'stale_update' && (
        <div className="alert-banner alert-conflict">
          <AlertTriangle size={24} className="alert-icon" />
          <div className="alert-content">
            <h4>Update Conflict Detected</h4>
            <p>
              This contact was modified by another user since you loaded it. To prevent accidental overwrites, your changes were not applied.
            </p>
            <div className="alert-actions">
              <button
                type="button"
                className="btn btn-conflict-reload"
                onClick={handleReloadLatest}
              >
                <RotateCw size={15} />
                <span>Reload Latest Version</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Conflict Alert Banner */}
      {conflictError && conflictError.type === 'email_conflict' && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={24} className="alert-icon" />
          <div className="alert-content">
            <h4>Duplicate Email Conflict</h4>
            <p>{conflictError.message}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {updateSuccess && (
        <div className="alert-banner alert-success">
          <CheckCircle size={24} className="alert-icon" />
          <div className="alert-content">
            <h4>Contact Saved Successfully</h4>
            <p>
              Information updated and persisted. Concurrency version incremented to <strong>v{selectedContact.version}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="detail-grid">
        {/* Left Column: Form (keyed by ID and version for fresh state) */}
        <ContactEditForm
          key={`${selectedContact.id}-${selectedContact.version}`}
          contact={selectedContact}
          updateLoading={updateLoading}
          onSubmit={handleSubmit}
        />

        {/* Right Column: Metadata & Tags */}
        <div className="detail-sidebar">
          {/* Tags Card — interactive selector */}
          <div className="card">
            <div className="card-header">
              <div className="flex-header">
                <TagIcon size={18} />
                <h3>Assigned Tags</h3>
              </div>
            </div>
            <TagSelector
              contact={selectedContact}
              availableTags={availableTags}
              tagLoading={tagLoading}
              tagError={tagError}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              onClearError={() => dispatch(clearTagError())}
            />
          </div>

          {/* Activity History Card */}
          <ActivityHistory
            activities={activities}
            loading={activitiesLoading}
            error={activitiesError}
            onRetry={() => dispatch(fetchActivities(selectedContact.id))}
          />

          {/* Audit Metadata Card */}
          <div className="card">
            <div className="card-header">
              <div className="flex-header">
                <Clock size={18} />
                <h3>Contact Overview</h3>
              </div>
            </div>
            <div className="metadata-list">
              <div className="meta-item">
                <span className="meta-label">Contact ID:</span>
                <span className="meta-value">#{selectedContact.id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created At:</span>
                <span className="meta-value">{formatDate(selectedContact.createdAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Last Updated:</span>
                <span className="meta-value">{formatDate(selectedContact.updatedAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Current Version:</span>
                <span className="meta-value font-mono">v{selectedContact.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
