import fs from 'fs';
import path from 'path';

// If running on Vercel Serverless and SQLite is used, ensure dev.db is in writable /tmp directory
if (process.env.VERCEL === '1') {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    // Look for seeded database in potential build output locations
    const candidatePaths = [
      path.resolve(process.cwd(), 'apps/api/prisma/dev.db'),
      path.resolve(process.cwd(), 'prisma/dev.db'),
      path.resolve(process.cwd(), 'dev.db'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          fs.copyFileSync(p, tmpDbPath);
          console.log(`[Vercel Serverless] Seeded database copied from ${p} to ${tmpDbPath}`);
          break;
        } catch (e) {
          console.warn('[Vercel Serverless] Failed to copy db file:', e);
        }
      }
    }
  }

  // Ensure DATABASE_URL points to /tmp/dev.db if using SQLite
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

// Import Express API Application
import app from '../apps/api/src/index.js';

export default app;
