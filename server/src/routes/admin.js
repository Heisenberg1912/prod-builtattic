import crypto from 'node:crypto';
import { Router } from 'express';
import argon2 from 'argon2';
import mongoose from 'mongoose';

import Firm from '../models/Firm.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import AssociateProfile from '../models/AssociateProfile.js';
import Cart from '../models/Cart.js';
import Asset from '../models/Asset.js';
import OTP from '../models/OTP.js';
import StudioRequest from '../models/StudioRequest.js';
import DummyCatalogEntry from '../models/DummyCatalogEntry.js';
import { requireAuth, requireGlobal } from '../rbac/guards.js';
import { sendSignupCredentialsEmail, sendAdminNotificationEmail } from '../services/email/emailService.js';
import { validateEmailDeliverability } from '../utils/emailValidation.js';
import logger from '../utils/logger.js';
import { normalizeDummyPayload, mapCatalogEntry, DUMMY_TYPES } from '../utils/dummyCatalog.js';

const router = Router();

const ADMIN_USER_SELECT = 'email role rolesGlobal memberships isClient createdAt updatedAt isSuspended lastLoginAt';

const sanitizeRegex = (input) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serializeUser = (doc) => ({
  _id: doc._id,
  email: doc.email,
  role: doc.role,
  rolesGlobal: doc.rolesGlobal || [],
  memberships: doc.memberships || [],
  isClient: doc.isClient,
  isSuspended: doc.isSuspended || false,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  lastLoginAt: doc.lastLoginAt || null,
});

router.get(
  '/admin/vendors',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (_req, res) => {
    const firms = await Firm.find({}).limit(250).lean();
    res.json({ ok: true, firms });
  }
);

router.get(
  '/admin/studio-requests',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const [requests, totalCount, openCount, byStatus, bySource] = await Promise.all([
      StudioRequest.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('firm', 'name slug hosting')
        .lean(),
      StudioRequest.countDocuments({}),
      StudioRequest.countDocuments({ status: { $in: ['new', 'in-progress'] } }),
      StudioRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { _id: 0, status: '$_id', count: 1 } },
      ]),
      StudioRequest.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $project: { _id: 0, source: '$_id', count: 1 } },
      ]),
    ]);

    res.json({
      ok: true,
      requests,
      metrics: {
        total: totalCount,
        open: openCount,
        byStatus,
        bySource,
      },
    });
  }
);

router.get(
  '/admin/users',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
    const searchRaw = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const query = {};
    if (searchRaw) {
      const regex = new RegExp(sanitizeRegex(searchRaw), 'i');
      query.$or = [{ email: regex }, { role: regex }];
    }
    const users = await User.find(query)
      .select(ADMIN_USER_SELECT)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ ok: true, users });
  }
);

router.post(
  '/admin/users',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const emailRaw = req.body?.email;
    const role = req.body?.role || 'user';
    if (!emailRaw) {
      return res.status(400).json({ ok: false, error: 'email_required' });
    }
    const email = String(emailRaw).trim().toLowerCase();
    const deliverable = await validateEmailDeliverability(email);
    if (!deliverable) {
      return res.status(400).json({ ok: false, error: 'email_unreachable' });
    }
    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ ok: false, error: 'email_exists' });
    }

    const password = (req.body?.password && String(req.body.password).trim()) || crypto.randomBytes(6).toString('base64url');
    const passHash = await argon2.hash(password);
    const rolesGlobal = [];
    if (role === 'superadmin') rolesGlobal.push('superadmin');
    else if (role === 'admin') rolesGlobal.push('admin');

    const user = await User.create({
      email,
      passHash,
      role,
      rolesGlobal,
      isClient: role === 'client',
      memberships: [],
    });

    try {
      await sendSignupCredentialsEmail({
        to: email,
        password,
        role,
        loginUrl: process.env.CLIENT_LOGIN_URL || process.env.APP_BASE_URL || undefined,
      });
    } catch (error) {
      logger.warn('admin_invite_email_failed', { email, error: error.message });
    }

    const inviterLabel =
      req.user?.email ||
      req.user?.name ||
      (req.user && req.user._id ? 'user:' + req.user._id : 'admin_panel');
    try {
      await sendAdminNotificationEmail({
        subject: `New ${role} invited (${email})`,
        html: `
          <p>${inviterLabel} invited <strong>${email}</strong> as <strong>${role}</strong>.</p>
          <p>The user received a temporary password by email.</p>
        `,
        text: `${inviterLabel} invited ${email} as ${role}. Credentials sent directly to the user.`,
      });
    } catch (error) {
      logger.warn('admin_invite_notification_failed', { email, error: error.message });
    }

    res.status(201).json({ ok: true, user: serializeUser(user) });
  }
);

router.patch(
  '/admin/users/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const { role, rolesGlobal, isSuspended } = req.body || {};
    const update = {};

    if (role) {
      update.role = role;
      update.isClient = role === 'client';
      if (role === 'superadmin') {
        update.rolesGlobal = ['superadmin'];
      } else if (role === 'admin') {
        update.rolesGlobal = ['admin'];
      } else if (!Array.isArray(rolesGlobal)) {
        update.rolesGlobal = [];
      }
      if (String(req.user._id) === req.params.id && role !== 'superadmin') {
        return res.status(400).json({ ok: false, error: 'cannot_downgrade_self' });
      }
    }

    if (Array.isArray(rolesGlobal)) {
      const normalized = rolesGlobal
        .map((entry) => String(entry).toLowerCase())
        .filter((entry) => entry === 'admin' || entry === 'superadmin');
      update.rolesGlobal = normalized;
    }

    if (typeof isSuspended === 'boolean') {
      if (String(req.user._id) === req.params.id && isSuspended) {
        return res.status(400).json({ ok: false, error: 'cannot_suspend_self' });
      }
      update.isSuspended = isSuspended;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    )
      .select(ADMIN_USER_SELECT)
      .lean();

    if (!user) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }

    res.json({ ok: true, user });
  }
);

const getDummyCatalogSnapshot = async () => {
  const [designDocs, skillDocs, materialDocs] = await Promise.all([
    DummyCatalogEntry.find({ type: 'design' }).sort({ updatedAt: -1 }).lean(),
    DummyCatalogEntry.find({ type: 'skill' }).sort({ updatedAt: -1 }).lean(),
    DummyCatalogEntry.find({ type: 'material' }).sort({ updatedAt: -1 }).lean(),
  ]);

  return {
    design: designDocs.map(mapCatalogEntry).filter(Boolean),
    skill: skillDocs.map(mapCatalogEntry).filter(Boolean),
    material: materialDocs.map(mapCatalogEntry).filter(Boolean),
  };
};

router.get(
  '/admin/catalog',
  requireAuth,
  requireGlobal('superadmin'),
  async (_req, res) => {
    try {
      const catalog = await getDummyCatalogSnapshot();
      res.json({ ok: true, ...catalog });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

router.post(
  '/admin/catalog/:type',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const type = String(req.params?.type || '').toLowerCase();
    if (!DUMMY_TYPES.has(type)) {
      return res.status(400).json({ ok: false, error: 'invalid_catalog_type' });
    }
    try {
      const _id = new mongoose.Types.ObjectId();
      const normalized = normalizeDummyPayload(type, req.body || {}, { id: _id.toString() });
      await DummyCatalogEntry.create({
        _id,
        type,
        payload: normalized,
        createdBy: req.user?._id || null,
      });
      res.status(201).json({ ok: true, entry: normalized });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

router.delete(
  '/admin/catalog/:type/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const type = String(req.params?.type || '').toLowerCase();
    if (!DUMMY_TYPES.has(type)) {
      return res.status(400).json({ ok: false, error: 'invalid_catalog_type' });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'invalid_catalog_id' });
    }
    try {
      const deleted = await DummyCatalogEntry.findOneAndDelete({ _id: id, type }).lean();
      if (!deleted) {
        return res.status(404).json({ ok: false, error: 'catalog_entry_not_found' });
      }
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
);

router.post(
  '/admin/users/:id/reset-password',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }
    const tempPassword = crypto.randomBytes(6).toString('base64url');
    const passHash = await argon2.hash(tempPassword);
    await User.updateOne({ _id: user._id }, { $set: { passHash } });

    try {
      await sendSignupCredentialsEmail({
        to: user.email,
        password: tempPassword,
        role: user.role,
        loginUrl: process.env.CLIENT_LOGIN_URL || process.env.APP_BASE_URL || undefined,
      });
    } catch (error) {
      logger.warn('admin_reset_email_failed', { user: String(user._id), error: error.message });
    }

    const requesterLabel =
      req.user?.email ||
      req.user?.name ||
      (req.user && req.user._id ? 'user:' + req.user._id : 'admin_panel');
    try {
      await sendAdminNotificationEmail({
        subject: `Password reset triggered for ${user.email}`,
        html: `
          <p>${requesterLabel} issued an admin password reset.</p>
          <ul>
            <li>User: <strong>${user.email}</strong></li>
            <li>Role: ${user.role}</li>
          </ul>
        `,
        text: `${requesterLabel} reset the password for ${user.email} (${user.role}).`,
      });
    } catch (error) {
      logger.warn('admin_reset_notification_failed', { user: String(user._id), error: error.message });
    }

    res.json({ ok: true });
  }
);

router.delete(
  '/admin/users/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ ok: false, error: 'user_id_required' });
    }

    if (String(req.user?._id) === String(targetId)) {
      return res.status(400).json({ ok: false, error: 'cannot_delete_self' });
    }

    const deleted = await User.findByIdAndDelete(targetId).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'user_not_found' });
    }

    res.json({ ok: true, user: serializeUser(deleted) });
  }
);

const ADMIN_DATA_RESOURCES = {
  users: {
    model: User,
    label: 'Users',
    searchFields: ['email', 'role'],
  },
  firms: {
    model: Firm,
    label: 'Firms',
    searchFields: ['name', 'slug', 'contact.email'],
  },
  products: {
    model: Product,
    label: 'Products',
    searchFields: ['title', 'slug', 'kind'],
  },
  orders: {
    model: Order,
    label: 'Orders',
    searchFields: ['status'],
  },
  associates: {
    model: AssociateProfile,
    label: 'Associate Profiles',
    searchFields: ['title', 'location'],
  },
  carts: {
    model: Cart,
    label: 'Carts',
  },
  assets: {
    model: Asset,
    label: 'Assets',
    searchFields: ['originalName', 'mimeType', 'kind'],
  },
  otps: {
    model: OTP,
    label: 'OTP codes',
    searchFields: ['email', 'purpose'],
  },
};

const normalizeResourceKey = (value) => String(value || '').trim().toLowerCase();

const resolveResourceConfig = (value) => ADMIN_DATA_RESOURCES[normalizeResourceKey(value)];

const buildSearchFilter = (term, fields = []) => {
  if (!term || !fields.length) return null;
  const regex = new RegExp(sanitizeRegex(term), 'i');
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

router.get(
  '/admin/data',
  requireAuth,
  requireGlobal('superadmin'),
  (_req, res) => {
    const resources = Object.entries(ADMIN_DATA_RESOURCES).map(([key, config]) => ({
      key,
      label: config.label || key,
    }));
    res.json({ ok: true, resources });
  }
);

router.get(
  '/admin/data/:resource',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const config = resolveResourceConfig(req.params.resource);
    if (!config) {
      return res.status(404).json({ ok: false, error: 'resource_not_supported' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const filter = {};

    const idParam = req.query.id;
    if (typeof idParam === 'string' && mongoose.isValidObjectId(idParam)) {
      filter._id = idParam;
    }

    const searchTerm = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const searchFilter = buildSearchFilter(searchTerm, config.searchFields);
    const finalFilter = searchFilter ? { ...filter, ...searchFilter } : filter;

    const cursor = config.model
      .find(finalFilter)
      .sort(config.sort || { updatedAt: -1 })
      .limit(limit)
      .lean();

    const items = await cursor;
    res.json({ ok: true, items, meta: { count: items.length, limit } });
  }
);

router.get(
  '/admin/data/:resource/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const config = resolveResourceConfig(req.params.resource);
    if (!config) {
      return res.status(404).json({ ok: false, error: 'resource_not_supported' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'invalid_id' });
    }
    const item = await config.model.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true, item });
  }
);

router.post(
  '/admin/data/:resource',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const config = resolveResourceConfig(req.params.resource);
    if (!config) {
      return res.status(404).json({ ok: false, error: 'resource_not_supported' });
    }
    const payload = req.body || {};
    try {
      const doc = await config.model.create(payload);
      res.status(201).json({ ok: true, item: doc.toObject({ versionKey: false }) });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  }
);

router.patch(
  '/admin/data/:resource/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const config = resolveResourceConfig(req.params.resource);
    if (!config) {
      return res.status(404).json({ ok: false, error: 'resource_not_supported' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'invalid_id' });
    }
    try {
      const updated = await config.model
        .findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true, runValidators: false })
        .lean();
      if (!updated) {
        return res.status(404).json({ ok: false, error: 'not_found' });
      }
      res.json({ ok: true, item: updated });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  }
);

router.delete(
  '/admin/data/:resource/:id',
  requireAuth,
  requireGlobal('superadmin'),
  async (req, res) => {
    const config = resolveResourceConfig(req.params.resource);
    if (!config) {
      return res.status(404).json({ ok: false, error: 'resource_not_supported' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ ok: false, error: 'invalid_id' });
    }
    const deleted = await config.model.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'not_found' });
    }
    res.json({ ok: true, item: deleted });
  }
);

router.patch(
  '/admin/vendors/:id/approve',
  requireAuth,
  requireGlobal('admin', 'superadmin'),
  async (req, res) => {
    const firm = await Firm.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.json({ ok: true, firm });
  }
);

router.get(
  '/admin/db/overview',
  requireAuth,
  requireGlobal('superadmin'),
  async (_req, res) => {
    const connection = mongoose.connection;
    if (!connection?.db) {
      return res.status(503).json({ ok: false, error: 'db_unavailable' });
    }

    try {
      const db = connection.db;
      const admin = db.admin();

      const [dbStats, serverStatus, collectionsMeta] = await Promise.all([
        db.stats().catch(() => null),
        admin.serverStatus().catch(() => null),
        db.listCollections().toArray().catch(() => []),
      ]);

      const trackedCollections = [
        'users',
        'firms',
        'orders',
        'products',
        'otps',
        'carts',
        'assets',
        'supportthreads',
        'documents',
      ];

      const discovered = collectionsMeta
        .map((entry) => entry?.name)
        .filter((name) => name && !name.startsWith('system.'));

      const collectionNames = Array.from(
        new Set([...trackedCollections, ...discovered])
      ).slice(0, 12);

      const collectionSummaries = (
        await Promise.all(
          collectionNames.map(async (name) => {
            try {
              const collection = db.collection(name);
              const [count, stats] = await Promise.all([
                collection.estimatedDocumentCount().catch(() => null),
                collection.stats().catch(() => null),
              ]);
              const documents = stats?.count ?? count ?? 0;
              return {
                name,
                documents,
                storageSize: stats?.storageSize ?? null,
                avgObjSize: stats?.avgObjSize ?? null,
                capped: Boolean(stats?.capped),
              };
            } catch (error) {
              logger.debug('collection_stats_failed', { name, error: error.message });
              return null;
            }
          })
        )
      )
        .filter(Boolean)
        .sort((a, b) => (b.documents || 0) - (a.documents || 0))
        .slice(0, 10);

      const safeHost = (() => {
        try {
          const parsed = new URL(process.env.MONGO_URI);
          const port = parsed.port ? `:${parsed.port}` : '';
          return `${parsed.protocol}//${parsed.hostname}${port}`;
        } catch {
          return null;
        }
      })();

      res.json({
        ok: true,
        overview: {
          fetchedAt: new Date().toISOString(),
          db: {
            name: dbStats?.db || db.databaseName,
            host: safeHost,
            collections: dbStats?.collections ?? collectionSummaries.length,
            objects: dbStats?.objects ?? null,
            dataSize: dbStats?.dataSize ?? null,
            storageSize: dbStats?.storageSize ?? null,
            indexSize: dbStats?.indexSize ?? null,
            avgObjSize: dbStats?.avgObjSize ?? null,
          },
          server: serverStatus
            ? {
                version: serverStatus.version,
                process: serverStatus.process,
                uptimeSeconds: serverStatus.uptime,
                connections: serverStatus.connections?.current ?? null,
                memoryMb: serverStatus.mem?.resident ?? null,
              }
            : null,
          collections: collectionSummaries,
        },
      });
    } catch (error) {
      logger.error('admin_db_overview_failed', { error: error.message });
      res.status(500).json({ ok: false, error: 'db_overview_failed' });
    }
  }
);

export default router;
