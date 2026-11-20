import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { ActivityService, ContactService, EmailConflictError, NotFoundError, StaleUpdateError, TagService, TagAlreadyAssignedError } from '../services/contactService';
import { ContactListQuery } from '../types';

const updateContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().nullable().optional(),
  company: z.string().trim().nullable().optional(),
  version: z.number().int().min(1, 'Version must be a positive integer'),
});

const addTagSchema = z.object({
  tagId: z.number().int().positive('tagId must be a positive integer'),
});

const bulkAssignSchema = z.object({
  contactIds: z.array(z.number().int().positive()).min(1, 'contactIds must have at least one entry'),
  tagId: z.number().int().positive('tagId must be a positive integer'),
});

export function createContactsRouter(db: Database.Database): Router {
  const router = Router();
  const contactService = new ContactService(db);
  const tagService = new TagService(db);
  const activityService = new ActivityService(db);

  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const query: ContactListQuery = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        search: req.query.search as string | undefined,
        company: req.query.company as string | undefined,
        tag: req.query.tag as string | undefined,
        sortBy: req.query.sortBy as 'name' | 'createdAt' | undefined,
        order: req.query.order as 'asc' | 'desc' | undefined,
      };

      const result = contactService.listContacts(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/tags/bulk', (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bulkAssignSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      const { contactIds, tagId } = parsed.data;
      try {
        const result = tagService.bulkAssign(contactIds, tagId);
        res.json(result);
      } catch (err) {
        if (err instanceof NotFoundError) {
          res.status(404).json({ error: err.message });
          return;
        }
        if (err instanceof Error && err.message.includes('FOREIGN KEY')) {
          res.status(404).json({ error: 'One or more contact IDs do not exist' });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  });

  router.post('/:id/tags', (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(paramId, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contact ID' });
        return;
      }

      const parsed = addTagSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }

      const result = tagService.addTag(id, parsed.data.tagId);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof TagAlreadyAssignedError) {
        res.status(409).json({ error: err.errorCode, message: err.message });
      } else {
        next(err);
      }
    }
  });

  router.delete('/:id/tags/:tagId', (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const paramTagId = Array.isArray(req.params.tagId) ? req.params.tagId[0] : req.params.tagId;
      const id = parseInt(paramId, 10);
      const tagId = parseInt(paramTagId, 10);
      if (isNaN(id) || isNaN(tagId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      tagService.removeTag(id, tagId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else {
        next(err);
      }
    }
  });

  router.get('/:id/activities', (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(paramId, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contact ID' });
        return;
      }

      const activities = activityService.getActivitiesByContactId(id);
      res.json(activities);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else {
        next(err);
      }
    }
  });

  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(paramId, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contact ID' });
        return;
      }

      const contact = contactService.getContactById(id);
      if (!contact) {
        res.status(404).json({ error: `Contact with ID ${id} not found` });
        return;
      }

      res.json(contact);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const id = parseInt(paramId, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contact ID' });
        return;
      }

      const parseResult = updateContactSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }

      const updated = contactService.updateContact(id, parseResult.data);
      res.json(updated);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof StaleUpdateError) {
        res.status(409).json({
          error: err.errorCode,
          message: err.message,
        });
      } else if (err instanceof EmailConflictError) {
        res.status(409).json({
          error: err.errorCode,
          message: err.message,
        });
      } else {
        next(err);
      }
    }
  });

  return router;
}
