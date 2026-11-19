import { Router, Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { Tag } from '../types';

export function createTagsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = db.prepare('SELECT id, name FROM tags ORDER BY name ASC').all() as Tag[];
      res.json(tags);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
