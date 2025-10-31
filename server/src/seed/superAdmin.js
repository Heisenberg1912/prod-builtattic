import '../config/hardcodedEnv.js';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import User from '../models/User.js';

function getArg(name, fallback) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : fallback;
}

const email = getArg('email', process.env.SEED_SUPERADMIN_EMAIL || 'arnav@builtattic.com');
const password = getArg('password', process.env.SEED_SUPERADMIN_PASSWORD || 'built2025attic');

if (!email || !password) {
  console.error('Provide --email and --password');
  process.exit(1);
}

async function main() {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DBNAME;
  if (!uri) throw new Error('MONGO_URI missing');
  await mongoose.connect(uri, { dbName });
  console.log('Connected to DB:', dbName);

  const passHash = await argon2.hash(password);
  const res = await User.findOneAndUpdate(
    { email },
    { $set: { email, passHash, rolesGlobal: ['superadmin'] } },
    { upsert: true, new: true }
  ).lean();

  console.log('Superadmin ready:', { _id: res._id, email: res.email, rolesGlobal: res.rolesGlobal });
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
