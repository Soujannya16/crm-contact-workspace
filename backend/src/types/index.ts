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

export interface ContactRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  tags?: string | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Activity {
  id: number;
  contactId: number;
  type: 'CONTACT_UPDATED' | 'TAG_ADDED' | 'TAG_REMOVED';
  timestamp: string;
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
