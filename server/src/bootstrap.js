import './config/hardcodedEnv.js';

import mongoose from 'mongoose';

import { loadSecrets } from './config/secrets.js';
import logger from './utils/logger.js';

const connectDB = async () => {
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DBNAME || 'builtattic_dev';

  if (!uri) {
    throw new Error('MONGO_URI missing in configuration');
  }

  if (readyState === 2) {
    if (typeof mongoose.connection.asPromise === 'function') {
      await mongoose.connection.asPromise();
    }
    return mongoose.connection;
  }

  await mongoose.connect(uri, { dbName });
  logger.info('Mongo connected', { dbName });
  return mongoose.connection;
};

let initialisationPromise;

export const ensureInitialised = async () => {
  if (initialisationPromise) {
    return initialisationPromise;
  }

  initialisationPromise = (async () => {
    await loadSecrets();
    await connectDB();
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
};

export default ensureInitialised;
