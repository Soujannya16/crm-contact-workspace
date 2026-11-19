import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { getDatabase } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { createApp } from '../src/app';

describe('Contact Management API', () => {
  let db: Database.Database;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    db = getDatabase(':memory:');
    seedDatabase(db);
    app = createApp(db);
  });

  describe('GET /contacts (List, Search, Filter, Sort, Paginate)', () => {
    it('returns paginated results with correct total and default limit 20', async () => {
      const res = await request(app).get('/contacts');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(10);
      expect(res.body.data[0]).toHaveProperty('firstName');
      expect(res.body.data[0]).toHaveProperty('tags');
    });

    it('supports custom pagination page and limit', async () => {
      const res = await request(app).get('/contacts?page=2&limit=5');
      expect(res.status).toBe(200);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(5);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('searches contacts by name, email, or phone (?search=john)', async () => {
      const res = await request(app).get('/contacts?search=john');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const contact of res.body.data) {
        const matches =
          contact.firstName.toLowerCase().includes('john') ||
          contact.lastName.toLowerCase().includes('john') ||
          contact.email.toLowerCase().includes('john') ||
          (contact.phone && contact.phone.includes('john'));
        expect(matches).toBe(true);
      }
    });

    it('filters contacts by company (?company=Google)', async () => {
      const res = await request(app).get('/contacts?company=Google');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const contact of res.body.data) {
        expect(contact.company.toLowerCase()).toBe('google');
      }
    });

    it('filters contacts by tag (?tag=VIP)', async () => {
      const res = await request(app).get('/contacts?tag=VIP');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const contact of res.body.data) {
        expect(contact.tags).toContain('VIP');
      }
    });

    it('sorts contacts alphabetically by name (?sortBy=name&order=asc)', async () => {
      const res = await request(app).get('/contacts?sortBy=name&order=asc');
      expect(res.status).toBe(200);
      const names = res.body.data.map((c: { firstName: string }) => c.firstName.toLowerCase());
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('sorts contacts by createdAt descending (?sortBy=createdAt&order=desc)', async () => {
      const res = await request(app).get('/contacts?sortBy=createdAt&order=desc');
      expect(res.status).toBe(200);
      const dates = res.body.data.map((c: { createdAt: string }) => new Date(c.createdAt).getTime());
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    });
  });

  describe('GET /contacts/:id (Detail)', () => {
    it('returns full contact with tags for valid ID', async () => {
      const res = await request(app).get('/contacts/1');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body).toHaveProperty('firstName');
      expect(res.body).toHaveProperty('lastName');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('version');
      expect(Array.isArray(res.body.tags)).toBe(true);
    });

    it('returns 404 for non-existent contact', async () => {
      const res = await request(app).get('/contacts/9999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /contacts/:id (Update, Concurrency & Invariants)', () => {
    it('successfully updates contact, increments version, and writes activity', async () => {
      const original = (await request(app).get('/contacts/1')).body;
      const initialVersion = original.version;

      const updatePayload = {
        firstName: 'Jonathan',
        lastName: 'Doeman',
        email: 'jonathan.doeman@google.com',
        phone: '+1-555-9999',
        company: 'Alphabet',
        version: initialVersion,
      };

      const res = await request(app).put('/contacts/1').send(updatePayload);
      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe('Jonathan');
      expect(res.body.lastName).toBe('Doeman');
      expect(res.body.email).toBe('jonathan.doeman@google.com');
      expect(res.body.company).toBe('Alphabet');
      expect(res.body.version).toBe(initialVersion + 1);

      // Verify activity was recorded
      const activityRow = db
        .prepare('SELECT type FROM activities WHERE contact_id = ? ORDER BY id DESC LIMIT 1')
        .get(1) as { type: string };
      expect(activityRow).toBeDefined();
      expect(activityRow.type).toBe('CONTACT_UPDATED');
    });

    it('returns 409 Conflict with stale_update when version is behind', async () => {
      // Version 1 exists. We pass a stale version, e.g. 0 or mismatch
      const updatePayload = {
        firstName: 'StaleName',
        lastName: 'Doe',
        email: 'john.doe@google.com',
        phone: '+1-555-0101',
        company: 'Google',
        version: 999, // wrong version
      };

      const res = await request(app).put('/contacts/1').send(updatePayload);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('stale_update');
    });

    it('returns 409 Conflict when email belongs to another contact', async () => {
      // Contact 2 has email jane.smith@google.com
      const updatePayload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'jane.smith@google.com', // Duplicate of contact 2
        phone: '+1-555-0101',
        company: 'Google',
        version: 1,
      };

      const res = await request(app).put('/contacts/1').send(updatePayload);
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('email_conflict');
    });

    it('returns 400 for validation failures (e.g. invalid email format)', async () => {
      const updatePayload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'not-an-email',
        version: 1,
      };

      const res = await request(app).put('/contacts/1').send(updatePayload);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('Auxiliary Endpoints (Tags and Meta)', () => {
    it('GET /tags returns all tags', async () => {
      const res = await request(app).get('/tags');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);
    });

    it('GET /contacts/meta/companies returns distinct companies', async () => {
      const res = await request(app).get('/contacts/meta/companies');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContain('Google');
      expect(res.body).toContain('Microsoft');
    });
  });
});
