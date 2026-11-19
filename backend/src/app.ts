import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createContactsRouter } from './routes/contacts';
import { createTagsRouter } from './routes/tags';
import { createMetaRouter } from './routes/meta';

export function createApp(db: Database.Database): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/contacts/meta', createMetaRouter(db));
  app.use('/contacts', createContactsRouter(db));
  app.use('/tags', createTagsRouter(db));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Generic error handler
  app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  });

  return app;
}
