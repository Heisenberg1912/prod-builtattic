import { z } from 'zod';
import Rating from '../models/Rating.js';
import {
  computeRatingSnapshot,
  ensureTargetExists,
  fetchUserRating,
  toObjectId,
} from '../services/ratingService.js';

const ratingInputSchema = z.object({
  targetType: z.enum(['associate', 'firm']),
  targetId: z.string().trim().min(1),
  score: z.number().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const httpError = (status, message, details) => {
  const error = new Error(message);
  error.statusCode = status;
  if (details) {
    error.details = details;
  }
  return error;
};

const resolveTargetId = (targetId) => {
  const objectId = toObjectId(targetId);
  if (!objectId) {
    throw httpError(400, 'Invalid targetId');
  }
  return objectId;
};

export const upsertRating = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      throw httpError(401, 'Login required');
    }

    const parsed = ratingInputSchema.parse(req.body || {});
    const targetObjectId = resolveTargetId(parsed.targetId);
    const targetModel = await ensureTargetExists(parsed.targetType, targetObjectId);

    if (!targetModel) {
      throw httpError(404, 'Target not found');
    }

    const payload = {
      score: Number(parsed.score.toFixed(1)),
      comment: parsed.comment?.trim() || undefined,
    };

    const rating = await Rating.findOneAndUpdate(
      { user: req.user._id, targetType: parsed.targetType, target: targetObjectId },
      {
        $set: payload,
        $setOnInsert: {
          user: req.user._id,
          targetType: parsed.targetType,
          target: targetObjectId,
        },
      },
      { new: true, upsert: true }
    ).lean();

    const snapshot = await computeRatingSnapshot(parsed.targetType, targetObjectId, {
      updateAggregate: true,
    });

    res.json({ ok: true, rating, snapshot });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, 'Validation failed', error.flatten()));
    }
    next(error);
  }
};

export const getRatingsSnapshot = async (req, res, next) => {
  try {
    const targetTypeSchema = z.enum(['associate', 'firm']);
    const targetType = targetTypeSchema.parse(req.params.targetType);
    const targetObjectId = resolveTargetId(req.params.targetId);

    const targetModel = await ensureTargetExists(targetType, targetObjectId);
    if (!targetModel) {
      throw httpError(404, 'Target not found');
    }

    const snapshot = await computeRatingSnapshot(targetType, targetObjectId, {
      updateAggregate: false,
    });

    const userRating = await fetchUserRating(targetType, targetObjectId, req.user?._id);

    res.json({ ok: true, snapshot, userRating });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(httpError(400, 'Validation failed', error.flatten()));
    }
    next(error);
  }
};
