import http from 'http';
import { createApp } from './app';
import { initSocketServer } from './socket';
import { startOverdueScheduler } from './jobs/overdueScheduler';
import { config } from './config/env';
import { prisma } from './config/prisma';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize WebSocket engine
  initSocketServer(server);

  // Start overdue tasks background cron scheduler
  startOverdueScheduler();

  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Velozity API & WebSocket Server Running`);
    console.log(`📡 Port: ${config.port}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
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
