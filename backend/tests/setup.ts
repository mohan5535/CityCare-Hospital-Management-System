import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import path from 'path';
import { beforeAll, afterAll, beforeEach } from 'vitest';

let mongoServer: MongoMemoryServer;

const binaryPath = path.resolve(__dirname, '../.mongo-bin/mongod-x64-win32-7.0.24.exe');
process.env.MONGOMS_SYSTEM_BINARY = binaryPath;
process.env.MONGOMS_DISABLE_POSTINSTALL = '1';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      systemBinary: binaryPath,
    },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
