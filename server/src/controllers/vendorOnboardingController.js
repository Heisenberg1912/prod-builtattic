import mongoose from 'mongoose';
import Firm from '../models/Firm.js';
import Product from '../models/Product.js';
import Lead from '../models/Lead.js';
import Order from '../models/Order.js';
import { ensureFirmMembership, resolveFirmMembership } from '../services/roleProvisioning.js';

const httpError = (status, message, details) => Object.assign(new Error(message), { statusCode: status, details });

const REQUIRED_PROFILE_FIELDS = [
  'companyName',
  'tagline',
  'summary',
  'contactEmail',
  'contactPhone',
  'website',
  'catalogCategories',
  'catalogHighlights',
  'shippingRegions',
];

const pickMembership = async (user) => {
  const membership =
    (await ensureFirmMembership(user, ['owner', 'admin', 'vendor'])) ||
    resolveFirmMembership(user, ['owner', 'admin', 'vendor']);
  return membership && membership.firm ? membership : null;
};

const evaluateProfile = (profile = {}) => {
  const missing = [];
  REQUIRED_PROFILE_FIELDS.forEach((field) => {
    const value = profile[field];
    if (Array.isArray(value)) {
      if (value.length === 0) missing.push(field);
      return;
    }
    if (value === undefined || value === null || String(value).trim() === '') {
      missing.push(field);
    }
  });
  const completeness = Math.round(((REQUIRED_PROFILE_FIELDS.length - missing.length) / REQUIRED_PROFILE_FIELDS.length) * 100);
  return {
    complete: missing.length === 0,
    completeness,
    missing,
  };
};

const mapMaterialPreview = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  status: doc.status,
  price: doc.price ?? doc.pricing?.basePrice ?? null,
  currency: doc.currency ?? doc.pricing?.currency ?? 'USD',
  heroImage: doc.heroImage || (Array.isArray(doc.gallery) ? doc.gallery[0] : null),
  inventory: doc.inventory ?? null,
  updatedAt: doc.updatedAt,
});

const mapLeadPreview = (lead) => ({
  id: lead._id.toString(),
  title: lead.title,
  status: lead.status,
  contact: lead.contact || null,
  updatedAt: lead.updatedAt,
});

const createStep = (id, label, complete, detail, requirements = []) => ({
  id,
  label,
  complete,
  detail,
  requirements,
});

const CLOSED_ORDER_STATUSES = new Set(['fulfilled', 'completed', 'delivered', 'closed']);

export const getVendorOnboarding = async (req, res, next) => {
  try {
    if (!req.user?._id) throw httpError(401, 'Unauthorized');
    const membership = await pickMembership(req.user);
    if (!membership?.firm) {
      throw httpError(403, 'Link your vendor firm to access onboarding');
    }
    const firmId = new mongoose.Types.ObjectId(membership.firm);
    const [firm, materials, leads, orders] = await Promise.all([
      Firm.findById(firmId).lean(),
      Product.find({ firm: firmId, kind: 'material' }).sort({ updatedAt: -1 }).limit(24).lean(),
      Lead.find({ ownerSalesId: req.user._id }).sort({ updatedAt: -1 }).limit(6).lean(),
      Order.find({ 'items.firm': firmId }).sort({ createdAt: -1 }).limit(6).lean(),
    ]);

    if (!firm) throw httpError(404, 'Vendor firm not found');

    const publishedMaterials = materials.filter((item) => item.status === 'published');
    const draftMaterials = materials.length - publishedMaterials.length;
    const inventoryCount = materials.reduce((sum, item) => sum + (Number(item.inventory) || 0), 0);
    const openOrders = orders.filter((order) => !CLOSED_ORDER_STATUSES.has(String(order.status || '').toLowerCase())).length;

    const profileSnapshot = firm.profile || {};
    const profileEvaluation = evaluateProfile(profileSnapshot);
    const hasLogistics =
      Number(profileSnapshot.leadTimeDays) > 0 && Number(profileSnapshot.minOrderQuantity) > 0;
    const catalogReady = publishedMaterials.length > 0;
    const complianceReady = Boolean(firm.approved);

    const steps = [
      createStep(
        'profile',
        'Vendor profile',
        profileEvaluation.complete,
        profileEvaluation.complete
          ? 'Profile complete'
          : 'Add contact + catalog details to finish your profile',
        profileEvaluation.missing
      ),
      createStep(
        'catalog',
        'Material catalogue',
        catalogReady,
        catalogReady ? 'At least one SKU is published' : 'Publish your first SKU to unlock Material Studio visibility',
        catalogReady ? [] : ['Add SKUs', 'Publish at least one SKU']
      ),
      createStep(
        'logistics',
        'Logistics data',
        hasLogistics,
        hasLogistics ? 'Lead time and MOQ shared' : 'Share lead time + MOQ so procurement can filter you in Material Studio',
        hasLogistics ? [] : ['Set lead time', 'Set minimum order quantity']
      ),
      createStep(
        'compliance',
        'Compliance',
        complianceReady,
        complianceReady ? 'Vendor approved' : 'Awaiting approval from Builtattic ops',
        complianceReady ? [] : ['Provide compliance docs', 'Await approval']
      ),
    ];

    const progress = Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);
    const previewMaterials = materials.slice(0, 6).map(mapMaterialPreview);
    const previewLeads = leads.map(mapLeadPreview);

    res.json({
      ok: true,
      firm: {
        id: firm._id.toString(),
        name: firm.name,
        approved: firm.approved,
        profileUpdatedAt: profileSnapshot?.updatedAt || firm.updatedAt,
      },
      onboarding: {
        progress,
        steps,
        profileCompleteness: profileEvaluation.completeness,
      },
      metrics: {
        totalSkus: materials.length,
        publishedSkus: publishedMaterials.length,
        draftSkus: draftMaterials,
        inventoryCount,
        leads: leads.length,
        openOrders,
      },
      preview: {
        materials: previewMaterials,
        leads: previewLeads,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVendorOnboarding,
};
