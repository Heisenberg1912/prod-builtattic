import { Router } from 'express';
import { upsertRating, getRatingsSnapshot } from '../controllers/ratingController.js';
import { requireAuth } from '../rbac/guards.js';

const router = Router();

router.post('/', requireAuth, upsertRating);
router.get('/:targetType/:targetId', getRatingsSnapshot);

export default router;
