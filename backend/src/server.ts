import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { syncAdminAccount } from './services/admin.service';

const start = async () => {
  await prisma.$connect();
  await syncAdminAccount();
  const server = createApp().listen(env.PORT, () => {
    console.log(`API is running on http://localhost:${env.PORT}/api`);
  });

  // Slowloris-style protection: do not let clients hold sockets open with slow headers or bodies.
  server.headersTimeout = 20_000;
  server.requestTimeout = 60_000;
  server.keepAliveTimeout = 5_000;

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
};

start().catch(async (error) => {
  console.error('Failed to start server:', error);
  await prisma.$disconnect();
  process.exit(1);
});
