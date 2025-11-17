import './config/hardcodedEnv.js';

import net from 'node:net';

import app from './app.js';
import logger from './utils/logger.js';
import { ensureInitialised } from './bootstrap.js';

const HOST = process.env.HOST || '0.0.0.0';
const parsedPort = Number.parseInt(process.env.PORT, 10);
const REQUESTED_PORT = Number.isFinite(parsedPort) ? parsedPort : 4000;
const parsedFallbackAttempts = Number.parseInt(process.env.PORT_FALLBACK_ATTEMPTS, 10);
const PORT_FALLBACK_ATTEMPTS = Number.isFinite(parsedFallbackAttempts)
  ? parsedFallbackAttempts
  : 10;
const KEEP_ALIVE_TIMEOUT_MS = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 620_000);

const canUsePort = (port) =>
  new Promise((resolve, reject) => {
    if (port === 0) {
      resolve(true);
      return;
    }

    const tester = net
      .createServer()
      .once('error', (error) => {
        if (error && ['EADDRINUSE', 'EACCES'].includes(error.code)) {
          resolve(false);
          return;
        }
        reject(error);
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen({ port, host: HOST, exclusive: true });

    tester.unref();
  });

const resolvePort = async () => {
  let candidate = REQUESTED_PORT;
  if (candidate === 0) {
    return 0;
  }

  if (!Number.isFinite(candidate) || candidate < 0) {
    candidate = 4000;
  }

  const attempts = Math.max(PORT_FALLBACK_ATTEMPTS, 0);
  for (let i = 0; i <= attempts; i += 1) {
    const portToTry = candidate + i;
    const available = await canUsePort(portToTry);
    if (available) {
      if (portToTry !== REQUESTED_PORT) {
        logger.warn('Requested port unavailable; using fallback', {
          requestedPort: REQUESTED_PORT,
          fallbackPort: portToTry,
        });
      }
      return portToTry;
    }
  }

  const finalPort = candidate + attempts;
  throw new Error([
    'Unable to bind to any port between ' + candidate + ' and ' + finalPort + '.',
    'Adjust PORT or PORT_FALLBACK_ATTEMPTS.',
  ].join(' '));
};

const startServer = async () => {
  try {
    await ensureInitialised();
  } catch (error) {
    logger.error('Failed to initialise application', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }

  const port = await resolvePort();

  const server = app.listen(port, HOST, () => {
    const addressInfo = server.address();
    logger.info('Server running', {
      port: addressInfo?.port || port,
      host: HOST,
      env: process.env.NODE_ENV,
    });
  });

  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = KEEP_ALIVE_TIMEOUT_MS + 5_000;
};

startServer();

export default app;

