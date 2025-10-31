import app from '../server/src/app.js';
import { ensureInitialised } from '../server/src/bootstrap.js';

export default async function handler(req, res) {
  try {
    await ensureInitialised();
  } catch (error) {
    console.error('Failed to initialise API handler', error);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'initialisation_failed' }));
    }
    return;
  }
  return app(req, res);
}
