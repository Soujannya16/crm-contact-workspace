import Database from 'better-sqlite3';
import { getDatabase } from './database';

export function seedDatabase(db: Database.Database): void {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };
  if (countRow && countRow.count > 0) {
    return;
  }

  const tags = ['VIP', 'Partner', 'Lead', 'Customer', 'Prospect'];
  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  for (const tag of tags) {
    insertTag.run(tag);
  }

  const tagRows = db.prepare('SELECT id, name FROM tags').all() as { id: number; name: string }[];
  const tagMap = new Map<string, number>(tagRows.map(t => [t.name, t.id]));

  const contacts = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@google.com',
      phone: '+1-555-0101',
      company: 'Google',
      createdAt: '2026-01-10T08:30:00Z',
      tags: ['VIP', 'Customer'],
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@google.com',
      phone: '+1-555-0102',
      company: 'Google',
      createdAt: '2026-01-12T09:15:00Z',
      tags: ['Partner'],
    },
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'mjohnson@microsoft.com',
      phone: '+1-555-0103',
      company: 'Microsoft',
      createdAt: '2026-01-15T11:00:00Z',
      tags: ['Lead', 'Prospect'],
    },
    {
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.d@apple.com',
      phone: '+1-555-0104',
      company: 'Apple',
      createdAt: '2026-01-18T14:20:00Z',
      tags: ['VIP', 'Partner'],
    },
    {
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.w@amazon.com',
      phone: '+1-555-0105',
      company: 'Amazon',
      createdAt: '2026-01-20T16:45:00Z',
      tags: ['Customer'],
    },
    {
      firstName: 'Sarah',
      lastName: 'Brown',
      email: 'sbrown@meta.com',
      phone: '+1-555-0106',
      company: 'Meta',
      createdAt: '2026-01-25T10:00:00Z',
      tags: ['Lead'],
    },
    {
      firstName: 'Robert',
      lastName: 'Taylor',
      email: 'robert.t@stripe.com',
      phone: '+1-555-0107',
      company: 'Stripe',
      createdAt: '2026-02-01T13:10:00Z',
      tags: ['VIP', 'Customer', 'Partner'],
    },
    {
      firstName: 'Jessica',
      lastName: 'Anderson',
      email: 'jessica.a@netflix.com',
      phone: '+1-555-0108',
      company: 'Netflix',
      createdAt: '2026-02-05T15:30:00Z',
      tags: ['Prospect'],
    },
    {
      firstName: 'William',
      lastName: 'Thomas',
      email: 'wthomas@google.com',
      phone: '+1-555-0109',
      company: 'Google',
      createdAt: '2026-02-10T12:00:00Z',
      tags: ['Customer'],
    },
    {
      firstName: 'Olivia',
      lastName: 'Jackson',
      email: 'olivia.j@microsoft.com',
      phone: '+1-555-0110',
      company: 'Microsoft',
      createdAt: '2026-02-15T09:40:00Z',
      tags: ['VIP', 'Lead'],
    },
    {
      firstName: 'James',
      lastName: 'White',
      email: 'james.white@apple.com',
      phone: '+1-555-0111',
      company: 'Apple',
      createdAt: '2026-02-20T14:15:00Z',
      tags: ['Partner'],
    },
    {
      firstName: 'Sophia',
      lastName: 'Harris',
      email: 'sophia.h@amazon.com',
      phone: '+1-555-0112',
      company: 'Amazon',
      createdAt: '2026-02-25T11:25:00Z',
      tags: ['Customer', 'Lead'],
    },
    {
      firstName: 'Benjamin',
      lastName: 'Martin',
      email: 'bmartin@meta.com',
      phone: '+1-555-0113',
      company: 'Meta',
      createdAt: '2026-03-01T10:50:00Z',
      tags: ['VIP'],
    },
    {
      firstName: 'Ava',
      lastName: 'Thompson',
      email: 'ava.t@stripe.com',
      phone: '+1-555-0114',
      company: 'Stripe',
      createdAt: '2026-03-05T16:00:00Z',
      tags: ['Partner', 'Customer'],
    },
    {
      firstName: 'Lucas',
      lastName: 'Garcia',
      email: 'lucas.g@netflix.com',
      phone: '+1-555-0115',
      company: 'Netflix',
      createdAt: '2026-03-10T17:30:00Z',
      tags: ['Prospect', 'Lead'],
    }
  ];

  const insertContact = db.prepare(`
    INSERT INTO contacts (first_name, last_name, email, phone, company, created_at, updated_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertContactTag = db.prepare(`
    INSERT OR IGNORE INTO contact_tags (contact_id, tag_id)
    VALUES (?, ?)
  `);

  const insertActivity = db.prepare(`
    INSERT INTO activities (contact_id, type, timestamp)
    VALUES (?, 'CONTACT_UPDATED', ?)
  `);

  const seedTx = db.transaction(() => {
    for (const c of contacts) {
      const result = insertContact.run(
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.company,
        c.createdAt,
        c.createdAt
      );
      const contactId = Number(result.lastInsertRowid);

      for (const tagName of c.tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          insertContactTag.run(contactId, tagId);
        }
      }

      insertActivity.run(contactId, c.createdAt);
    }
  });

  seedTx();
}

if (require.main === module) {
  const db = getDatabase();
  seedDatabase(db);
  console.log('Database seeded successfully.');
}
