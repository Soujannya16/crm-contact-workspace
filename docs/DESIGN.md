### Functional Requirements

- Users can view contacts
- Users can view contact details
- Users can update contact information
- Users can search contacts by name, email, or phone (**BE**)
- Users can filter contacts using at least 2 attributes (**BE**)
- Users can sort contacts by name or created date (**BE**)
- Users can browse paginated contacts (**BE**)
- Users can add/remove tags from contacts
- Users can bulk assign tags to contacts (**BE**)
- Users can view contact activity history
  - CONTACT_UPDATED (**BE**)
  - TAG_ADDED (**BE**)
  - TAG_REMOVED (**BE**)

### Non-Functional Requirements

- Ensure email uniqueness (**BE**)
- Persist data across application restarts (**BE**)
- Handle concurrent/stale updates (**BE**)
- Provide seed data
- Automated tests for critical functionality
- Documentation for architecture, data model, and trade-offs
- Source code hosted in GitHub repository

### Core Entities

#### Contact

- id
- firstName
- lastName
- email
- phone
- company
- createdAt
- updatedAt
- version _(for concurrency handling)_

#### Tag

- id
- name

#### Activity

- contactId
- type
  - CONTACT_UPDATED
  - TAG_ADDED
  - TAG_REMOVED
- timestamp

### Relationships

- Contact → Activity (**One-to-Many**)
- Contact ↔ Tag (**Many-to-Many**)

#### ContactTag (Junction Table)

- contactId
- tagId

## APIs :

### 1. View Contacts List

GET /contacts

Supports:

GET /contacts?page=1&limit=20

GET /contacts?search=john

GET /contacts?company=Google&tag=VIP

GET /contacts?sortBy=name&order=asc

Covers:

- View contacts
- Search
- Filter
- Sort
- Pagination

---

### 2. View Contact Details

GET /contacts/{contactId}

---

### 3. Update Contact Information

PUT /contacts/{contactId}

Request:

```
{

  "firstName": "John",

  "lastName": "Doe",

  "email": "[john@example.com](mailto:john@example.com)",

  "phone": "9999999999",

  "company": "Google",

  "version": 3

}
```

Covers:

- Contact update
- Email uniqueness validation
- Concurrency handling

---

### 4. Add Tag to Contact

POST /contacts/{contactId}/tags

```
{

  "tagId": 1

}
```

Also creates:

TAG_ADDED activity

---

### 5. Remove Tag from Contact

DELETE /contacts/{contactId}/tags/{tagId}

Also creates:

TAG_REMOVED activity

---

### 6. Bulk Assign Tags

POST /contacts/tags/bulk

```
{

  "contactIds": [1,2,3],

  "tagId": 5

}
```

---

### 7. View Contact Activity History

GET /contacts/{contactId}/activities

Returns:

```
[

  {

    "type": "CONTACT_UPDATED",

    "timestamp": "2026-11-19T10:00:00Z"

  }

]
```

---

### 8. List Available Tags

(UI usually needs this)

GET /tags

---

## Final API Set

GET    /contacts

GET    /contacts/{id}

PUT    /contacts/{id}

POST   /contacts/{id}/tags

DELETE /contacts/{id}/tags/{tagId}

POST   /contacts/tags/bulk

GET    /contacts/{id}/activities

GET    /tags

That's only **8 endpoints** and satisfies every mandatory requirement in the PDF. The key design choice is collapsing **search, filter, sort, and pagination** into a single `GET /contacts` endpoint instead of creating separate APIs.
