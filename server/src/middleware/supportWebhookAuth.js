import logger from '../utils/logger.js';

const headerName = 'x-support-webhook-token';

const missingSecretError =
  'SUPPORT_WEBHOOK_SECRET is not configured; refusing inbound webhook';

const supportWebhookAuth = (req, res, next) => {
  const expected = process.env.SUPPORT_WEBHOOK_SECRET;
  if (!expected) {
    logger.error(missingSecretError);
    return res
      .status(503)
      .json({ error: 'support_webhook_not_configured' });
  }

  const provided = req.get(headerName);
  if (!provided || provided !== expected) {
    logger.warn('Rejected support webhook with invalid token');
    return res.status(401).json({ error: 'unauthorized' });
  }

  return next();
};

export default supportWebhookAuth;
