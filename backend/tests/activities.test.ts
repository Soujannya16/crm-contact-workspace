import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { getDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { createApp } from '../src/app';

describe('Activity Management API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = getDatabase(':memory:');
    seedDatabase(db);
    app = createApp(db);
  });

  it('Get activities — empty: returns [] for a brand-new contact with no activities', async () => {
    // Insert a new contact directly without any activity row
    const result = db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, created_at, updated_at, version)
      VALUES ('Alice', 'Wonderland', 'alice@wonderland.com', '2026-04-01T10:00:00Z', '2026-04-01T10:00:00Z', 1)
    `).run();
    const newId = Number(result.lastInsertRowid);

    const res = await request(app).get(`/contacts/${newId}/activities`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual([]);
  });

  it('Get activities — unknown contact: returns 404', async () => {
    const res = await request(app).get('/contacts/99999/activities');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('Get activities — invalid contact ID: returns 400', async () => {
    const res = await request(app).get('/contacts/invalid-id/activities');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('Get activities — after update: returns CONTACT_UPDATED after a successful PUT', async () => {
    const contact = (await request(app).get('/contacts/1')).body;

    const updateRes = await request(app).put('/contacts/1').send({
      firstName: 'Johnny',
      lastName: 'Doe',
      email: contact.email,
      phone: '+1-555-1111',
      company: 'Alphabet',
      version: contact.version,
    });
    expect(updateRes.status).toBe(200);

    const res = await request(app).get('/contacts/1/activities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const latest = res.body[0];
    expect(latest.type).toBe('CONTACT_UPDATED');
    expect(latest).toHaveProperty('id');
    expect(latest).toHaveProperty('timestamp');
    expect(latest).not.toHaveProperty('contactId');
  });

  it('Get activities — after tag add: returns TAG_ADDED after POST /contacts/:id/tags', async () => {
    const tagsRes = await request(app).get('/tags');
    const partnerTag = tagsRes.body.find((t: { name: string }) => t.name === 'Partner');

    // Contact 8 has only Prospect tag in seed
    const addRes = await request(app).post('/contacts/8/tags').send({ tagId: partnerTag.id });
    expect(addRes.status).toBe(201);

    const res = await request(app).get('/contacts/8/activities');
    expect(res.status).toBe(200);
    expect(res.body[0].type).toBe('TAG_ADDED');
  });

  it('Get activities — after tag remove: returns TAG_REMOVED after DELETE /contacts/:id/tags/:tagId', async () => {
    const tagsRes = await request(app).get('/tags');
    const vipTag = tagsRes.body.find((t: { name: string }) => t.name === 'VIP');

    // Contact 1 has VIP
    const delRes = await request(app).delete(`/contacts/1/tags/${vipTag.id}`);
    expect(delRes.status).toBe(204);

    const res = await request(app).get('/contacts/1/activities');
    expect(res.status).toBe(200);
    expect(res.body[0].type).toBe('TAG_REMOVED');
  });

  it('Get activities — ordering: newest activity is first in the array (ORDER BY timestamp DESC, id DESC)', async () => {
    // Insert contact
    const result = db.prepare(`
      INSERT INTO contacts (first_name, last_name, email, created_at, updated_at, version)
      VALUES ('Order', 'Test', 'order@test.com', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 1)
    `).run();
    const contactId = Number(result.lastInsertRowid);

    // Insert activities with explicit timestamps
    db.prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'CONTACT_UPDATED', '2026-01-01T10:00:00Z')").run(contactId);
    db.prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'TAG_ADDED', '2026-01-02T10:00:00Z')").run(contactId);
    db.prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'TAG_REMOVED', '2026-01-03T10:00:00Z')").run(contactId);
    // Same timestamp as previous but inserted later (higher id)
    db.prepare("INSERT INTO activities (contact_id, type, timestamp) VALUES (?, 'CONTACT_UPDATED', '2026-01-03T10:00:00Z')").run(contactId);

    const res = await request(app).get(`/contacts/${contactId}/activities`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);

    // Verify ordering
    expect(res.body[0].type).toBe('CONTACT_UPDATED');
    expect(res.body[0].timestamp).toBe('2026-01-03T10:00:00Z');
    expect(res.body[1].type).toBe('TAG_REMOVED');
    expect(res.body[1].timestamp).toBe('2026-01-03T10:00:00Z');
    expect(res.body[2].type).toBe('TAG_ADDED');
    expect(res.body[2].timestamp).toBe('2026-01-02T10:00:00Z');
    expect(res.body[3].type).toBe('CONTACT_UPDATED');
    expect(res.body[3].timestamp).toBe('2026-01-01T10:00:00Z');
  });

  it('Atomicity — stale update: no CONTACT_UPDATED activity recorded when PUT returns 409', async () => {
    const countBefore = (db.prepare('SELECT COUNT(*) as n FROM activities WHERE contact_id = 1').get() as { n: number }).n;

    // Send update with stale version
    const res = await request(app).put('/contacts/1').send({
      firstName: 'StaleName',
      lastName: 'Doe',
      email: 'john.doe@google.com',
      version: 9999,
    });
    expect(res.status).toBe(409);

    const countAfter = (db.prepare('SELECT COUNT(*) as n FROM activities WHERE contact_id = 1').get() as { n: number }).n;
    expect(countAfter).toBe(countBefore);
  });
});
