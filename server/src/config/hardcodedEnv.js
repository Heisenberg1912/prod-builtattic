import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnvFile } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dedupe = (value, index, array) => array.indexOf(value) === index;
const candidateEnvFiles = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
]
  .filter(Boolean)
  .map((filePath) => path.resolve(filePath))
  .filter(dedupe);

for (const envPath of candidateEnvFiles) {
  if (!fs.existsSync(envPath)) {
    continue;
  }
  loadEnvFile({ path: envPath, override: false });
}

const parseBoolean = (value, defaultValue = true) => {
  if (typeof value === 'undefined' || value === null) {
    return defaultValue;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'on', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'off', 'disabled'].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const featureFlags = {
  gemini: parseBoolean(process.env.GEMINI_ENABLED, true),
};

process.env.GEMINI_ENABLED = featureFlags.gemini ? 'true' : 'false';

const requiredEnvVars = [
  { key: 'MONGO_URI', description: 'MongoDB connection string' },
  { key: 'MONGO_DBNAME', description: 'MongoDB database name' },
  { key: 'JWT_SECRET', description: 'JWT secret for legacy tokens' },
  { key: 'JWT_ACCESS_SECRET', description: 'JWT secret for access tokens' },
  { key: 'JWT_REFRESH_SECRET', description: 'JWT secret for refresh tokens' },
  { key: 'EMAIL_USER', description: 'Transactional email account' },
  { key: 'EMAIL_PASS', description: 'Transactional email password or app password' },
  { key: 'EMAIL_FROM', description: 'Default email from header' },
  { key: 'FILE_ENCRYPTION_KEY', description: 'Hex or passphrase used for encrypting stored files' },
  { key: 'ASSET_TOKEN_SECRET', description: 'Secret used to sign secure asset download tokens' },
  { key: 'REDIS_URL', description: 'Redis connection string' },
  {
    key: 'GEMINI_API_KEY',
    description: 'Gemini API key',
    requiredWhen: () => featureFlags.gemini,
  },
  {
    key: 'GEMINI_MODEL',
    description: 'Gemini text model identifier',
    requiredWhen: () => featureFlags.gemini,
  },
  {
    key: 'GEMINI_IMAGE_MODEL',
    description: 'Gemini image model identifier',
    requiredWhen: () => featureFlags.gemini,
  },
  { key: 'OPENWEATHER_API_KEY', description: 'OpenWeather API key' },
  { key: 'CORS_ORIGIN', description: 'Comma separated list of allowed origins' },
];

const missingEnv = requiredEnvVars
  .filter(({ requiredWhen }) => (typeof requiredWhen === 'function' ? requiredWhen() : true))
  .map(({ key }) => {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return null;
    }
    return key;
  })
  .filter(Boolean);

if (missingEnv.length > 0) {
  const message = 'Missing required environment variables: ' + missingEnv.join(', ');
  console.error(message);
  throw new Error(message);
}

const corsOrigins = process.env.CORS_ORIGIN.split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (corsOrigins.length === 0) {
  throw new Error('CORS_ORIGIN must contain at least one allowed origin');
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.CORS_ORIGIN.trim() === '*'
) {
  throw new Error('CORS_ORIGIN cannot be "*" in production');
}
