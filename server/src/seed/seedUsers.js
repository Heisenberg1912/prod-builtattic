import '../config/hardcodedEnv.js';
import mongoose from 'mongoose';
import User from '../models/userModel.js';

const mongoUri = process.env.MONGODB_URI;

const seedUsers = [
  {
    fullName: 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin@123',
    role: 'superadmin',
  },
  {
    fullName: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    fullName: 'Associate User',
    email: 'associate@example.com',
    password: 'Associate123!',
    role: 'associate',
  },
  {
    fullName: 'Client User',
    email: 'client@example.com',
    password: 'Client123!',
    role: 'client',
  },
  {
    fullName: 'Firm User',
    email: 'firm@example.com',
    password: 'Firm123!',
    role: 'firm',
  },
  {
    fullName: 'Vendor User',
    email: 'vendor@example.com',
    password: 'Vendor123!',
    role: 'vendor',
  },
  {
    fullName: 'Basic User',
    email: 'user@example.com',
    password: 'User123!',
    role: 'user',
  },
];

async function run() {
  console.log('Connecting to Mongo...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  const createdCreds = [];

  for (const u of seedUsers) {
    u.email = u.email.toLowerCase(); // ensure lowercase
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`Skip (exists): ${u.email}`);
      continue;
    }
    await User.create(u);
    createdCreds.push({ role: u.role, email: u.email, password: u.password });
    console.log(`Created: ${u.email} (${u.role})`);
  }

  console.log('\nLogin credentials (plaintext passwords BEFORE hashing):');
  console.table(
    seedUsers.map(u => ({
      role: u.role,
      email: u.email,
      password: u.password,
    }))
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

