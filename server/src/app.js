import './config/hardcodedEnv.js';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import client from 'prom-client';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import { attachUser } from './auth/middleware.js';
import logger, { requestLogger } from './utils/logger.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import authOtpRouter from './routes/authOTPRoutes.js';
import firmsRouter from './routes/firms.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin.js';
import paymentsRouter from './routes/payments.js';
import marketplaceRouter from './routes/marketplace.js';
import uploadRouter from './routes/upload.js';
import assetsRouter from './routes/assets.js';
import vitruviRouter from './routes/vitruvi.js';
import mattersRouter from './routes/matters.js';
import supportRouter from './routes/support.js';
import documentsRouter from './routes/documents.js';
import accessRequestsRouter from './routes/accessRequests.js';
import associatePortalRouter from './routes/associatePortal.js';
import studioPortalRouter from './routes/studioPortal.js';
import firmPortalRouter from './routes/firmPortal.js';
import vendorMaterialsRouter from './routes/vendorMaterials.js';
import dashboardRouter from './routes/dashboard.js';
import settingsRouter from './routes/settings.js';
import studioRequestsRouter from './routes/studioRequests.js';
import ratingsRouter from './routes/ratings.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(helmet());

const rawCorsOrigins = process.env.CORS_ORIGIN.split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const allowAllOrigins = rawCorsOrigins.includes('*');

if (allowAllOrigins && process.env.NODE_ENV !== 'production') {
  logger.warn('CORS_ORIGIN allows all origins in a non-production environment');
}

const corsOrigin = allowAllOrigins ? '*' : rawCorsOrigins;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(requestLogger);
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use(attachUser);

app.use(['/health', '/api/health'], healthRouter);
app.use(['/auth', '/api/auth'], authRouter);
app.use(['/auth-otp', '/api/auth-otp'], authOtpRouter);
app.use(['/api', '/'], firmsRouter);
app.use(['/api', '/'], productsRouter);
app.use(['/api', '/'], cartRouter);
app.use(['/api', '/'], ordersRouter);
app.use(['/api', '/'], adminRouter);
app.use(['/payments', '/api/payments'], paymentsRouter);
app.use(['/marketplace', '/api/marketplace'], marketplaceRouter);
app.use(['/uploads', '/api/uploads'], uploadRouter);
app.use(['/assets', '/api/assets'], assetsRouter);
app.use(['/vitruvi', '/api/vitruvi'], vitruviRouter);
app.use(['/matters', '/api/matters'], mattersRouter);
app.use(['/support', '/api/support'], supportRouter);
app.use(['/documents', '/api/documents'], documentsRouter);
app.use(['/access-requests', '/api/access-requests'], accessRequestsRouter);
app.use(['/studio/requests', '/api/studio/requests'], studioRequestsRouter);
app.use(['/portal/associate', '/api/portal/associate'], associatePortalRouter);
app.use(['/portal/studio', '/api/portal/studio'], studioPortalRouter);
app.use(
  [
    '/portal/firm',
    '/api/portal/firm',
    '/portal/vendor',
    '/api/portal/vendor',
  ],
  firmPortalRouter
);
app.use(
  [
    '/portal/vendor/materials',
    '/api/portal/vendor/materials',
  ],
  vendorMaterialsRouter
);
app.use(['/dashboard', '/api/dashboard'], dashboardRouter);
app.use(['/settings', '/api/settings'], settingsRouter);
app.use(['/ratings', '/api/ratings'], ratingsRouter);

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ ok: true });
});

app.get(['/health/db', '/api/health/db'], async (_req, res) => {
  try {
    const connected = mongoose.connection.readyState === 1;
    if (connected && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    res.json({ ok: true, mongo: connected });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

const swaggerSpec = swaggerJSDoc({
  definition: { openapi: '3.0.0', info: { title: 'Builtattic API', version: '1.0.0' } },
  apis: ['./src/routes/**/*.js', './src/models/**/*.js'],
});
app.use(['/docs', '/api/docs'], swaggerUi.serve, swaggerUi.setup(swaggerSpec));

client.collectDefaultMetrics();
app.get(['/metrics', '/api/metrics'], async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const shouldServeStatic = process.env.SERVE_CLIENT_FROM_API?.toLowerCase() !== 'false';

const registerStaticAssets = () => {
  if (!shouldServeStatic) {
    return false;
  }

  const configuredPath = process.env.CLIENT_BUILD_PATH;
  const defaultPath = path.resolve(__dirname, '../../client/dist');
  const buildPath = path.resolve(process.cwd(), configuredPath || defaultPath);
  const indexHtml = path.join(buildPath, 'index.html');

  if (!fs.existsSync(indexHtml)) {
    logger.warn('Client build not found; skipping static asset registration', {
      buildPath,
    });
    return false;
  }

  app.use(
    express.static(buildPath, {
      index: false,
      maxAge: '1h',
    })
  );

  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/metrics') ||
      req.path.startsWith('/docs')
    ) {
      return next();
    }
    res.sendFile(indexHtml);
  });

  logger.info('Serving client build assets', { buildPath });
  return true;
};

const staticRegistered = registerStaticAssets();

if (!staticRegistered) {
  app.get('/', (_req, res) => res.json({ ok: true }));
}

const isProduction = process.env.NODE_ENV === 'production';

app.use((error, req, res, next) => {
  logger.error('Unhandled application error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    statusCode: error.statusCode,
    details: error.details,
  });
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const isServerError = statusCode >= 500;

  const responseBody = {
    error: isServerError ? 'internal_error' : error.message || 'request_failed',
  };

  if (error.details) {
    responseBody.details = error.details;
  }

  if (!isProduction && isServerError) {
    responseBody.debug = {
      message: error.message,
      stack: error.stack,
    };
  }

  res.status(statusCode).json(responseBody);
});

export default app;


