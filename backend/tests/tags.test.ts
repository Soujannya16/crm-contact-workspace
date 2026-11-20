import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { getDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { createApp } from '../src/app';

describe('Tag Management API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = getDatabase(':memory:');
    seedDatabase(db);
    app = createApp(db);
  });

  it('GET /tags returns all seeded tags', async () => {
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(5);
    const names = res.body.map((t: { name: string }) => t.name);
    expect(names).toContain('VIP');
    expect(names).toContain('Partner');
  });

  it('POST /contacts/:id/tags — 201, inserts junction row and TAG_ADDED activity', async () => {
    // Contact 1 has VIP and Customer. Add Partner (id 2 from seed) — but let's fetch tag id dynamically
    const tagsRes = await request(app).get('/tags');
    const partnerTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'Partner');
    // Contact 8 (Jessica Anderson) has only Prospect — add Partner to her
    const res = await request(app).post('/contacts/8/tags').send({ tagId: partnerTag.id });
    expect(res.status).toBe(201);
    expect(res.body.contactId).toBe(8);
    expect(res.body.tagId).toBe(partnerTag.id);
    expect(res.body.tagName).toBe('Partner');

    const junctionRow = db.prepare('SELECT * FROM contact_tags WHERE contact_id = 8 AND tag_id = ?').get(partnerTag.id);
    expect(junctionRow).toBeDefined();

    const activity = db.prepare("SELECT type FROM activities WHERE contact_id = 8 AND type = 'TAG_ADDED' ORDER BY id DESC LIMIT 1").get() as { type: string } | undefined;
    expect(activity?.type).toBe('TAG_ADDED');
  });

  it('POST /contacts/:id/tags — 409 when tag already assigned (no duplicate activity)', async () => {
    const tagsRes = await request(app).get('/tags');
    const vipTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'VIP');
    // Contact 1 already has VIP
    const countBefore = (db.prepare("SELECT COUNT(*) as n FROM activities WHERE contact_id = 1 AND type = 'TAG_ADDED'").get() as { n: number }).n;

    const res = await request(app).post('/contacts/1/tags').send({ tagId: vipTag.id });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('tag_already_assigned');

    const countAfter = (db.prepare("SELECT COUNT(*) as n FROM activities WHERE contact_id = 1 AND type = 'TAG_ADDED'").get() as { n: number }).n;
    expect(countAfter).toBe(countBefore);
  });

  it('DELETE /contacts/:id/tags/:tagId — 204, removes junction row and inserts TAG_REMOVED activity', async () => {
    const tagsRes = await request(app).get('/tags');
    const vipTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'VIP');
    // Contact 1 has VIP
    const res = await request(app).delete(`/contacts/1/tags/${vipTag.id}`);
    expect(res.status).toBe(204);

    const junctionRow = db.prepare('SELECT * FROM contact_tags WHERE contact_id = 1 AND tag_id = ?').get(vipTag.id);
    expect(junctionRow).toBeUndefined();

    const activity = db.prepare("SELECT type FROM activities WHERE contact_id = 1 AND type = 'TAG_REMOVED' ORDER BY id DESC LIMIT 1").get() as { type: string } | undefined;
    expect(activity?.type).toBe('TAG_REMOVED');
  });

  it('DELETE /contacts/:id/tags/:tagId — 404 when tag not assigned to contact', async () => {
    const tagsRes = await request(app).get('/tags');
    const leadTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'Lead');
    // Contact 1 (John Doe) does not have Lead tag
    const res = await request(app).delete(`/contacts/1/tags/${leadTag.id}`);
    expect(res.status).toBe(404);
  });

  it('POST /contacts/tags/bulk — assigns tag to all contacts, returns correct assigned count', async () => {
    const tagsRes = await request(app).get('/tags');
    const prospectTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'Prospect');
    // Contacts 1, 2, 5 (David Wilson-Customer) don't have Prospect
    const contactIds = [1, 2, 5];
    const res = await request(app).post('/contacts/tags/bulk').send({ contactIds, tagId: prospectTag.id });
    expect(res.status).toBe(200);
    expect(res.body.assigned).toBe(3);
    expect(res.body.skipped).toBe(0);
  });

  it('POST /contacts/tags/bulk — skips already-assigned contacts, returns correct skipped count', async () => {
    const tagsRes = await request(app).get('/tags');
    const vipTag = tagsRes.body.find((t: { id: number; name: string }) => t.name === 'VIP');
    // Contacts 1 and 4 already have VIP; contact 5 does not
    const res = await request(app).post('/contacts/tags/bulk').send({ contactIds: [1, 4, 5], tagId: vipTag.id });
    expect(res.status).toBe(200);
    expect(res.body.assigned).toBe(1);
    expect(res.body.skipped).toBe(2);
  });

  it('POST /contacts/tags/bulk — 404 when tag does not exist, rolls back transaction', async () => {
    const countBefore = (db.prepare('SELECT COUNT(*) as n FROM contact_tags').get() as { n: number }).n;
    const res = await request(app).post('/contacts/tags/bulk').send({ contactIds: [1, 2, 3], tagId: 9999 });
    expect(res.status).toBe(404);
    const countAfter = (db.prepare('SELECT COUNT(*) as n FROM contact_tags').get() as { n: number }).n;
    expect(countAfter).toBe(countBefore);
  });
});
