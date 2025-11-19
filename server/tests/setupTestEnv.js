const ensureEnv = (key, value) => {
  if (!process.env[key] || process.env[key].length === 0) {
    process.env[key] = value;
  }
};

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.GEMINI_ENABLED = 'false';
process.env.USE_IN_MEMORY_DB = 'true';

ensureEnv('MONGO_URI', 'mongodb://127.0.0.1:27017/builtattic_test');
ensureEnv('MONGO_DBNAME', 'builtattic_test');
ensureEnv('JWT_SECRET', 'test-jwt-secret');
ensureEnv('JWT_ACCESS_SECRET', 'test-access-secret');
ensureEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');
ensureEnv('EMAIL_USER', 'alerts@example.com');
ensureEnv('EMAIL_PASS', 'password');
ensureEnv('EMAIL_FROM', 'Builtattic <alerts@example.com>');
ensureEnv('FILE_ENCRYPTION_KEY', '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
ensureEnv('ASSET_TOKEN_SECRET', 'asset-token-secret');
ensureEnv('GEMINI_API_KEY', 'disabled');
ensureEnv('GEMINI_MODEL', 'disabled');
ensureEnv('GEMINI_IMAGE_MODEL', 'disabled');
ensureEnv('OPENWEATHER_API_KEY', 'test-openweather');
ensureEnv('CORS_ORIGIN', 'http://localhost:5175');
ensureEnv('CLIENT_ORIGIN', 'http://localhost:5175');
ensureEnv('CLIENT_URL', 'http://localhost:5175');
ensureEnv('ADMIN_ALERT_EMAIL', 'ops@example.com');
ensureEnv('SUPER_ADMIN_EMAIL', 'superadmin@example.com');
ensureEnv('SUPER_ADMIN_PASSWORD', 'SuperSecret#123');
ensureEnv('SERVICE_NAME', 'builtattic-server-test');
