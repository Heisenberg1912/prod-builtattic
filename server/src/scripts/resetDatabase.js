import '../config/hardcodedEnv.js';
import connectDB from '../config/db.js';

async function resetDatabase() {
  const connection = await connectDB();
  if (!connection) {
    console.error('[reset] Unable to connect to MongoDB. Did you set MONGODB_URI?');
    process.exit(1);
  }

  const dbName = connection.db?.databaseName || '(unknown)';

  try {
    await connection.dropDatabase();
    console.log('[reset] Dropped database ' + dbName);
  } catch (error) {
    console.error('[reset] Failed to drop database:', error.message || error);
    process.exit(1);
  } finally {
    try {
      await connection.close();
    } catch (closeError) {
      console.warn('[reset] Failed to close MongoDB connection', closeError.message || closeError);
    }
  }

  process.exit(0);
}

resetDatabase();
