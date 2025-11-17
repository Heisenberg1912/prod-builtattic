import './config/hardcodedEnv.js';

import mongoose from 'mongoose';

import { loadSecrets } from './config/secrets.js';
import logger from './utils/logger.js';
import { ensureSuperAdmin } from './startup/ensureSuperAdmin.js';

const memoryDbPreference = String(process.env.USE_IN_MEMORY_DB ?? 'auto').toLowerCase();
const isProd = process.env.NODE_ENV === 'production';
const preferMemoryDb = memoryDbPreference === 'true';
const allowMemoryFallback = !isProd && memoryDbPreference !== 'false';

let memoryServer;

const ensureMemoryServer = async () => {
  if (!allowMemoryFallback) {
    return null;
  }

  if (memoryServer) {
    return memoryServer;
  }

  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: process.env.MONGO_DBNAME || 'builtattic_dev',
      },
      binary: process.env.MEMORY_DB_MONGO_VERSION
        ? { version: process.env.MEMORY_DB_MONGO_VERSION }
        : undefined,
    });

    const stopServer = async () => {
      if (memoryServer) {
        await memoryServer.stop();
        memoryServer = undefined;
      }
    };

    process.once('SIGINT', stopServer);
    process.once('SIGTERM', stopServer);
    process.once('exit', stopServer);

    logger.warn('Using in-memory MongoDB instance for development', {
      uri: memoryServer.getUri(),
      dbName: memoryServer.instanceInfo?.dbName,
    });
  } catch (error) {
    logger.error('Failed to start in-memory MongoDB instance', {
      error: error.message,
    });
    throw error;
  }

  return memoryServer;
};

const connectDB = async () => {
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) {
    return mongoose.connection;
  }

  let uri = process.env.MONGO_URI;
  let dbName = process.env.MONGO_DBNAME;

  const connectWithMemory = async () => {
    const server = await ensureMemoryServer();
    if (!server) {
      throw new Error('In-memory MongoDB failed to start');
    }
    const memoryUri = server.getUri();
    const memoryDbName = server.instanceInfo?.dbName || dbName;
    await mongoose.connect(memoryUri, { dbName: memoryDbName });
    logger.info('Mongo connected (in-memory)', { dbName: memoryDbName });
    return mongoose.connection;
  };

  if (preferMemoryDb) {
    if (!allowMemoryFallback) {
      throw new Error('In-memory MongoDB is disabled in production');
    }
    return connectWithMemory();
  }

  if (!uri) {
    throw new Error('MONGO_URI missing in configuration');
  }

  if (!dbName) {
    throw new Error('MONGO_DBNAME missing in configuration');
  }

  if (readyState === 2) {
    if (typeof mongoose.connection.asPromise === 'function') {
      await mongoose.connection.asPromise();
    }
    return mongoose.connection;
  }

  const connectUsingPrimary = async () => {
    await mongoose.connect(uri, { dbName });
    logger.info('Mongo connected', { dbName });
    return mongoose.connection;
  };

  try {
    return await connectUsingPrimary();
  } catch (error) {
    const connectionErrorCodes = ['ECONNREFUSED', 'ENOTFOUND'];
    const isSelectionError = error?.name === 'MongooseServerSelectionError';
    const isConnError =
      isSelectionError ||
      connectionErrorCodes.includes(error?.code) ||
      /ECONNREFUSED/i.test(error?.message || '');

    if (!allowMemoryFallback || !isConnError) {
      throw error;
    }

    logger.warn('Primary Mongo connection failed; falling back to in-memory instance', {
      error: error.message,
    });
    return connectWithMemory();
  }
};

let initialisationPromise;

export const ensureInitialised = async () => {
  if (initialisationPromise) {
    return initialisationPromise;
  }

  initialisationPromise = (async () => {
    await loadSecrets();
    await connectDB();
    await ensureSuperAdmin();
  })().catch((error) => {
    initialisationPromise = undefined;
    throw error;
  });

  return initialisationPromise;
};

export const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  initialisationPromise = undefined;

  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};

export default ensureInitialised;
