# Feature: Tag Management

## Overview

The Tag Management feature covers creating tags, listing all available tags, adding a tag to a contact, removing a tag from a contact, and bulk-assigning a tag to multiple contacts at once. Tags provide a flexible labelling mechanism on top of the **Contact** entity using a many-to-many relationship.

---

## Entities

### Tag

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Auto-increment primary key |
| `name` | string | Required, unique |

### ContactTag (Junction)

| Field | Type | Notes |
|---|---|---|
| `contactId` | integer | Foreign key → `contacts.id` |
| `tagId` | integer | Foreign key → `tags.id` |

The combination `(contactId, tagId)` is the composite primary key (no duplicates).

---

## Functional Requirements

| # | Requirement | Layer |
|---|---|---|
| TM-1 | List all available tags | BE + FE |
| TM-2 | Add a tag to a single contact | BE + FE |
| TM-3 | Remove a tag from a single contact | BE + FE |
| TM-4 | Bulk assign one tag to multiple contacts | BE + FE |
| TM-5 | Record `TAG_ADDED` activity when a tag is added | BE |
| TM-6 | Record `TAG_REMOVED` activity when a tag is removed | BE |

---

## Non-Functional Requirements

- A contact cannot have the same tag twice (`UNIQUE` on `(contact_id, tag_id)`).
- Adding a tag that is already present must be a no-op or return a clear error (idempotent preferred).
- Bulk assignment must be atomic: either all contacts get the tag or none do (single transaction).
- Activity records for tag operations must be written in the same transaction as the junction-table change.

---

## API Endpoints

### 1. List Available Tags

```
GET /tags
```

**Success Response — 200 OK**
```json
[
  { "id": 1, "name": "VIP" },
  { "id": 2, "name": "Partner" },
  { "id": 3, "name": "Lead" }
]
```

---

### 2. Add Tag to Contact

```
POST /contacts/{contactId}/tags
```

**Request Body**
```json
{
  "tagId": 1
}
```

**Success Response — 201 Created**
```json
{
  "contactId": 42,
  "tagId": 1,
  "tagName": "VIP"
}
```

**Side-effect** — inserts a `TAG_ADDED` activity record for the contact (same transaction).

**Error Responses**
| Status | Condition |
|---|---|
| `404 Not Found` | Contact or tag does not exist |
| `409 Conflict` | Tag is already assigned to this contact |

---

### 3. Remove Tag from Contact

```
DELETE /contacts/{contactId}/tags/{tagId}
```

**Success Response — 204 No Content**

**Side-effect** — inserts a `TAG_REMOVED` activity record for the contact (same transaction).

**Error Responses**
| Status | Condition |
|---|---|
| `404 Not Found` | Contact or tag does not exist, or tag is not assigned to this contact |

---

### 4. Bulk Assign Tag to Contacts

```
POST /contacts/tags/bulk
```

**Request Body**
```json
{
  "contactIds": [1, 2, 3],
  "tagId": 5
}
```

> [!IMPORTANT]
> The entire operation runs inside a single SQLite transaction. If any insert fails (e.g. unknown contactId), the transaction is rolled back.

**Success Response — 200 OK**
```json
{
  "assigned": 3,
  "skipped": 0
}
```

`skipped` counts contacts that already had the tag (idempotent; not an error).

**Side-effect** — inserts one `TAG_ADDED` activity per contact that did not already have the tag.

**Error Responses**
| Status | Condition |
|---|---|
| `400 Bad Request` | `contactIds` is empty or `tagId` is missing |
| `404 Not Found` | Tag does not exist |

---

## Database Schema (SQLite)

```sql
CREATE TABLE tags (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT    NOT NULL UNIQUE
);

CREATE TABLE contact_tags (
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id     INTEGER NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);
```

---

## Business Rules

1. **No duplicate tag assignment** — the composite primary key on `contact_tags` prevents duplicates at the DB level. The backend should catch the constraint violation and return `409`.
2. **Cascade deletes** — if a contact is deleted, all its `contact_tags` rows are removed automatically (`ON DELETE CASCADE`). Same for a deleted tag.
3. **Bulk idempotency** — use `INSERT OR IGNORE` (SQLite) for each `(contactId, tagId)` pair so pre-existing assignments are silently skipped and counted in `skipped`.
4. **Activity atomicity** — `TAG_ADDED` / `TAG_REMOVED` activity inserts share the same transaction as the junction-table change.
5. **Tag name uniqueness** — enforced by a `UNIQUE` constraint on `tags.name`. Return `409` if the UI ever allows tag creation with a duplicate name.

---

## Seed Data

The backend must seed at least **5 tags** (e.g. `VIP`, `Partner`, `Lead`, `Customer`, `Prospect`) and assign them to contacts in various combinations.

---

## Frontend Responsibilities

- **Tag selector** on the contact detail page — shows currently assigned tags and allows adding / removing individual tags using the `GET /tags` list.
- **Bulk-assign control** on the contact list page — allows selecting multiple contacts (via checkboxes) and assigning a tag in one action via `POST /contacts/tags/bulk`.
- Display feedback for `409` (already assigned) and `404` (tag/contact not found) errors.

---

## Automated Tests (Critical Paths)

| Test | Scenario |
|---|---|
| List tags | Returns all seeded tags |
| Add tag — success | Returns `201`, inserts junction row, inserts `TAG_ADDED` activity |
| Add tag — duplicate | Returns `409` without inserting a duplicate activity |
| Remove tag — success | Returns `204`, removes junction row, inserts `TAG_REMOVED` activity |
| Remove tag — not assigned | Returns `404` |
| Bulk assign — success | Assigns tag to all contacts, returns correct `assigned` count |
| Bulk assign — partial skip | Skips already-assigned contacts, returns correct `skipped` count |
| Bulk assign — unknown tag | Returns `404`, rolls back transaction |
