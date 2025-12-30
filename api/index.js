import express from 'express';
import cors from 'cors';

// Import routes
import vitruviRouter from '../server/src/routes/vitruvi.js';
import mattersRouter from '../server/src/routes/matters.js';

const app = express();

// CORS configuration - allow frontend domain
const allowedOrigins = [
  'https://prod-builtattic.vercel.app',
  'https://prod-builtattic-git-main-heisenberg1912.vercel.app',
  process.env.CLIENT_URL,
  process.env.CLIENT_ORIGIN,
  'http://localhost:5175',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'Builtattic API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/vitruvi', vitruviRouter);
app.use('/api/matters', mattersRouter);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

export default app;
