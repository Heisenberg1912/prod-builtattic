import { Router } from 'express';
import {
  getThread,
  ingestEmailReply,
  postChatMessage,
  streamThread,
} from '../controllers/supportController.js';
import supportWebhookAuth from '../middleware/supportWebhookAuth.js';

const router = Router();

router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

router.post('/chat', postChatMessage);
router.get('/chat/:threadId', getThread);
router.get('/chat/stream/:threadId', streamThread);
router.post('/chat/inbound', supportWebhookAuth, ingestEmailReply);

export default router;
