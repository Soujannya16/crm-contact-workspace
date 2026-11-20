import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { contactsApi, ApiError } from '../api/contactsApi';
import type { Activity, Contact, ContactListQuery, ContactUpdateInput, ConflictError, Pagination, Tag } from '../types/contact';

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
  tagLoading: boolean;
  tagError: string | null;
  bulkAssignLoading: boolean;
  bulkAssignResult: { assigned: number; skipped: number } | null;
  selectedContactIds: number[];
  activities: Activity[];
  activitiesLoading: boolean;
  activitiesError: string | null;
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
  tagLoading: false,
  tagError: null,
  bulkAssignLoading: false,
  bulkAssignResult: null,
  selectedContactIds: [],
  activities: [],
  activitiesLoading: false,
  activitiesError: null,
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

export const addTagToContact = createAsyncThunk(
  'contacts/addTagToContact',
  async ({ contactId, tagId }: { contactId: number; tagId: number }, { rejectWithValue }) => {
    try {
      return await contactsApi.addTagToContact(contactId, tagId);
    } catch (err) {
      return rejectWithValue((err as Error).message || 'Failed to add tag');
    }
  }
);

export const removeTagFromContact = createAsyncThunk(
  'contacts/removeTagFromContact',
  async ({ contactId, tagId, tagName }: { contactId: number; tagId: number; tagName: string }, { rejectWithValue }) => {
    try {
      await contactsApi.removeTagFromContact(contactId, tagId);
      return { contactId, tagId, tagName };
    } catch (err) {
      return rejectWithValue((err as Error).message || 'Failed to remove tag');
    }
  }
);

export const bulkAssignTag = createAsyncThunk(
  'contacts/bulkAssignTag',
  async ({ contactIds, tagId }: { contactIds: number[]; tagId: number }, { rejectWithValue }) => {
    try {
      return await contactsApi.bulkAssignTag(contactIds, tagId);
    } catch (err) {
      return rejectWithValue((err as Error).message || 'Failed to bulk assign tag');
    }
  }
);

export const fetchActivities = createAsyncThunk(
  'contacts/fetchActivities',
  async (contactId: number, { rejectWithValue }) => {
    try {
      return await contactsApi.getActivities(contactId);
    } catch (err) {
      return rejectWithValue((err as Error).message || 'Failed to fetch activities');
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
      state.activities = [];
      state.activitiesLoading = false;
      state.activitiesError = null;
    },
    toggleContactSelection(state, action: PayloadAction<number>) {
      const id = action.payload;
      const idx = state.selectedContactIds.indexOf(id);
      if (idx === -1) state.selectedContactIds.push(id);
      else state.selectedContactIds.splice(idx, 1);
    },
    selectAllContacts(state, action: PayloadAction<number[]>) {
      state.selectedContactIds = action.payload;
    },
    clearContactSelection(state) {
      state.selectedContactIds = [];
    },
    clearTagError(state) {
      state.tagError = null;
    },
    clearBulkResult(state) {
      state.bulkAssignResult = null;
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

    // addTagToContact
    builder.addCase(addTagToContact.pending, (state) => { state.tagLoading = true; state.tagError = null; });
    builder.addCase(addTagToContact.fulfilled, (state, action) => {
      state.tagLoading = false;
      const { tagName } = action.payload;
      if (state.selectedContact && !state.selectedContact.tags.includes(tagName)) {
        state.selectedContact.tags = [...state.selectedContact.tags, tagName];
      }
    });
    builder.addCase(addTagToContact.rejected, (state, action) => {
      state.tagLoading = false;
      state.tagError = (action.payload as string) || 'Failed to add tag';
    });

    // removeTagFromContact
    builder.addCase(removeTagFromContact.pending, (state) => { state.tagLoading = true; state.tagError = null; });
    builder.addCase(removeTagFromContact.fulfilled, (state, action) => {
      state.tagLoading = false;
      const { tagName } = action.payload;
      if (state.selectedContact) {
        state.selectedContact.tags = state.selectedContact.tags.filter(t => t !== tagName);
      }
    });
    builder.addCase(removeTagFromContact.rejected, (state, action) => {
      state.tagLoading = false;
      state.tagError = (action.payload as string) || 'Failed to remove tag';
    });

    // bulkAssignTag
    builder.addCase(bulkAssignTag.pending, (state) => { state.bulkAssignLoading = true; });
    builder.addCase(bulkAssignTag.fulfilled, (state, action) => {
      state.bulkAssignLoading = false;
      state.bulkAssignResult = action.payload;
      state.selectedContactIds = [];
    });
    builder.addCase(bulkAssignTag.rejected, (state, action) => {
      state.bulkAssignLoading = false;
      state.tagError = (action.payload as string) || 'Failed to bulk assign';
    });

    // fetchActivities
    builder.addCase(fetchActivities.pending, (state) => {
      state.activitiesLoading = true;
      state.activitiesError = null;
    });
    builder.addCase(fetchActivities.fulfilled, (state, action: PayloadAction<Activity[]>) => {
      state.activitiesLoading = false;
      state.activities = action.payload;
    });
    builder.addCase(fetchActivities.rejected, (state, action) => {
      state.activitiesLoading = false;
      state.activitiesError = (action.payload as string) || 'Failed to load activities';
    });
  },
});

export const { clearConflict, clearUpdateSuccess, resetSelectedContact, toggleContactSelection, selectAllContacts, clearContactSelection, clearTagError, clearBulkResult } = contactsSlice.actions;
export default contactsSlice.reducer;
