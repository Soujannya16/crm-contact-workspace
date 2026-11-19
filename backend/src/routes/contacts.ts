import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { ContactService, EmailConflictError, NotFoundError, StaleUpdateError } from '../services/contactService';
import { ContactListQuery } from '../types';

const updateContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().nullable().optional(),
  company: z.string().trim().nullable().optional(),
  version: z.number().int().min(1, 'Version must be a positive integer'),
});

export function createContactsRouter(db: Database.Database): Router {
  const router = Router();
  const contactService = new ContactService(db);

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
