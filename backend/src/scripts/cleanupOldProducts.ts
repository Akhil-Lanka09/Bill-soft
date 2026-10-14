import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Product, StockLedger } from '../models';

async function cleanup() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI missing');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas');

  // Find all products whose SKU does NOT start with VN-PL-
  const oldProducts = await Product.find({ sku: { $not: /^VN-PL-/ } });
  console.log(`Found ${oldProducts.length} old sample products to remove.`);

  const oldIds = oldProducts.map(p => p._id);

  const ledgerRes = await StockLedger.deleteMany({ product: { $in: oldIds } });
  console.log(`Deleted ${ledgerRes.deletedCount} old stock ledger entries.`);

  const prodRes = await Product.deleteMany({ _id: { $in: oldIds } });
  console.log(`Deleted ${prodRes.deletedCount} old products.`);

  const finalCount = await Product.countDocuments();
  console.log(`\n======================================================`);
  console.log(`✅ DATABASE CLEANUP COMPLETE!`);
  console.log(`   Total Products now in database: ${finalCount}`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});
