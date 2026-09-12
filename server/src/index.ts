import './config/env';
import http from 'http';
import { ensureDatabase } from './config/ensureDatabase';

async function bootstrap() {
  await ensureDatabase();

  const { createApp } = await import('./app.js');
  const { initSocketServer } = await import('./socket/index.js');
  const { startOverdueScheduler } = await import('./jobs/overdueScheduler.js');
  const { config } = await import('./config/env.js');
  const { prisma } = await import('./config/prisma.js');

  const app = createApp();
  const server = http.createServer(app);

  initSocketServer(server);
  startOverdueScheduler();

  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Velozity API & WebSocket Server Running`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🗄️  Database: ${config.databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
    console.log(`🔗 Health Check: /api/health`);
    console.log(`====================================================`);
  });

  const shutdown = async () => {
    console.log('\nGracefully shutting down server...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Database connections closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
