export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
}

export interface Tag {
  id: number;
  name: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ContactListQuery {
  page?: number;
  limit?: number;
  search?: string;
  company?: string;
  tag?: string;
  sortBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ContactUpdateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  version: number;
}

export interface ConflictError {
  type: 'stale_update' | 'email_conflict' | 'validation' | 'unknown';
  message: string;
}

export type ActivityType = 'CONTACT_UPDATED' | 'TAG_ADDED' | 'TAG_REMOVED';

export interface Activity {
  id: number;
  type: ActivityType;
  timestamp: string;
}
