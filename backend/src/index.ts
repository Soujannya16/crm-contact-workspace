import { createApp } from './app';
import { getDatabase } from './db/database';
import { seedDatabase } from './db/seed';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const db = getDatabase();
seedDatabase(db);

const app = createApp(db);

app.listen(PORT, () => {
  console.log(`CRM Backend running on http://localhost:${PORT}`);
});
