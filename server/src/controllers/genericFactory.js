import ActivityLog from '../models/ActivityLog.js';

function buildQuery(query) {
  const { page = 1, limit = 20, sort = '-createdAt', ...filters } = query;
  return { page: parseInt(page), limit: Math.min(parseInt(limit), 100), sort, filters };
}

export function createCrudControllers(Model, modelName) {
  return {
    list: async (req, res) => {
      try {
        const { page, limit, sort, filters } = buildQuery(req.query);
        const q = { ...filters, ...req.scopeFilter };
        const [items, total] = await Promise.all([
          Model.find(q).sort(sort).skip((page - 1) * limit).limit(limit),
          Model.countDocuments(q)
        ]);
        res.json({ data: items, page, limit, total });
      } catch (err) { res.status(500).json({ message: err.message }); }
    },
    create: async (req, res) => {
      try {
        const doc = await Model.create(req.body);
        await ActivityLog.create({ actorId: req.user.id, action: 'create', resource: modelName, resourceId: doc._id, changes: req.body, ip: req.ip });
        res.status(201).json(doc);
      } catch (err) { res.status(400).json({ message: err.message }); }
    },
    update: async (req, res) => {
      try {
        const before = await Model.findOne({ _id: req.params.id, ...req.scopeFilter });
        if (!before) return res.status(404).json({ message: 'Not found' });
        Object.assign(before, req.body);
        await before.save();
        await ActivityLog.create({ actorId: req.user.id, action: 'update', resource: modelName, resourceId: before._id, changes: req.body, ip: req.ip });
        res.json(before);
      } catch (err) { res.status(400).json({ message: err.message }); }
    },
    remove: async (req, res) => {
      try {
        const doc = await Model.findOneAndDelete({ _id: req.params.id, ...req.scopeFilter });
        if (!doc) return res.status(404).json({ message: 'Not found' });
        await ActivityLog.create({ actorId: req.user.id, action: 'delete', resource: modelName, resourceId: doc._id, changes: {}, ip: req.ip });
        res.json({ success: true });
      } catch (err) { res.status(400).json({ message: err.message }); }
    }
  };
}
