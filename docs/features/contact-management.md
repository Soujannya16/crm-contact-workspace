# Feature: Contact Management

## Overview

The Contact Management feature covers viewing, searching, filtering, sorting, paginating, and updating contacts. It is the core feature of the CRM and maps to the **Contact** entity in the data model.

---

## Entities

### Contact

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Auto-increment primary key |
| `firstName` | string | Required |
| `lastName` | string | Required |
| `email` | string | Required, unique |
| `phone` | string | Optional |
| `company` | string | Optional |
| `createdAt` | ISO 8601 datetime | Set on insert |
| `updatedAt` | ISO 8601 datetime | Updated on every write |
| `version` | integer | Starts at 1; incremented on every update (optimistic concurrency) |

---

## Functional Requirements

| # | Requirement | Layer |
|---|---|---|
| CM-1 | View paginated contact list | BE + FE |
| CM-2 | Search contacts by name, email, or phone | BE |
| CM-3 | Filter contacts by at least 2 attributes (e.g. `company`, `tag`) | BE |
| CM-4 | Sort contacts by `name` or `createdAt` | BE |
| CM-5 | View full contact details (single contact) | BE + FE |
| CM-6 | Update contact information | BE + FE |
| CM-7 | Enforce email uniqueness | BE |
| CM-8 | Handle concurrent / stale updates via `version` field | BE |

---

## Non-Functional Requirements

- Data must persist across application restarts (SQLite).
- A stale update (client `version` ≠ stored `version`) must return **HTTP 409 Conflict**.
- Email uniqueness must be enforced at the database level (UNIQUE constraint) and surfaced as **HTTP 409 Conflict**.

---

## API Endpoints

### 1. List / Search / Filter / Sort / Paginate Contacts

```
GET /contacts
```

**Query Parameters**

| Param | Type | Description |
|---|---|---|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Page size (default: 20) |
| `search` | string | Full-text search across `firstName`, `lastName`, `email`, `phone` |
| `company` | string | Filter by company name |
| `tag` | string | Filter by tag name |
| `sortBy` | `name` \| `createdAt` | Field to sort by (default: `createdAt`) |
| `order` | `asc` \| `desc` | Sort direction (default: `asc`) |

**Example Requests**
```
GET /contacts?page=1&limit=20
GET /contacts?search=john
GET /contacts?company=Google&tag=VIP
GET /contacts?sortBy=name&order=asc
```

**Success Response — 200 OK**
```json
{
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "9999999999",
      "company": "Google",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z",
      "version": 1,
      "tags": ["VIP", "Partner"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### 2. View Contact Details

```
GET /contacts/{contactId}
```

**Success Response — 200 OK**
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9999999999",
  "company": "Google",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-06-15T12:30:00Z",
  "version": 3,
  "tags": ["VIP", "Partner"]
}
```

**Error Responses**
- `404 Not Found` — contact does not exist

---

### 3. Update Contact Information

```
PUT /contacts/{contactId}
```

**Request Body**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9999999999",
  "company": "Google",
  "version": 3
}
```

> [!IMPORTANT]
> The client must always send the current `version` value it last read. The backend increments `version` on a successful update and records a `CONTACT_UPDATED` activity.

**Success Response — 200 OK** — returns updated contact (same shape as GET detail).

**Error Responses**
| Status | Condition |
|---|---|
| `400 Bad Request` | Missing required fields or invalid format |
| `404 Not Found` | Contact does not exist |
| `409 Conflict` | Email already in use by another contact, **or** `version` mismatch (stale update) |

---

## Database Schema (SQLite)

```sql
CREATE TABLE contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT    NOT NULL,
  last_name  TEXT    NOT NULL,
  email      TEXT    NOT NULL UNIQUE,
  phone      TEXT,
  company    TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  version    INTEGER NOT NULL DEFAULT 1
);
```

> [!NOTE]
> Column names use `snake_case` in SQLite. The backend maps them to `camelCase` before returning JSON responses.

---

## Business Rules

1. **Email uniqueness** — enforced by a `UNIQUE` constraint on `contacts.email`. Return `409` when violated.
2. **Optimistic concurrency** — on `PUT /contacts/{id}`, execute:
   ```sql
   UPDATE contacts
   SET first_name = ?, ..., version = version + 1, updated_at = datetime('now')
   WHERE id = ? AND version = ?
   ```
   If `rowsAffected === 0`, return `409 Conflict` with `{ "error": "stale_update" }`.
3. **Activity side-effect** — every successful `PUT` must insert one `CONTACT_UPDATED` activity record inside the same SQLite transaction.
4. **Search** runs in SQL using `LIKE '%term%'` across `first_name`, `last_name`, `email`, `phone`.
5. **Filter** by `company` uses an exact match; filter by `tag` joins through `contact_tags` → `tags`.
6. **Sort** maps `name` → `first_name, last_name` and `createdAt` → `created_at`.
7. **Pagination** is implemented with `LIMIT` and `OFFSET` in SQL. Total count is a separate `SELECT COUNT(*)` with the same filters applied.

---

## Seed Data

The backend must ship with seed data covering at least **10 contacts** spread across multiple companies and tag combinations so that search, filter, sort, and pagination can be exercised immediately.

---

## Frontend Responsibilities

- Contact list page with search input, filter controls (company, tag), sort controls, and pagination UI.
- Contact detail / edit page with a form pre-populated from the GET detail response.
- On submit, send `version` from the last-read response; handle `409` by showing a "someone else updated this contact — please refresh" message.
- Display tags on both the list and detail views (read-only here; tag changes are covered by the Tag Management feature).

---

## Automated Tests (Critical Paths)

| Test | Scenario |
|---|---|
| List contacts | Returns paginated results with correct `total` |
| Search | `?search=john` returns only matching contacts |
| Filter | `?company=Google` returns only Google contacts |
| Sort | `?sortBy=name&order=asc` returns alphabetically sorted results |
| Get detail | Returns full contact with tags |
| Update — success | Increments `version`, records `CONTACT_UPDATED` activity |
| Update — stale | Returns `409` when `version` is behind |
| Update — duplicate email | Returns `409` when email belongs to another contact |
