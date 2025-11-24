import './setupTestEnv.js';

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../src/app.js';
import { ensureInitialised, disconnect } from '../src/bootstrap.js';
import User from '../src/models/User.js';
import Firm from '../src/models/Firm.js';
import Product from '../src/models/Product.js';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'test-access-secret';

const createTokenForUser = (user) =>
  jwt.sign({ _id: user._id.toString(), role: user.role }, accessSecret, {
    expiresIn: '1h',
  });

const createFirmUser = async () => {
  const firm = await Firm.create({
    name: `Test Firm ${Date.now()}`,
    slug: `test-firm-${Date.now()}`,
    approved: true,
  });
  const user = await User.create({
    email: `firm-${Date.now()}@test.com`,
    passHash: 'hash',
    role: 'firm',
    memberships: [{ firm: firm._id, role: 'owner', title: 'Owner' }],
  });
  firm.ownerUserId = user._id;
  await firm.save();
  return { firm, user, token: createTokenForUser(user) };
};

test.before(async () => {
  await ensureInitialised();
});

test.after(async () => {
  await disconnect();
});

test.beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});

test('Firm dashboard returns enriched studio fields', { concurrency: false }, async () => {
  const { firm, token } = await createFirmUser();
  const slug = `aurora-kit-${Date.now()}`;

  await Product.create({
    firm: firm._id,
    title: 'Aurora Kit',
    slug,
    kind: 'studio',
    status: 'published',
    summary: 'Prefab kit optimised for tropical builds.',
    description: 'Detailed description for buyers.',
    price: 125000,
    priceSqft: 140,
    pricing: { basePrice: 125000, currency: 'EUR', unit: 'sq ft' },
    currency: 'eur',
    heroImage: 'https://cdn.example.com/hero.jpg',
    gallery: ['https://cdn.example.com/hero.jpg', 'https://cdn.example.com/gallery-1.jpg'],
    categories: ['Residential', 'Prefab'],
    category: 'Residential',
    primaryCategory: 'Prefab',
    tags: ['fast-track', 'eco'],
    style: 'Modern',
    highlights: ['3 bedrooms', 'Rooftop deck'],
    areaSqft: 1800,
    plotAreaSqft: 2500,
    areaUnit: 'sq ft',
    bedrooms: 3,
    bathrooms: 2,
    floors: 2,
    location: { city: 'Lisbon', country: 'Portugal', timezone: 'Europe/Lisbon' },
    delivery: {
      instructions: 'Online handover',
      fulfilmentType: 'digital',
      includesInstallation: false,
      handoverMethod: 'download',
      leadTimeWeeks: 4,
      items: ['CAD set', 'BIM model'],
    },
    metrics: { areaSqft: 1800, plotAreaSqft: 2500, areaUnit: 'sq ft' },
    metadata: { bedrooms: 3, bathrooms: 2, floors: 2 },
  });

  const res = await request(app)
    .get('/api/dashboard/firm')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.ok(Array.isArray(res.body?.studios), 'studios array missing');
  assert.equal(res.body.studios.length, 1, 'expected one studio in dashboard payload');

  const studio = res.body.studios[0];
  assert.equal(studio.slug, slug);
  assert.equal(studio.heroImage, 'https://cdn.example.com/hero.jpg');
  assert.deepEqual(studio.gallery, ['https://cdn.example.com/hero.jpg', 'https://cdn.example.com/gallery-1.jpg']);
  assert.equal(studio.summary, 'Prefab kit optimised for tropical builds.');
  assert.equal(studio.description, 'Detailed description for buyers.');
  assert.equal(studio.price, 125000);
  assert.equal(studio.priceSqft, 140);
  assert.equal(studio.currency, 'EUR'); // pricing.currency takes precedence
  assert.deepEqual(studio.categories, ['Residential', 'Prefab']);
  assert.equal(studio.category, 'Residential');
  assert.deepEqual(studio.tags, ['fast-track', 'eco']);
  assert.equal(studio.style, 'Modern');
  assert.deepEqual(studio.highlights, ['3 bedrooms', 'Rooftop deck']);
  assert.equal(studio.areaSqft, 1800);
  assert.equal(studio.plotAreaSqft, 2500);
  assert.equal(studio.areaUnit, 'sq ft');
  assert.equal(studio.bedrooms, 3);
  assert.equal(studio.bathrooms, 2);
  assert.equal(studio.floors, 2);
  assert.equal(studio.location.city, 'Lisbon');
  assert.equal(studio.location.country, 'Portugal');
  assert.equal(studio.delivery.instructions, 'Online handover');
});
