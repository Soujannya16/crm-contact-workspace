# Feature: Activity Management

## Overview

The Activity Management feature provides a per-contact audit trail of significant state changes. Activities are **system-generated** — they are never created directly by the user. Instead, the backend records them automatically as a side-effect of contact updates and tag operations. The frontend reads and displays them in a chronological history view.

---

## Entities

### Activity

| Field | Type | Notes |
|---|---|---|
| `id` | integer | Auto-increment primary key |
| `contactId` | integer | Foreign key → `contacts.id` |
| `type` | enum string | `CONTACT_UPDATED` \| `TAG_ADDED` \| `TAG_REMOVED` |
| `timestamp` | ISO 8601 datetime | Set at insert time (UTC) |

---

## Activity Types

| Type | Trigger |
|---|---|
| `CONTACT_UPDATED` | A successful `PUT /contacts/{id}` (contact fields changed) |
| `TAG_ADDED` | A successful `POST /contacts/{id}/tags` or a new assignment inside `POST /contacts/tags/bulk` |
| `TAG_REMOVED` | A successful `DELETE /contacts/{id}/tags/{tagId}` |

---

## Functional Requirements

| # | Requirement | Layer |
|---|---|---|
| AM-1 | View activity history for a specific contact | BE + FE |
| AM-2 | Record `CONTACT_UPDATED` on a successful contact update | BE |
| AM-3 | Record `TAG_ADDED` on a successful tag addition (single or bulk) | BE |
| AM-4 | Record `TAG_REMOVED` on a successful tag removal | BE |
| AM-5 | Activities are ordered chronologically (newest first) | BE |

---

## Non-Functional Requirements

- Activity records are **immutable** — no update or delete endpoints are exposed.
- Activity inserts must be part of the **same SQLite transaction** as the triggering operation. If the triggering operation is rolled back, no orphan activity record is created.
- Activities must persist across application restarts (SQLite).

---

## API Endpoints

### 1. View Contact Activity History

```
GET /contacts/{contactId}/activities
```

**Success Response — 200 OK**
```json
[
  {
    "id": 10,
    "type": "TAG_ADDED",
    "timestamp": "2026-11-19T10:30:00Z"
  },
  {
    "id": 9,
    "type": "CONTACT_UPDATED",
    "timestamp": "2026-11-19T09:00:00Z"
  },
  {
    "id": 1,
    "type": "CONTACT_UPDATED",
    "timestamp": "2026-01-01T00:00:00Z"
  }
]
```

> [!NOTE]
> Activities are returned newest-first (`ORDER BY timestamp DESC`). The `contactId` is not included in each item because it is implied by the URL.

**Error Responses**
| Status | Condition |
|---|---|
| `404 Not Found` | Contact does not exist |

---

## Database Schema (SQLite)

```sql
CREATE TABLE activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL CHECK (type IN ('CONTACT_UPDATED', 'TAG_ADDED', 'TAG_REMOVED')),
  timestamp  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_activities_contact_id ON activities(contact_id);
```

> [!TIP]
> The index on `contact_id` keeps activity lookups fast as the table grows.

---

## Business Rules

1. **Atomicity** — activity inserts share the transaction of the triggering operation:
   - `PUT /contacts/{id}` → `BEGIN` → update contact → insert `CONTACT_UPDATED` → `COMMIT`
   - `POST /contacts/{id}/tags` → `BEGIN` → insert junction row → insert `TAG_ADDED` → `COMMIT`
   - `DELETE /contacts/{id}/tags/{tagId}` → `BEGIN` → delete junction row → insert `TAG_REMOVED` → `COMMIT`
   - `POST /contacts/tags/bulk` → `BEGIN` → for each new assignment: insert junction row + insert `TAG_ADDED` → `COMMIT`
2. **Immutability** — no `UPDATE` or `DELETE` is ever issued against `activities`. The only write path is `INSERT`.
3. **Cascade delete** — when a contact is deleted (future feature), all its activity rows are automatically removed (`ON DELETE CASCADE`).
4. **No user-facing creation** — there is no `POST /contacts/{id}/activities` endpoint. Activities exist only as audit records.
5. **Ordering** — always return activities `ORDER BY timestamp DESC, id DESC` so ties are broken deterministically.

---

## Frontend Responsibilities

- **Activity History panel / tab** on the contact detail page, consuming `GET /contacts/{id}/activities`.
- Display each activity entry with:
  - A human-readable label for the `type` (e.g. "Contact updated", "Tag added", "Tag removed").
  - A formatted `timestamp` (e.g. relative time "2 hours ago" or absolute locale date-time).
- Refresh the activity list automatically after a successful contact update or tag change on the same page.
- Show an empty-state message when a contact has no recorded activities.

---

## Automated Tests (Critical Paths)

| Test | Scenario |
|---|---|
| Get activities — empty | Returns `[]` for a brand-new contact |
| Get activities — after update | Returns `[{ type: "CONTACT_UPDATED" }]` after a successful `PUT` |
| Get activities — after tag add | Returns `[{ type: "TAG_ADDED" }]` after `POST .../tags` |
| Get activities — after tag remove | Returns `[{ type: "TAG_REMOVED" }]` after `DELETE .../tags/{tagId}` |
| Get activities — ordering | Newest activity is first in the array |
| Atomicity — stale update | No `CONTACT_UPDATED` activity recorded when `PUT` returns `409` |
| Get activities — unknown contact | Returns `404` |
