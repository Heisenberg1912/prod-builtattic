import mongoose from 'mongoose';
import Rating from '../models/Rating.js';
import AssociateProfile from '../models/AssociateProfile.js';
import Firm from '../models/Firm.js';

const TARGET_MODELS = {
  associate: AssociateProfile,
  firm: Firm,
};

const buildDistributionSkeleton = () =>
  [1, 2, 3, 4, 5].map((score) => ({ score, count: 0 }));

export const toObjectId = (value) => {
  if (!value || !mongoose.isValidObjectId(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

export const ensureTargetExists = async (targetType, targetId) => {
  const Model = TARGET_MODELS[targetType];
  if (!Model) {
    return null;
  }
  const exists = await Model.exists({ _id: targetId });
  return exists ? Model : null;
};

const normaliseDistribution = (buckets = []) => {
  const base = buildDistributionSkeleton();
  buckets.forEach((entry) => {
    const score = Number(entry._id);
    const bucket = base.find((item) => item.score === score);
    if (bucket) {
      bucket.count = entry.count;
    }
  });
  return base;
};

export const computeRatingSnapshot = async (targetType, targetId, { updateAggregate = true } = {}) => {
  const [result] = await Rating.aggregate([
    { $match: { targetType, target: targetId } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              average: { $avg: '$score' },
              count: { $sum: 1 },
            },
          },
        ],
        distribution: [
          {
            $group: {
              _id: '$score',
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const averageRaw = result?.summary?.[0]?.average ?? null;
  const count = result?.summary?.[0]?.count ?? 0;
  const average = count > 0 && Number.isFinite(averageRaw) ? Number(averageRaw.toFixed(2)) : null;
  const distribution = normaliseDistribution(result?.distribution || []);

  if (updateAggregate) {
    const Model = TARGET_MODELS[targetType];
    if (Model) {
      await Model.findByIdAndUpdate(targetId, {
        rating: average,
        ratingsCount: count,
      });
    }
  }

  return { average, count, distribution };
};

export const fetchUserRating = async (targetType, targetId, userId) => {
  if (!userId) return null;
  return Rating.findOne({ targetType, target: targetId, user: userId }).lean();
};
