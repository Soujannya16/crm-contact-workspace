import Database from 'better-sqlite3';
import { ActivityItem, Contact, ContactListQuery, ContactRow, ContactUpdateInput, PaginatedResponse } from '../types';

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Contact not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class StaleUpdateError extends Error {
  statusCode = 409;
  errorCode = 'stale_update';
  constructor(message = 'Contact has been modified by another user. Please reload the latest version.') {
    super(message);
    this.name = 'StaleUpdateError';
  }
}

export class EmailConflictError extends Error {
  statusCode = 409;
  errorCode = 'email_conflict';
  constructor(message = 'Email already in use by another contact') {
    super(message);
    this.name = 'EmailConflictError';
  }
}

function mapRowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || null,
    company: row.company || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  };
}

export class ContactService {
  constructor(private db: Database.Database) {}

  listContacts(query: ContactListQuery): PaginatedResponse<Contact> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      whereConditions.push(`
        (
          c.first_name LIKE ? OR
          c.last_name LIKE ? OR
          (c.first_name || ' ' || c.last_name) LIKE ? OR
          c.email LIKE ? OR
          c.phone LIKE ?
        )
      `);
      params.push(term, term, term, term, term);
    }

    if (query.company && query.company.trim()) {
      whereConditions.push(`LOWER(c.company) = LOWER(?)`);
      params.push(query.company.trim());
    }

    if (query.tag && query.tag.trim()) {
      whereConditions.push(`
        c.id IN (
          SELECT ct2.contact_id
          FROM contact_tags ct2
          JOIN tags t2 ON t2.id = ct2.tag_id
          WHERE LOWER(t2.name) = LOWER(?)
        )
      `);
      params.push(query.tag.trim());
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) as total FROM contacts c ${whereClause}`;
    const countRow = this.db.prepare(countSql).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    let sortClause = 'ORDER BY c.created_at ASC, c.id ASC';
    const orderDir = (query.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    if (query.sortBy === 'name') {
      sortClause = `ORDER BY c.first_name COLLATE NOCASE ${orderDir}, c.last_name COLLATE NOCASE ${orderDir}, c.id ASC`;
    } else if (query.sortBy === 'createdAt') {
      sortClause = `ORDER BY c.created_at ${orderDir}, c.id ASC`;
    }

    const selectSql = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.company,
        c.created_at,
        c.updated_at,
        c.version,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM contacts c
      LEFT JOIN contact_tags ct ON ct.contact_id = c.id
      LEFT JOIN tags t ON t.id = ct.tag_id
      ${whereClause}
      GROUP BY c.id
      ${sortClause}
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(selectSql).all(...params, limit, offset) as ContactRow[];
    const data = rows.map(mapRowToContact);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  getContactById(id: number): Contact | null {
    const sql = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.company,
        c.created_at,
        c.updated_at,
        c.version,
        GROUP_CONCAT(DISTINCT t.name) as tags
      FROM contacts c
      LEFT JOIN contact_tags ct ON ct.contact_id = c.id
      LEFT JOIN tags t ON t.id = ct.tag_id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    const row = this.db.prepare(sql).get(id) as ContactRow | undefined;
    return row ? mapRowToContact(row) : null;
  }

  updateContact(id: number, data: ContactUpdateInput): Contact {
    const updateTx = this.db.transaction(() => {
      const existing = this.db.prepare('SELECT id, version, email FROM contacts WHERE id = ?').get(id) as
        | { id: number; version: number; email: string }
        | undefined;

      if (!existing) {
        throw new NotFoundError(`Contact with ID ${id} not found`);
      }

      if (existing.version !== data.version) {
        throw new StaleUpdateError(
          `Contact version mismatch. Current version is ${existing.version}, but update was submitted with version ${data.version}.`
        );
      }

      const emailConflict = this.db
        .prepare('SELECT id FROM contacts WHERE LOWER(email) = LOWER(?) AND id != ?')
        .get(data.email.trim(), id);

      if (emailConflict) {
        throw new EmailConflictError(`Email '${data.email}' is already in use by another contact.`);
      }

      const now = new Date().toISOString();
      const updateResult = this.db
        .prepare(`
          UPDATE contacts
          SET first_name = ?,
              last_name = ?,
              email = ?,
              phone = ?,
              company = ?,
              version = version + 1,
              updated_at = ?
          WHERE id = ? AND version = ?
        `)
        .run(
          data.firstName.trim(),
          data.lastName.trim(),
          data.email.trim(),
          data.phone ? data.phone.trim() : null,
          data.company ? data.company.trim() : null,
          now,
          id,
          data.version
        );

      if (updateResult.changes === 0) {
        throw new StaleUpdateError('Update conflict: contact was modified concurrently.');
      }

      this.db
        .prepare(`
          INSERT INTO activities (contact_id, type, timestamp)
          VALUES (?, 'CONTACT_UPDATED', ?)
        `)
        .run(id, now);

      const updated = this.getContactById(id);
      if (!updated) {
        throw new NotFoundError('Updated contact could not be retrieved.');
      }

      return updated;
    });

    return updateTx();
  }
}

export class TagAlreadyAssignedError extends Error {
  statusCode = 409;
  errorCode = 'tag_already_assigned';
  constructor(msg = 'Tag is already assigned to this contact') {
    super(msg);
    this.name = 'TagAlreadyAssignedError';
  }
}

export class TagService {
  constructor(private db: Database.Database) {}

  addTag(contactId: number, tagId: number): { contactId: number; tagId: number; tagName: string } {
    return this.db.transaction(() => {
      const contact = this.db.prepare('SELECT id FROM contacts WHERE id = ?').get(contactId);
      if (!contact) throw new NotFoundError(`Contact with ID ${contactId} not found`);

      const tag = this.db
        .prepare('SELECT id, name FROM tags WHERE id = ?')
        .get(tagId) as { id: number; name: string } | undefined;
      if (!tag) throw new NotFoundError(`Tag with ID ${tagId} not found`);

      const result = this.db
        .prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)')
        .run(contactId, tagId);

      if (result.changes === 0) throw new TagAlreadyAssignedError();

      this.db
        .prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'TAG_ADDED', ?)")
        .run(contactId, new Date().toISOString());

      return { contactId, tagId, tagName: tag.name };
    })();
  }

  removeTag(contactId: number, tagId: number): void {
    this.db.transaction(() => {
      const contact = this.db.prepare('SELECT id FROM contacts WHERE id = ?').get(contactId);
      if (!contact) throw new NotFoundError(`Contact with ID ${contactId} not found`);

      const tag = this.db.prepare('SELECT id FROM tags WHERE id = ?').get(tagId);
      if (!tag) throw new NotFoundError(`Tag with ID ${tagId} not found`);

      const result = this.db
        .prepare('DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?')
        .run(contactId, tagId);

      if (result.changes === 0) {
        throw new NotFoundError(`Tag ${tagId} is not assigned to contact ${contactId}`);
      }

      this.db
        .prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'TAG_REMOVED', ?)")
        .run(contactId, new Date().toISOString());
    })();
  }

  bulkAssign(contactIds: number[], tagId: number): { assigned: number; skipped: number } {
    return this.db.transaction(() => {
      const tag = this.db.prepare('SELECT id FROM tags WHERE id = ?').get(tagId);
      if (!tag) throw new NotFoundError(`Tag with ID ${tagId} not found`);

      let assigned = 0;
      let skipped = 0;
      const now = new Date().toISOString();

      for (const contactId of contactIds) {
        const result = this.db
          .prepare('INSERT OR IGNORE INTO contact_tags (contact_id, tag_id) VALUES (?, ?)')
          .run(contactId, tagId);

        if (result.changes === 1) {
          this.db
            .prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'TAG_ADDED', ?)")
            .run(contactId, now);
          assigned++;
        } else {
          skipped++;
        }
      }

      return { assigned, skipped };
    })();
  }
}

export class ActivityService {
  constructor(private db: Database.Database) {}

  getActivitiesByContactId(contactId: number): ActivityItem[] {
    const contact = this.db.prepare('SELECT id FROM contacts WHERE id = ?').get(contactId);
    if (!contact) {
      throw new NotFoundError(`Contact with ID ${contactId} not found`);
    }

    const rows = this.db
      .prepare('SELECT id, type, timestamp FROM activities WHERE contact_id = ? ORDER BY timestamp DESC, id DESC')
      .all(contactId) as ActivityItem[];

    return rows;
  }
}
