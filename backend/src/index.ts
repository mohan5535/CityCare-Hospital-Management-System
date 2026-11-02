import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app';
import { config } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { setupSocketHandlers } from './sockets/queueSocket';
import { seedDatabase } from './utils/seeder';

const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Seed default data if needed
    await seedDatabase();

    // 3. Initialize Express & HTTP Server
    const app = createApp();
    const server = http.createServer(app);

    // 4. Attach Socket.io
    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => callback(null, true),
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    setupSocketHandlers(io);

    // 5. Start Listening with automatic port fallback
    let currentPort = config.PORT;

    const tryListen = (port: number) => {
      const onError = (err: any) => {
        if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
          console.warn(`[Port Conflict] Port ${port} is restricted or busy (${err.code}). Retrying on port ${port + 1}...`);
          server.removeListener('error', onError);
          tryListen(port + 1);
        } else {
          console.error('[Server Error]', err);
          process.exit(1);
        }
      };

      server.once('error', onError);

      server.listen(port, '0.0.0.0', () => {
        server.removeListener('error', onError);
        console.log(`\n======================================================`);
        console.log(`  🏥 CityCare HMS Backend API Server Online!          `);
        console.log(`  🌐 Port: ${port} | Env: ${config.NODE_ENV}           `);
        console.log(`  🩺 Health: http://localhost:${port}/health          `);
        console.log(`  📋 API Docs: http://localhost:${port}/api/docs       `);
        console.log(`======================================================\n`);
      });
    };

    tryListen(currentPort);

    // Graceful Shutdown
    const shutdown = async () => {
      console.log('\n[HMS Backend] Shutting down gracefully...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[HMS Backend Startup Error]', error);
    process.exit(1);
  }
};

startServer();
