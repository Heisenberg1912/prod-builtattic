import '../src/config/hardcodedEnv.js';
import mongoose from 'mongoose';

// import models so their indexes are registered
import User from '../src/models/User.js';
import Firm from '../src/models/Firm.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import Order from '../src/models/Order.js';
import Payout from '../src/models/Payout.js';

async function main() {
  const { MONGO_URI, MONGO_DBNAME } = process.env;
  if (!MONGO_URI) throw new Error('MONGO_URI missing in configuration defaults');

  await mongoose.connect(MONGO_URI, { dbName: MONGO_DBNAME });
  console.log('Connected to', mongoose.connection.name);

  // sync each modelâ€™s indexes
  await User.syncIndexes();
  await Firm.syncIndexes();
  await Product.syncIndexes();
  await Cart.syncIndexes();
  await Order.syncIndexes();
  await Payout.syncIndexes();

  console.log('âœ… Indexes synced');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('âŒ Index sync error:', e);
  process.exit(1);
});
