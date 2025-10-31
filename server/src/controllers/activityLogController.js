import ActivityLog from '../models/ActivityLog.js';

export async function listActivityLogs(req, res) {
  try {
    const { page = 1, limit = 30, sort = '-timestamp', actorId, action, resource } = req.query;
    const q = {};
    if (actorId) q.actorId = actorId;
    if (action) q.action = action;
    if (resource) q.resource = resource;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      ActivityLog.find(q).sort(sort).skip(skip).limit(parseInt(limit)).populate('actorId','name role'),
      ActivityLog.countDocuments(q)
    ]);
    res.json({ data, page: parseInt(page), limit: parseInt(limit), total });
  } catch (err) { res.status(500).json({ message: err.message }); }
}
