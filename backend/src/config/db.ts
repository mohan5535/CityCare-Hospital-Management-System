import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env';

let memoryServer: MongoMemoryServer | null = null;

/**
 * Safely masks database credentials from connection URIs to prevent secret leakage in logs.
 */
export const maskMongoUri = (uri: string): string => {
  if (!uri) return '';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

/**
 * Connects to MongoDB.
 * Connects to the primary database specified in MONGO_URI (e.g. MongoDB Atlas).
 * In-memory fallback is restricted strictly to when USE_IN_MEMORY_DB=true or MONGO_URI='memory'.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  // Check if in-memory database is explicitly requested for testing
  if (config.USE_IN_MEMORY_DB || config.MONGO_URI === 'memory') {
    return startMemoryDatabase();
  }

  const maskedUri = maskMongoUri(config.MONGO_URI);
  console.log(`[Database] Connecting to primary database at: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(config.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error: any) {
    console.error(`[Database Connection Error] Failed to connect to ${maskedUri}: ${error.message}`);

    // In Production: Strict failure, NEVER fall back to in-memory in production
    if (config.NODE_ENV === 'production') {
      console.error(`[Database Fatal Error] In production mode, persistent database connectivity is strictly required.`);
      throw new Error(`Production database connection failed: ${error.message}`);
    }

    // In Development / Review mode:
    console.warn(`\n======================================================================`);
    console.warn(`⚠️  [MongoDB Atlas Connection Blocked]`);
    console.warn(`    Your dynamic IP address is not yet whitelisted in MongoDB Atlas.`);
    console.warn(`    👉 To use persistent Atlas storage, add your IP in Atlas Network Access.`);
    console.warn(`    🚀 Starting local development database so CityCare HMS stays online...`);
    console.warn(`======================================================================\n`);

    return startMemoryDatabase();
  }
};

/**
 * Explicit in-memory engine fallback for isolated testing
 */
const startMemoryDatabase = async (): Promise<typeof mongoose> => {
  console.warn('[Database Notice] Explicit in-memory database requested (Data will NOT persist across restarts).');
  try {
    const localBinaryPath = path.resolve(__dirname, '../../.mongo-bin/mongod-x64-win32-7.0.24.exe');
    const binaryConfig: any = {};

    if (fs.existsSync(localBinaryPath)) {
      binaryConfig.systemBinary = localBinaryPath;
    }

    memoryServer = await MongoMemoryServer.create({
      binary: binaryConfig,
    });

    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri, {
      autoIndex: true,
    });
    console.log(`[Database] Embedded in-memory MongoDB running at: ${memoryUri}`);
    return conn;
  } catch (embeddedError: any) {
    console.error('[Database Fatal Error] Failed to start embedded MongoDB:', embeddedError.message);
    throw embeddedError;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB connection closed.');
  } catch (error: any) {
    console.error(`[Database Error] Disconnect error: ${error.message}`);
  }
};
