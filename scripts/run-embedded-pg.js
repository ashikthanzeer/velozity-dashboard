const path = require('path');
const fs = require('fs');

async function run() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const dbDir = path.join(__dirname, '..', '.pgdata');
  const port = parseInt(process.env.PG_PORT || '5432', 10);
  const user = process.env.PG_USER || 'postgres';
  const password = process.env.PG_PASSWORD || 'postgrespassword';
  const database = process.env.PG_DATABASE || 'velozity_db';

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: port,
    user: user,
    password: password,
    persistent: true,
  });

  console.log(`[Embedded-PostgreSQL] Initializing database cluster at ${dbDir}...`);
  try {
    await pg.initialise();
  } catch (err) {
    // If already initialized, continue
  }

  console.log(`[Embedded-PostgreSQL] Starting PostgreSQL server on port ${port}...`);
  await pg.start();
  console.log(`[Embedded-PostgreSQL] PostgreSQL is running on port ${port}!`);
  console.log(`[Embedded-PostgreSQL] Connection URL: postgresql://${user}:${password}@localhost:${port}/${database}?schema=public`);

  // Ensure database exists
  try {
    const { Client } = require('pg');
    const client = new Client({
      host: 'localhost',
      port: port,
      user: user,
      password: password,
      database: 'postgres',
    });
    await client.connect();
    const checkRes = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [database]);
    if (checkRes.rowCount === 0) {
      console.log(`[Embedded-PostgreSQL] Creating database "${database}"...`);
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`[Embedded-PostgreSQL] Database "${database}" created.`);
    }
    await client.end();
  } catch (e) {
    console.warn(`[Embedded-PostgreSQL] Database check note:`, e.message);
  }

  const cleanup = async () => {
    console.log('\n[Embedded-PostgreSQL] Shutting down PostgreSQL gracefully...');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

run().catch((err) => {
  console.error('[Embedded-PostgreSQL] Error starting database:', err);
  process.exit(1);
});
