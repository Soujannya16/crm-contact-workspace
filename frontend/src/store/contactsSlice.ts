import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { contactsApi, ApiError } from '../api/contactsApi';
import type { Contact, ContactListQuery, ContactUpdateInput, ConflictError, Pagination, Tag } from '../types/contact';

export interface ContactsState {
  items: Contact[];
  pagination: Pagination;
  selectedContact: Contact | null;
  availableTags: Tag[];
  availableCompanies: string[];
  listLoading: boolean;
  listError: string | null;
  detailLoading: boolean;
  detailError: string | null;
  updateLoading: boolean;
  updateSuccess: boolean;
  conflictError: ConflictError | null;
}

const initialState: ContactsState = {
  items: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  selectedContact: null,
  availableTags: [],
  availableCompanies: [],
  listLoading: false,
  listError: null,
  detailLoading: false,
  detailError: null,
  updateLoading: false,
  updateSuccess: false,
  conflictError: null,
};

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (query: ContactListQuery, { rejectWithValue }) => {
    try {
      return await contactsApi.getContacts(query);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || 'Failed to fetch contacts');
    }
  }
);

export const fetchContactById = createAsyncThunk(
  'contacts/fetchContactById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await contactsApi.getContactById(id);
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || 'Failed to fetch contact details');
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, data }: { id: number; data: ContactUpdateInput }, { rejectWithValue }) => {
    try {
      return await contactsApi.updateContact(id, data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const errorData = err.data as Record<string, unknown> | undefined;
        if (err.statusCode === 409) {
          const conflictType = errorData?.error === 'stale_update' ? 'stale_update' : 'email_conflict';
          return rejectWithValue({
            type: conflictType,
            message: err.message,
          } as ConflictError);
        }
        return rejectWithValue({
          type: 'validation',
          message: err.message,
        } as ConflictError);
      }
      return rejectWithValue({
        type: 'unknown',
        message: (err as Error).message || 'Failed to update contact',
      } as ConflictError);
    }
  }
);

export const fetchTags = createAsyncThunk(
  'contacts/fetchTags',
  async (_, { rejectWithValue }) => {
    try {
      return await contactsApi.getTags();
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || 'Failed to fetch tags');
    }
  }
);

export const fetchCompanies = createAsyncThunk(
  'contacts/fetchCompanies',
  async (_, { rejectWithValue }) => {
    try {
      return await contactsApi.getCompanies();
    } catch (err: unknown) {
      return rejectWithValue((err as Error).message || 'Failed to fetch companies');
    }
  }
);

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    clearConflict: (state) => {
      state.conflictError = null;
    },
    clearUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
    resetSelectedContact: (state) => {
      state.selectedContact = null;
      state.detailError = null;
      state.conflictError = null;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // fetchContacts
    builder.addCase(fetchContacts.pending, (state) => {
      state.listLoading = true;
      state.listError = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.listLoading = false;
      state.items = action.payload.data;
      state.pagination = action.payload.pagination;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.listLoading = false;
      state.listError = (action.payload as string) || 'Failed to load contacts';
    });

    // fetchContactById
    builder.addCase(fetchContactById.pending, (state) => {
      state.detailLoading = true;
      state.detailError = null;
      state.conflictError = null;
    });
    builder.addCase(fetchContactById.fulfilled, (state, action) => {
      state.detailLoading = false;
      state.selectedContact = action.payload;
    });
    builder.addCase(fetchContactById.rejected, (state, action) => {
      state.detailLoading = false;
      state.detailError = (action.payload as string) || 'Contact not found';
    });

    // updateContact
    builder.addCase(updateContact.pending, (state) => {
      state.updateLoading = true;
      state.conflictError = null;
      state.updateSuccess = false;
    });
    builder.addCase(updateContact.fulfilled, (state, action) => {
      state.updateLoading = false;
      state.selectedContact = action.payload;
      state.updateSuccess = true;
      state.conflictError = null;

      // Update in items list if present
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    });
    builder.addCase(updateContact.rejected, (state, action) => {
      state.updateLoading = false;
      state.updateSuccess = false;
      state.conflictError = action.payload as ConflictError;
    });

    // fetchTags
    builder.addCase(fetchTags.fulfilled, (state, action: PayloadAction<Tag[]>) => {
      state.availableTags = action.payload;
    });

    // fetchCompanies
    builder.addCase(fetchCompanies.fulfilled, (state, action: PayloadAction<string[]>) => {
      state.availableCompanies = action.payload;
    });
  },
});

export const { clearConflict, clearUpdateSuccess, resetSelectedContact } = contactsSlice.actions;
export default contactsSlice.reducer;
