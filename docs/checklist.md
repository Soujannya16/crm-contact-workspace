# CRM Contact Workspace — Assignment Requirements & Verification Checklist

This checklist is generated directly from [`docs/assignment.pdf`](docs/assignment.pdf).  
Every requirement has been audited against the repository implementation.

---

## Summary Legend
- **`[x] Verified in Code`**: Implemented in frontend/backend and verified via automated tests or code inspection.
- **`[!] Action Needed`**: Required by the assignment specification but not yet completed in the repository.
- **`[ ] Manual Verification`**: Requires live manual interaction (e.g., visual UX verification in a running browser) or user-specific action (e.g., pushing to GitHub, documenting personal AI usage).

---

## 1. Contact Management

| Requirement | Assignment Spec | Implementation & Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Contact Data Model** | First Name, Last Name, Email, Phone, Company, Tags, Created Date, Updated Date | • Database table: `contacts` in [`backend/src/db/database.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/db/database.ts#L39-L49)<br>• Junction table `contact_tags` & `tags`<br>• TypeScript interfaces: [`backend/src/types/index.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/types/index.ts) and [`frontend/src/types/contact.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/types/contact.ts)<br>• All 8 fields present and rendered in table & detail views. | `[x] Verified in Code` |
| **Browse & View Contacts** | Users should be able to browse and view contacts in a table/list | • UI: [`frontend/src/components/ContactList/ContactTable.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactTable.tsx)<br>• API: `GET /contacts`<br>• Test: `tests/contacts.test.ts` (returns paginated contacts list). | `[x] Verified in Code` |
| **Search by Name, Email, or Phone** | Search across first name, last name, full name, email, or phone; handled by backend | • SQL query in [`backend/src/services/contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L56-L68): `c.first_name LIKE ? OR c.last_name LIKE ? OR (c.first_name \|\| ' ' \|\| c.last_name) LIKE ? OR c.email LIKE ? OR c.phone LIKE ?`<br>• Frontend debounced search bar with clear button in [`ContactFilters.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactFilters.tsx#L63-L85)<br>• Test: `tests/contacts.test.ts` ("searches contacts by name, email, or phone (?search=john)"). | `[x] Verified in Code` |
| **Filter Using At Least Two Attributes** | Multi-attribute filtering handled by backend | • Filter 1: `company` (exact case-insensitive match on `contacts.company`)<br>• Filter 2: `tag` (subquery filter via `contact_tags` and `tags`)<br>• Implemented in [`backend/src/services/contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L70-L85) and dropdowns in [`ContactFilters.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactFilters.tsx#L87-L119)<br>• Dynamic company endpoint: `GET /contacts/meta/companies`<br>• Tests: `tests/contacts.test.ts` ("filters contacts by company", "filters contacts by tag"). | `[x] Verified in Code` |
| **Sort by Name and Created Date** | Sort contacts by name or created date (ascending/descending) on backend | • Implemented in [`backend/src/services/contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L94-L101): `sortBy=name` (alphabetical NOCASE) and `sortBy=createdAt`<br>• UI dropdown in [`ContactFilters.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactFilters.tsx#L121-L134)<br>• Tests: `tests/contacts.test.ts` ("sorts contacts alphabetically by name", "sorts contacts by createdAt descending"). | `[x] Verified in Code` |
| **Navigate Paginated Results** | Pagination handled by backend; scale-ready for large datasets | • SQL `LIMIT ? OFFSET ?` with `COUNT(*)` in [`backend/src/services/contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L89-L124)<br>• UI: [`Pagination.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/Pagination.tsx) with page number buttons, prev/next, and limit selector (10, 20, 50)<br>• Tests: `tests/contacts.test.ts` ("returns paginated results with correct total and default limit 20", "supports custom pagination page and limit"). | `[x] Verified in Code` |
| **View Individual Contact** | View full details of a single contact | • Route: `/contacts/:id` in [`frontend/src/App.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/App.tsx#L33)<br>• Component: [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx)<br>• API: `GET /contacts/:id`<br>• Test: `tests/contacts.test.ts` ("returns full contact with tags for valid ID"). | `[x] Verified in Code` |
| **Update Contact Information** | Edit contact fields with persistence and validation | • API: `PUT /contacts/:id` with Zod validation in [`backend/src/routes/contacts.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/routes/contacts.ts#L174-L211)<br>• Frontend form: [`ContactEditForm`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L63-L248) with live input validation and save button<br>• Test: `tests/contacts.test.ts` ("successfully updates contact, increments version, and writes activity"). | `[x] Verified in Code` |

---

## 2. Tag Management

| Requirement | Assignment Spec | Implementation & Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Multiple Tags per Contact** | Contacts can hold multiple tags (e.g. Lead, Customer, VIP, Prospect) | • Schema: `tags` table and `contact_tags` junction table with foreign keys and cascade delete in [`database.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/db/database.ts#L51-L60).<br>• Contacts seed data contains contacts with multiple tags. | `[x] Verified in Code` |
| **View Assigned Tags** | Display tag badges on contacts | • Rendered in [`ContactTable.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactTable.tsx) and [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L273-L296) with custom tag badges. | `[x] Verified in Code` |
| **Add a Tag** | Add a tag to an individual contact | • API: `POST /contacts/:id/tags`<br>• Service: `TagService.addTag` in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L244-L266)<br>• UI: Dropdown selector in [`TagSelector`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L298-L319)<br>• Test: `tests/tags.test.ts` ("201, inserts junction row and TAG_ADDED activity"). | `[x] Verified in Code` |
| **Remove a Tag** | Remove a tag from an individual contact | • API: `DELETE /contacts/:id/tags/:tagId`<br>• Service: `TagService.removeTag` in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L268-L288)<br>• UI: Remove button (`×`) on tag chips in [`TagSelector`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L279-L290)<br>• Test: `tests/tags.test.ts` ("204, removes junction row and inserts TAG_REMOVED activity"). | `[x] Verified in Code` |
| **Bulk Tag Assignment** | Select multiple contacts and assign a tag in bulk | • API: `POST /contacts/tags/bulk` with `{ contactIds, tagId }`<br>• Service: `TagService.bulkAssign` executes inside a SQLite transaction, returning `{ assigned, skipped }` in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L290-L316)<br>• UI: Row checkboxes, "Select All", and floating bulk toolbar in [`ContactListPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactListPage.tsx#L140-L169)<br>• Tests: `tests/tags.test.ts` ("assigns tag to all contacts", "skips already-assigned contacts"). | `[x] Verified in Code` |
| **Persistence of Tag Changes** | All tag operations must persist to the database | • Verified through SQLite transactions writing to `contact_tags` table. | `[x] Verified in Code` |

---

## 3. Data Integrity & Concurrency

| Requirement | Assignment Spec | Implementation & Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Email Uniqueness** | Email must be unique when present. Updating cannot result in duplicate emails. | • Database constraint: `email TEXT NOT NULL UNIQUE` in schema.<br>• Service check: `SELECT id FROM contacts WHERE LOWER(email) = LOWER(?) AND id != ?` throws `EmailConflictError` (HTTP 409) in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L177-L183).<br>• Frontend handles `email_conflict` and shows dedicated warning banner.<br>• Test: `tests/contacts.test.ts` ("returns 409 Conflict when email belongs to another contact"). | `[x] Verified in Code` |
| **Concurrent Updates Handling** | Scenario: User A and User B open contact. User B saves. User A submits stale information later. Accidental overwrites must be detected/prevented. | • Optimistic Concurrency Control using integer `version` field.<br>• Backend SQL: `UPDATE contacts SET ... version = version + 1 WHERE id = ? AND version = ?`.<br>• If `existing.version !== data.version` or `changes === 0`, throws `StaleUpdateError` (HTTP 409 `stale_update`) in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L171-L175).<br>• Frontend displays prominent "Update Conflict Detected" alert banner with "Reload Latest Version" action button in [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L462-L482).<br>• Tests: `tests/contacts.test.ts` ("returns 409 Conflict with stale_update when version is behind"), `tests/activities.test.ts` ("no CONTACT_UPDATED activity recorded when PUT returns 409"). | `[x] Verified in Code` |
| **Input Validation** | Reject invalid input on backend and frontend | • Backend: Zod schemas in [`routes/contacts.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/routes/contacts.ts#L7-L23) checking empty strings, email formatting, numeric types.<br>• Frontend: Form validation for required first name, last name, valid email structure.<br>• Test: `tests/contacts.test.ts` ("returns 400 for validation failures"). | `[x] Verified in Code` |
| **Data Survives Restarts** | Persistent database storage across application restarts | • SQLite database stored at `backend/data/crm.db` with WAL mode enabled.<br>• Re-instantiated via `getDatabase()` without re-seeding if data exists. | `[x] Verified in Code` |

---

## 4. Contact Activity History

| Requirement | Assignment Spec | Implementation & Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Track CONTACT_UPDATED** | Record activity whenever contact details are successfully updated | • Inserted atomically into `activities` table in `updateContact` transaction in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L214-L218).<br>• Test: `tests/activities.test.ts` ("returns CONTACT_UPDATED after a successful PUT"). | `[x] Verified in Code` |
| **Track TAG_ADDED** | Record activity when a tag is added (individual or bulk) | • Inserted in `addTag` and `bulkAssign` transactions in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L260-L263, #L305-L308).<br>• Test: `tests/activities.test.ts` ("returns TAG_ADDED after POST /contacts/:id/tags"). | `[x] Verified in Code` |
| **Track TAG_REMOVED** | Record activity when a tag is removed from contact | • Inserted in `removeTag` transaction in [`contactService.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/services/contactService.ts#L284-L286).<br>• Test: `tests/activities.test.ts` ("returns TAG_REMOVED after DELETE /contacts/:id/tags/:tagId"). | `[x] Verified in Code` |
| **Activity Payload** | Must include Contact ID and Timestamp | • Schema: `activities (id, contact_id, type, timestamp)` in [`database.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/db/database.ts#L62-L67).<br>• API returns `id`, `type`, `timestamp`. | `[x] Verified in Code` |
| **View Recent Activity** | Users should be able to view recent activity for a contact in the UI | • API: `GET /contacts/:id/activities`<br>• Component: [`ActivityHistory.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ActivityHistory.tsx) renders a timeline with color-coded icons, relative and absolute timestamps, and count badge. | `[x] Verified in Code` |

---

## 5. Frontend State Handling

| State | Assignment Spec Requirement | Implementation & Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Loading State** | Provide feedback while data is loading | • Skeleton table rows in [`ContactTable.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactTable.tsx#L63-L95)<br>• Skeleton cards in [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L410-L421)<br>• Skeleton list in [`ActivityHistory.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ActivityHistory.tsx#L98-L100)<br>• Disabled button text states ("Saving Changes...", "Assigning...", "Saving..."). | `[x] Verified in Code` |
| **No Results State** | Clear empty state when search/filter returns no items | • Empty state container in [`ContactTable.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactTable.tsx#L99-L115) showing "No contacts found" with "Reset Filters" CTA button. | `[x] Verified in Code` |
| **Invalid Input** | Form feedback on invalid or missing fields | • Field-level red outline and error labels under `firstName`, `lastName`, and `email` in [`ContactEditForm`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L143, #L163, #L187). | `[x] Verified in Code` |
| **Backend / Update Failures** | Clear error messaging when API calls fail | • Error alert banners in [`ContactTable.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactList/ContactTable.tsx#L52-L61), [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L423-L439), and retry button in [`ActivityHistory.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ActivityHistory.tsx#L103-L112). | `[x] Verified in Code` |
| **Conflicting Updates** | Specific UI handling for concurrency conflict (stale data) | • Amber warning banner in [`ContactDetailPage.tsx`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/frontend/src/components/ContactDetail/ContactDetailPage.tsx#L462-L482) explaining the conflict with a one-click "Reload Latest Version" button. | `[x] Verified in Code` |

---

## 6. Testing & Seed Data

| Item | Requirement | Verification Details | Status |
| :--- | :--- | :--- | :---: |
| **Automated Tests** | Add tests for areas considered most important or highest risk | • 31 automated Vitest tests across 3 suites:<br>  1. `backend/tests/contacts.test.ts` (15 tests: search, filter, sort, pagination, detail, update, stale 409, email conflict 409, 400 validation)<br>  2. `backend/tests/tags.test.ts` (8 tests: list tags, add tag, remove tag, bulk assign, duplicate tag 409, rollback)<br>  3. `backend/tests/activities.test.ts` (8 tests: activity creation on update/tag add/tag remove, chronological ordering, atomicity on conflict).<br>• Execution result: **31 passed, 0 failed**. | `[x] Verified in Code` |
| **Frontend Code Quality** | Type safety and linting | • ESLint check: `npm run lint` passes with 0 errors.<br>• TypeScript build: `npm run build` (`tsc -b && vite build`) compiles cleanly. | `[x] Verified in Code` |
| **Seed Data** | Enough seed data to demonstrate search, filtering, pagination, sorting, tags, updates | • [`backend/src/db/seed.ts`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/backend/src/db/seed.ts) contains 15 contacts with varying companies (Google, Microsoft, Apple, Amazon, Meta, Stripe, Netflix), tags (VIP, Customer, Partner, Lead, Prospect), phone numbers, created dates, and initial activity logs.<br>• Verified via `npm run seed`. | `[x] Verified in Code` |

---

## 7. Documentation & Submission Deliverables

| Requirement | Assignment Spec | Current Status & Action Required | Status |
| :--- | :--- | :--- | :---: |
| **Root `README.md`** | Push code to GitHub and include a concise `README.md` covering all mandatory sections | • Root [`README.md`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/README.md) created.<br>• Covers: Setup, Tech stack, Technical decisions, Data model, Concurrent updates, Known issues. | `[x] Verified in Code` |
| **Scale Considerations Section** | Briefly explain production changes for:<br>• Millions of contacts per large account<br>• Millions of contact updates per day<br>• Frequent searches and filters<br>• Many simultaneous users | • Fully addressed in [`docs/ARCHITECTURE.md#scale-considerations`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/docs/ARCHITECTURE.md#scale-considerations) and [`docs/DESIGN.md#scale-considerations`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/docs/DESIGN.md#scale-considerations) (covering indexing, cursor pagination, search engine, Kafka events, partitioning, read replicas). | `[x] Verified in Code` |
| **AI Usage Disclosure Section** | If AI tools were used, briefly mention:<br>• Which tool you used<br>• What you used it for<br>• One AI-generated suggestion you changed or rejected | • Documented in [`README.md#ai-usage-disclosure`](file:///c:/Users/souja/Desktop/VScodeRepo/crm-contact-workspace/README.md#ai-usage-disclosure). | `[x] Verified in Code` |
| **Push Code to GitHub** | Code hosted on public/private GitHub repository as requested | • Git push to remote repository by the user. | `[ ] Manual Verification` |
| **End-to-End Live Browser Smoke Test** | Open `http://localhost:5173` and click through search, filter, bulk tags, and conflict simulation | • Manual verification in browser by the user. | `[ ] Manual Verification` |

---

## Verification Summary Table

| Category | Total Requirements | Verified in Code | Action Needed | Manual User Verification |
| :--- | :---: | :---: | :---: | :---: |
| **1. Contact Management** | 8 | 8 | 0 | 0 |
| **2. Tag Management** | 6 | 6 | 0 | 0 |
| **3. Data Integrity & Concurrency** | 4 | 4 | 0 | 0 |
| **4. Contact Activity History** | 5 | 5 | 0 | 0 |
| **5. Frontend State Handling** | 5 | 5 | 0 | 0 |
| **6. Testing & Seed Data** | 3 | 3 | 0 | 0 |
| **7. Submission & Documentation** | 5 | 3 | 0 | 2 |
| **TOTAL** | **31** | **29** | **0** | **2** |
