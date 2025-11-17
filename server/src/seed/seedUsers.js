import '../config/hardcodedEnv.js';
import mongoose from 'mongoose';
import argon2 from 'argon2';

import User from '../models/User.js';
import { defaultSettings } from '../controllers/settingsController.js';

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const mongoDbName = process.env.MONGO_DBNAME || process.env.MONGODB_DBNAME;

if (!mongoUri) {
  console.error('Missing MONGO_URI or MONGODB_URI for seeding users.');
  process.exit(1);
}

const buildDemoSettings = (overrides = {}, email) => {
  const next = {
    notifications: { ...defaultSettings.notifications, ...(overrides.notifications || {}) },
    privacy: { ...defaultSettings.privacy, ...(overrides.privacy || {}) },
    security: { ...defaultSettings.security, ...(overrides.security || {}) },
    profile: { ...defaultSettings.profile, ...(overrides.profile || {}) },
  };
  if (!next.profile.email) {
    next.profile.email = email;
  }
  return next;
};

const seedUsers = [
  {
    email: process.env.SUPER_ADMIN_EMAIL?.toLowerCase() || 'superadmin@builtattic.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'Super#123',
    role: 'superadmin',
    rolesGlobal: ['superadmin'],
    settingsOverrides: {
      profile: {
        fullName: 'Super Admin',
        company: 'Builtattic HQ',
        jobTitle: 'Platform Owner',
        pronouns: 'She / Her',
        timezone: 'America/Los_Angeles',
        location: 'San Francisco, CA',
        phone: '+1 415 555 0110',
        website: 'https://builtattic.com',
        bio: 'Oversees every workspace and rollout.',
      },
      notifications: { digestFrequency: 'daily', productTips: false },
      security: { twoStep: true, deviceVerification: true },
    },
  },
  {
    email: 'admin@builtattic.com',
    password: 'Admin#123',
    role: 'admin',
    rolesGlobal: ['admin'],
    settingsOverrides: {
      profile: {
        fullName: 'Platform Admin',
        company: 'Builtattic Ops',
        jobTitle: 'Operations Lead',
        pronouns: 'He / Him',
        timezone: 'America/New_York',
        location: 'New York, NY',
        phone: '+1 212 555 0199',
        website: 'https://builtattic.com/ops',
        bio: 'Keeps orders, vendors, and finance in sync.',
      },
      notifications: { digestFrequency: 'weekly' },
      security: { loginAlerts: true },
    },
  },
  {
    email: 'associate@builtattic.com',
    password: 'Associate#123',
    role: 'associate',
    settingsOverrides: {
      profile: {
        fullName: 'Aanya Sharma',
        company: 'Freelance BIM Studio',
        jobTitle: 'Design Associate',
        pronouns: 'She / Her',
        timezone: 'Asia/Kolkata',
        location: 'Bengaluru, India',
        phone: '+91 98765 43210',
        website: 'https://portfolio.builtattic.com/aanya',
        bio: 'Specialises in BIM coordination for immersive studios.',
      },
      notifications: { smsAlerts: true },
      privacy: { searchVisibility: true },
    },
  },
  {
    email: 'client@builtattic.com',
    password: 'Client#123',
    role: 'client',
    settingsOverrides: {
      profile: {
        fullName: 'Client (Business)',
        company: 'Northwind Partners',
        jobTitle: 'Procurement Lead',
        pronouns: 'They / Them',
        timezone: 'Europe/London',
        location: 'London, UK',
        phone: '+44 20 7123 4567',
        website: 'https://northwindpartners.com',
        bio: 'Runs procurement for hospitality build-outs across EMEA.',
      },
      notifications: { orderUpdates: true, digestFrequency: 'weekly' },
      privacy: { retainData: true },
    },
  },
  {
    email: 'firm@builtattic.com',
    password: 'Firm#123',
    role: 'firm',
    settingsOverrides: {
      profile: {
        fullName: 'Studio Admin',
        company: 'Builtattic Studio',
        jobTitle: 'Creative Director',
        pronouns: 'He / Him',
        timezone: 'Europe/Berlin',
        location: 'Berlin, Germany',
        phone: '+49 30 1234 5678',
        website: 'https://builtattic.studio',
        bio: 'Publishes concept bundles and coordinates pitch decks.',
      },
      notifications: { partnerAnnouncements: true, productTips: true },
      privacy: { shareAnalytics: true },
    },
  },
  {
    email: 'vendor@builtattic.com',
    password: 'Vendor#123',
    role: 'vendor',
    settingsOverrides: {
      profile: {
        fullName: 'Vendor Ops',
        company: 'Material Studio',
        jobTitle: 'Supply Chain Manager',
        pronouns: 'She / Her',
        timezone: 'Asia/Singapore',
        location: 'Singapore',
        phone: '+65 6123 4560',
        website: 'https://materialstudio.sg',
        bio: 'Keeps logistics, SKUs, and drops aligned.',
      },
      notifications: { smsAlerts: true, digestFrequency: 'daily' },
      security: { loginAlerts: true },
    },
  },
  {
    email: 'user@builtattic.com',
    password: 'User#123',
    role: 'user',
    settingsOverrides: {
      profile: {
        fullName: 'Marketplace User',
        company: 'Independent',
        jobTitle: 'Design Enthusiast',
        pronouns: 'They / Them',
        timezone: 'Australia/Sydney',
        location: 'Sydney, AU',
        phone: '+61 2 5550 1234',
        website: 'https://builtattic.com/members/user',
        bio: 'Tracks drops, saved studios, and materials.',
      },
      notifications: { digestFrequency: 'monthly', productTips: true },
      privacy: { profileIndexing: false },
    },
  },
];

async function run() {
  console.log('Connecting to Mongo...');
  await mongoose.connect(mongoUri, mongoDbName ? { dbName: mongoDbName } : {});
  console.log('Connected.');

  for (const seed of seedUsers) {
    const email = seed.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) {
      console.log(`Skipping ${email}, already exists`);
      continue;
    }
    const passHash = await argon2.hash(seed.password);
    const settings = buildDemoSettings(seed.settingsOverrides, email);
    await User.create({
      email,
      passHash,
      role: seed.role,
      rolesGlobal: seed.rolesGlobal || [],
      isClient: seed.role === 'client',
      settings,
      isEmailVerified: true,
      twoFactorEnabled: true,
    });
    console.log(`Seeded ${email}`);
  }

  console.log('\nLogin credentials (plaintext before hashing):');
  console.table(
    seedUsers.map((user) => ({ role: user.role, email: user.email, password: user.password }))
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
