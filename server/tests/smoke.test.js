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
import { redis } from '../src/config/redis.js';

const accessSecret = process.env.JWT_ACCESS_SECRET || 'test-access-secret';

const createTokenForUser = (user) =>
  jwt.sign({ _id: user._id.toString(), role: user.role }, accessSecret, {
    expiresIn: '1h',
  });

const createAssociateUser = async (overrides = {}) => {
  const user = await User.create({
    email: overrides.email || `associate-${Date.now()}@test.com`,
    passHash: overrides.passHash || 'hash',
    role: 'associate',
    memberships: overrides.memberships || [],
  });
  return { user, token: createTokenForUser(user) };
};

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
  if (redis && typeof redis.quit === 'function') {
    try {
      await redis.quit();
    } catch {
      if (typeof redis.disconnect === 'function') {
        redis.disconnect();
      }
    }
  }
});

test.beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
});

test('Vitruvi analyze falls back to heuristics when Gemini disabled', { concurrency: false }, async () => {
  const response = await request(app)
    .post('/api/vitruvi/analyze')
    .send({
      prompt: 'Design a 2 bedroom passive home with courtyards',
      options: { style: 'modern' },
    })
    .expect(200);

  assert.ok(response.body.analysis, 'analysis payload missing');
  assert.equal(response.body.source, 'heuristic');
  assert.ok(response.body.unitEconomy?.tokenEstimate);
});

test('Plan upload CRUD flow works for associates', { concurrency: false }, async () => {
  const { token } = await createAssociateUser();
  const payload = {
    projectTitle: 'Courtyard Residence',
    category: 'Residential',
    areaSqft: 2400,
    tags: ['modern', 'villa'],
  };

  const createRes = await request(app)
    .post('/api/plan-uploads')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);

  const planId = createRes.body?.planUpload?.id;
  assert.ok(planId, 'plan id missing from create response');

  const listRes = await request(app)
    .get('/api/plan-uploads')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.ok(
    Array.isArray(listRes.body.planUploads) &&
      listRes.body.planUploads.some((plan) => plan.id === planId),
    'plan missing from listing response',
  );

  const updateRes = await request(app)
    .patch(`/api/plan-uploads/${planId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ description: 'Updated summary' })
    .expect(200);

  assert.equal(updateRes.body?.planUpload?.description, 'Updated summary');

  await request(app)
    .delete(`/api/plan-uploads/${planId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});

test('Studio creation and publish flow responds successfully', { concurrency: false }, async () => {
  const { token } = await createFirmUser();
  const studioPayload = {
    title: 'Aurora Studio Suite',
    summary: 'Compact prefab kit optimised for tropical builds.',
    price: 125000,
    areaSqft: 1800,
    highlights: ['3 bedrooms', 'Rooftop deck'],
    gallery: ['https://example.com/hero.jpg'],
    category: 'Residential',
    tags: ['prefab'],
  };

  const createRes = await request(app)
    .post('/api/portal/studio/studios')
    .set('Authorization', `Bearer ${token}`)
    .send(studioPayload)
    .expect(201);

  const studioId = createRes.body?.studio?._id?.toString();
  assert.ok(studioId, 'studio id missing after creation');

  const publishRes = await request(app)
    .post(`/api/portal/studio/studios/${studioId}/publish`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(publishRes.body?.studio?.status, 'published');
});

test('Workspace download processing completes inline when workers disabled', { concurrency: false }, async () => {
  const { token } = await createAssociateUser();
  const createRes = await request(app)
    .post('/api/workspace-downloads')
    .set('Authorization', `Bearer ${token}`)
    .send({
      label: 'Docs bundle',
      fileUrl: 'https://storage.example.com/base.zip',
      description: 'Posting docs to clients',
    })
    .expect(201);

  const downloadId = createRes.body?.download?.id;
  assert.ok(downloadId, 'download id missing');

  const processRes = await request(app)
    .post(`/api/workspace-downloads/${downloadId}/process`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(processRes.body?.mode, 'inline');
  assert.equal(processRes.body?.download?.status, 'released');

  const statusRes = await request(app)
    .get(`/api/workspace-downloads/${downloadId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  assert.equal(statusRes.body?.download?.status, 'released');
  assert.ok(statusRes.body?.download?.metadata?.artifactUrl);
});
