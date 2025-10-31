import { Router } from 'express';
import mongoose from 'mongoose';

const r = Router();

// Basic health
r.get('/', (_req, res) => res.json({ ok: true }));

// DB health (Atlas ping)
r.get('/db', async (_req, res) => {
  try {
    const connected = mongoose.connection.readyState === 1; // 1 = connected
    if (connected && mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }
    return res.json({ ok: true, mongo: connected });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

export default r;