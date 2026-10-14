import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Product, Category, User, StockLedger } from '../models';

export async function runInventoryUpdate() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment');
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas successfully.');

    const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
    if (!adminUser) {
      console.warn('⚠️ No user found in database. Using system fallback for stock ledger.');
    }

    // Load categories
    const categories = await Category.find();
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    for (const cat of categories) {
      categoryMap.set(cat.slug, cat._id as mongoose.Types.ObjectId);
    }

    // Default category fallback
    const fruitCatId = categoryMap.get('fruit-plants') || categories[0]._id;

    // Read 86 products
    const jsonPath = 'C:/Users/akhil/.gemini/antigravity-ide/brain/4b3f241f-350e-4712-9dd7-df9511300a1d/scratch/full_86_products_ready.json';
    const productsData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    console.log(`Loaded ${productsData.length} varieties to update/insert...`);

    let updatedCount = 0;
    let insertedCount = 0;

    for (const p of productsData) {
      const catId = categoryMap.get(p.categorySlug) || fruitCatId;

      // Find existing product by exact or case-insensitive name
      const existing = await Product.findOne({
        name: { $regex: new RegExp(`^${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (existing) {
        // Update product
        existing.localName = p.localName;
        existing.botanicalName = p.botanicalName;
        existing.category = catId;
        existing.unit = p.unit;
        existing.hsn = p.hsn;
        existing.gstRate = p.gstRate;
        existing.taxType = p.taxType;
        existing.taxCategory = p.taxCategory;
        existing.costPrice = p.costPrice;
        existing.sellingPrice = p.sellingPrice;
        existing.openingStock = p.openingStock;
        existing.currentStock = p.currentStock;
        existing.lowStockThreshold = p.lowStockThreshold;
        existing.priceStatus = 'active';
        existing.isActive = true;
        await existing.save();

        // Update / create opening ledger
        await StockLedger.findOneAndUpdate(
          { product: existing._id, movementType: 'opening' },
          {
            product: existing._id,
            productName: existing.name,
            productSku: existing.sku,
            movementType: 'opening',
            quantity: p.openingStock,
            stockBefore: 0,
            stockAfter: p.openingStock,
            reference: 'INVENTORY_UPDATE_2026',
            reason: 'Quotation inventory pricing & stock update',
            user: adminUser?._id,
            userName: adminUser?.name || 'System Admin',
          },
          { upsert: true, new: true }
        );

        updatedCount++;
      } else {
        // Create product
        const newProduct = await Product.create({
          sku: p.sku,
          name: p.name,
          localName: p.localName,
          botanicalName: p.botanicalName,
          category: catId,
          unit: p.unit,
          hsn: p.hsn,
          gstRate: p.gstRate,
          taxType: p.taxType,
          taxCategory: p.taxCategory,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          openingStock: p.openingStock,
          currentStock: p.currentStock,
          lowStockThreshold: p.lowStockThreshold,
          priceStatus: 'active',
          isActive: true,
          images: [],
          needsReconciliation: false,
        });

        await StockLedger.create({
          product: newProduct._id,
          productName: newProduct.name,
          productSku: newProduct.sku,
          movementType: 'opening',
          quantity: p.openingStock,
          stockBefore: 0,
          stockAfter: p.openingStock,
          reference: 'INVENTORY_SEED_2026',
          reason: 'Initial quotation variety seeding',
          user: adminUser?._id,
          userName: adminUser?.name || 'System Admin',
        });

        insertedCount++;
      }
    }

    const totalInDb = await Product.countDocuments();
    const totalPlantsInDb = await Product.countDocuments({
      category: { $in: [categoryMap.get('fruit-plants'), categoryMap.get('ornamental-palms'), categoryMap.get('flowering-plants')] }
    });

    console.log(`\n======================================================`);
    console.log(`✅ INVENTORY UPDATE COMPLETE!`);
    console.log(`   - Varieties updated: ${updatedCount}`);
    console.log(`   - Varieties inserted: ${insertedCount}`);
    console.log(`   - Total Plant Varieties in Database: ${totalPlantsInDb}`);
    console.log(`   - Total Products across all categories: ${totalInDb}`);
    console.log(`======================================================\n`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during inventory update:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  runInventoryUpdate();
}
