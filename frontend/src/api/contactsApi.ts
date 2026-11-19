import type { Contact, ContactListQuery, ContactUpdateInput, PaginatedResponse, Tag } from '../types/contact';

const BASE_URL = '/api';

export class ApiError extends Error {
  statusCode: number;
  data: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorData: Record<string, unknown>;
    try {
      errorData = (await response.json()) as Record<string, unknown>;
    } catch {
      errorData = { message: response.statusText };
    }

    const message =
      (typeof errorData.message === 'string' && errorData.message) ||
      (typeof errorData.error === 'string' && errorData.error) ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, errorData);
  }

  return response.json();
}

export const contactsApi = {
  getContacts(query: ContactListQuery = {}): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.search) params.set('search', query.search);
    if (query.company) params.set('company', query.company);
    if (query.tag) params.set('tag', query.tag);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.order) params.set('order', query.order);

    const queryString = params.toString();
    return request<PaginatedResponse<Contact>>(`/contacts${queryString ? `?${queryString}` : ''}`);
  },

  getContactById(id: number): Promise<Contact> {
    return request<Contact>(`/contacts/${id}`);
  },

  updateContact(id: number, data: ContactUpdateInput): Promise<Contact> {
    return request<Contact>(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getTags(): Promise<Tag[]> {
    return request<Tag[]>('/tags');
  },

  getCompanies(): Promise<string[]> {
    return request<string[]>('/contacts/meta/companies');
  },
};
