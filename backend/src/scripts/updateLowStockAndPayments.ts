import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Product, Settings } from '../models';

async function updateDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not found');

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas');

  const prodRes = await Product.updateMany({}, { $set: { lowStockThreshold: 10 } });
  console.log('Updated products lowStockThreshold to 10:', prodRes.modifiedCount);

  const setRes = await Settings.updateMany({}, { 
    $set: { 
      defaultLowStockThreshold: 10,
      enabledPaymentMethods: ['cash', 'upi']
    } 
  });
  console.log('Updated settings (lowStockThreshold=10, methods=[cash, upi]):', setRes.modifiedCount);

  const lowProducts = await Product.find({ currentStock: { $lt: 10 } }).select('name sku currentStock lowStockThreshold').sort({ currentStock: 1 });
  console.log(`Found ${lowProducts.length} products with currentStock < 10:`);
  for (const p of lowProducts) {
    console.log(` - [${p.sku}] ${p.name}: currentStock = ${p.currentStock}`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

updateDb().catch(console.error);
