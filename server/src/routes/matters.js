import { Router } from 'express';
import * as mattersService from '../services/mattersService.js';
import { chatWithAssistant } from '../services/mattersAssistantService.js';

const router = Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const send = (res, payload, status = 200) => res.status(status).json(payload);

const handleError = (err, res) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    console.error('[matters]', err);
  }
  return res.status(status).json({ error: message });
};

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    return send(res, { status: 'ok', timestamp: new Date().toISOString() });
  })
);

router.get(
  '/chat/config',
  asyncHandler(async (_req, res) => {
    try {
      const config = mattersService.getChatConfig();
      return send(res, config);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/assistant',
  asyncHandler(async (req, res) => {
    try {
      const { messages, mode } = req.body || {};
      const data = await chatWithAssistant({ messages, mode });
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/modes',
  asyncHandler(async (_req, res) => {
    try {
      const data = mattersService.listModes();
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/modes/:mode',
  asyncHandler(async (req, res) => {
    try {
      const data = mattersService.getMode(req.params.mode);
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/dashboard/summary',
  asyncHandler(async (req, res) => {
    try {
      const { mode } = req.query;
      if (!mode) {
        return res.status(400).json({ error: "Query parameter 'mode' is required" });
      }
      const data = mattersService.getDashboardSummary(mode);
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    try {
      const { mode, category, status } = req.query;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = mattersService.listInventory({ mode, category, status, limit });
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/inventory',
  asyncHandler(async (req, res) => {
    try {
      const record = mattersService.createInventory(req.body || {});
      return send(res, record, 201);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/finance',
  asyncHandler(async (req, res) => {
    try {
      const { mode, record_type } = req.query;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = mattersService.listFinance({ mode, record_type, limit });
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/finance',
  asyncHandler(async (req, res) => {
    try {
      const record = mattersService.createFinance(req.body || {});
      return send(res, record, 201);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    try {
      const { mode } = req.query;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = mattersService.listGallery({ mode, limit });
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/gallery',
  asyncHandler(async (req, res) => {
    try {
      const record = mattersService.createGalleryAsset(req.body || {});
      return send(res, record, 201);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    try {
      const { mode, tag } = req.query;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const data = mattersService.listInsights({ mode, tag, limit });
      return send(res, data);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/insights',
  asyncHandler(async (req, res) => {
    try {
      const record = mattersService.createInsight(req.body || {});
      return send(res, record, 201);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.post(
  '/insights/weather',
  asyncHandler(async (req, res) => {
    try {
      const { mode, units } = req.body || {};
      if (!mode) {
        return res.status(400).json({ error: "Body property 'mode' is required" });
      }
      const payload = mattersService.getWeatherInsight({ mode, units });
      return send(res, payload);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

router.patch(
  '/risks/:id',
  asyncHandler(async (req, res) => {
    try {
      const record = mattersService.updateRiskStatus(req.params.id, req.body || {});
      return send(res, record);
    } catch (err) {
      return handleError(err, res);
    }
  })
);

export default router;

