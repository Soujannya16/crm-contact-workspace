import { Router, Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';

export function createMetaRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/companies', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = db
        .prepare("SELECT DISTINCT company FROM contacts WHERE company IS NOT NULL AND TRIM(company) != '' ORDER BY company ASC")
        .all() as { company: string }[];
      res.json(rows.map(r => r.company));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
