import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { config, isLoopbackDatabaseUrl, setDatabaseUrl } from './env';

const serverRoot = path.resolve(__dirname, '../..');

async function startEmbeddedPostgres(): Promise<string> {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const dbDir = path.join(serverRoot, '.pgdata');
  const port = parseInt(process.env.PG_PORT || '5432', 10);
  const user = process.env.PG_USER || 'postgres';
  const password = process.env.PG_PASSWORD || 'postgrespassword';
  const database = process.env.PG_DATABASE || 'velozity_db';
  const url = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}?schema=public`;

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port,
    user,
    password,
    persistent: true,
  });

  console.log(`[Database] Starting embedded PostgreSQL on port ${port}...`);
  try {
    await pg.initialise();
  } catch {
    // Cluster already initialized
  }

  await pg.start();

  const admin = new Client({
    host: '127.0.0.1',
    port,
    user,
    password,
    database: 'postgres',
  });
  await admin.connect();
  const checkRes = await admin.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [database]);
  if (checkRes.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${database}"`);
  }
  await admin.end();

  const shutdown = async () => {
    try {
      await pg.stop();
    } catch {
      // ignore
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(`[Database] Embedded PostgreSQL is ready.`);
  return url;
}

function pushSchema(): void {
  console.log('[Database] Applying Prisma schema...');
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

async function seedIfEmpty(): Promise<void> {
  const { prisma } = await import('./prisma.js');
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return;
  }

  console.log('[Database] Empty database detected; running seed...');
  execSync('npx tsx prisma/seed.ts', {
    cwd: serverRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

export async function ensureDatabase(): Promise<void> {
  const existingUrl = process.env.DATABASE_URL?.trim() || config.databaseUrl;
  const needsEmbedded =
    config.nodeEnv === 'production' && isLoopbackDatabaseUrl(existingUrl);

  if (needsEmbedded) {
    const url = await startEmbeddedPostgres();
    setDatabaseUrl(url);
  } else if (!existingUrl) {
    setDatabaseUrl('postgresql://postgres:postgrespassword@localhost:5432/velozity_db?schema=public');
  } else {
    setDatabaseUrl(existingUrl);
  }

  if (needsEmbedded) {
    pushSchema();
    await seedIfEmpty();
  }
}
