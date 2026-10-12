import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../config';
import connectDB from '../config/database';
import {
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Settings,
  StockLedger,
  TaxRule,
} from '../models';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    console.log('🌱 Starting Vijaya Nursery Database Seeding...');

    // Clear existing collections if needed
    if (process.argv.includes('--reset')) {
      console.log('⚠️ Resetting database collections...');
      await mongoose.connection.dropDatabase();
    }

    // 1. Seed Settings
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      const pinHash = await bcrypt.hash('9900', config.auth.saltRounds);
      await Settings.create({
        businessName: 'Vijaya Nursery',
        address: 'D.No. 4-12, Near NH-16 Bypass, Kadiyam Road',
        city: 'Rajahmundry',
        state: 'Andhra Pradesh',
        pincode: '533126',
        gstin: '37ABCDE1234F1Z5',
        phone: '+91 98480 22334',
        email: 'contact@vijayanursery.com',
        bankName: 'State Bank of India',
        bankAccount: '38192847192',
        bankIfsc: 'SBIN0001234',
        bankBranch: 'Main Branch',
        upiId: 'vijayanursery@sbi',
        invoicePrefix: 'VN',
        currentFinancialYear: '2026-27',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        gstStateCode: '37',
        maxAgentDiscountPercent: 10,
        maxAgentDiscountAmount: 1000,
        allowNegativeStockSale: false,
        overridePinHash: pinHash,
        invoiceTerms: '1. Live plants are non-returnable once taken outside nursery. 2. Please follow watering instructions provided.',
        receiptFooter: 'Thank you for choosing Vijaya Nursery! Let us grow together 🌿',
      });
      console.log('✅ Settings initialized (Override PIN: 9900)');
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    let adminUser: any = null;
    let managerUser: any = null;
    let cashierUser: any = null;

    if (userCount === 0) {
      adminUser = await User.create({
        username: 'admin',
        password: 'Admin@123',
        name: 'Vijaya (Admin)',
        role: 'admin',
        phone: '9848022334',
        email: 'admin@vijayanursery.com',
        isActive: true,
      });

      managerUser = await User.create({
        username: 'manager',
        password: 'Manager@123',
        name: 'Suresh Varma (Manager)',
        role: 'manager',
        phone: '9848123456',
        email: 'manager@vijayanursery.com',
        isActive: true,
      });

      cashierUser = await User.create({
        username: 'cashier',
        password: 'Cashier@123',
        name: 'Raju (Cashier 1)',
        role: 'agent',
        phone: '9848987654',
        email: 'cashier@vijayanursery.com',
        isActive: true,
      });

      await User.create({
        username: 'cashier2',
        password: 'Cashier@123',
        name: 'Praveen (Cashier 2)',
        role: 'agent',
        phone: '9848554433',
        email: 'praveen@vijayanursery.com',
        isActive: true,
      });

      console.log('✅ Staff users created:');
      console.log('   - Admin: admin / Admin@123');
      console.log('   - Manager: manager / Manager@123');
      console.log('   - Cashier: cashier / Cashier@123');
    } else {
      adminUser = await User.findOne({ role: 'admin' });
      managerUser = await User.findOne({ role: 'manager' }) || adminUser;
      cashierUser = await User.findOne({ role: 'agent' }) || adminUser;
    }

    // 3. Seed Categories
    const categoryDefs = [
      { name: 'Fruit Plants', slug: 'fruit-plants', code: 'FRUIT', description: 'Grafted and hybrid fruit trees suitable for Andhra climates', sortOrder: 1 },
      { name: 'Flowering Plants', slug: 'flowering-plants', code: 'FLOWER', description: 'Seasonal and perennial flowering plants and climbers', sortOrder: 2 },
      { name: 'Indoor & Air Purifying', slug: 'indoor-air-purifying', code: 'INDOOR', description: 'Low-light indoor desk and living room plants', sortOrder: 3 },
      { name: 'Ornamental & Palms', slug: 'ornamental-palms', code: 'ORNAMENTAL', description: 'Landscape palms, hedges, and decorative shrubs', sortOrder: 4 },
      { name: 'Pots & Planters', slug: 'pots-planters', code: 'POTS', description: 'Ceramic, terracotta, plastic, and fiber pots', sortOrder: 5 },
      { name: 'Soils & Organic Fertilizers', slug: 'soils-fertilizers', code: 'SOIL', description: 'Vermicompost, red soil, cocopeat, and bone meal', sortOrder: 6 },
      { name: 'Garden Tools & Accessories', slug: 'garden-tools', code: 'TOOLS', description: 'Pruners, sprayers, watering cans, and trowels', sortOrder: 7 },
    ];

    const categoryMap = new Map<string, any>();
    for (const cat of categoryDefs) {
      let doc = await Category.findOne({ slug: cat.slug });
      if (!doc) {
        doc = await Category.create(cat);
      }
      categoryMap.set(cat.code, doc);
    }
    console.log(`✅ ${categoryMap.size} Nursery categories ready.`);

    // 4. Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const productDefs = [
        // Fruit Plants (HSN 0602, 0% GST)
        {
          name: 'Banganapalli Mango Grafted',
          localName: 'బంగినపల్లి మామిడి చెట్టు',
          botanicalName: 'Mangifera indica',
          sku: 'PL-MNG-001',
          category: categoryMap.get('FRUIT')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 80,
          sellingPrice: 150,
          currentStock: 120,
          openingStock: 120,
          lowStockThreshold: 20,
          location: 'Field Sector A',
        },
        {
          name: 'Taiwan Guava (VNR Bihi)',
          localName: 'తైవాన్ జామ మొక్క',
          botanicalName: 'Psidium guajava',
          sku: 'PL-GVA-002',
          category: categoryMap.get('FRUIT')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 60,
          sellingPrice: 120,
          currentStock: 95,
          openingStock: 95,
          lowStockThreshold: 15,
          location: 'Field Sector A',
        },
        {
          name: 'Cricket Ball Sapota Grafted',
          localName: 'సపోటా మొక్క',
          botanicalName: 'Manilkara zapota',
          sku: 'PL-SPT-003',
          category: categoryMap.get('FRUIT')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 70,
          sellingPrice: 140,
          currentStock: 60,
          openingStock: 60,
          lowStockThreshold: 10,
          location: 'Field Sector A',
        },
        {
          name: 'Kagzi Lemon High Yield',
          localName: 'కాగజి నిమ్మ మొక్క',
          botanicalName: 'Citrus aurantifolia',
          sku: 'PL-LMN-004',
          category: categoryMap.get('FRUIT')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 40,
          sellingPrice: 90,
          currentStock: 85,
          openingStock: 85,
          lowStockThreshold: 15,
          location: 'Field Sector A',
        },
        {
          name: 'Bhagwa Pomegranate (Anar)',
          localName: 'దానిమ్మ మొక్క',
          botanicalName: 'Punica granatum',
          sku: 'PL-POM-005',
          category: categoryMap.get('FRUIT')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 90,
          sellingPrice: 180,
          currentStock: 45,
          openingStock: 45,
          lowStockThreshold: 10,
          location: 'Field Sector A',
        },

        // Flowering Plants (HSN 0602, 0% GST)
        {
          name: 'Kashmiri Red Rose Plant',
          localName: 'ఎరుపు గులాబీ మొక్క',
          botanicalName: 'Rosa damascena',
          sku: 'PL-ROS-010',
          category: categoryMap.get('FLOWER')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 35,
          sellingPrice: 70,
          currentStock: 150,
          openingStock: 150,
          lowStockThreshold: 30,
          location: 'Greenhouse B1',
        },
        {
          name: 'Gundu Malle (Arabian Jasmine)',
          localName: 'గుండు మల్లె మొక్క',
          botanicalName: 'Jasminum sambac',
          sku: 'PL-JAS-011',
          category: categoryMap.get('FLOWER')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 25,
          sellingPrice: 50,
          currentStock: 200,
          openingStock: 200,
          lowStockThreshold: 40,
          location: 'Greenhouse B1',
        },
        {
          name: 'Hybrid Hibiscus (Multi-color Mandara)',
          localName: 'హైబ్రిడ్ మందార మొక్క',
          botanicalName: 'Hibiscus rosa-sinensis',
          sku: 'PL-HIB-012',
          category: categoryMap.get('FLOWER')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 45,
          sellingPrice: 90,
          currentStock: 110,
          openingStock: 110,
          lowStockThreshold: 20,
          location: 'Greenhouse B2',
        },
        {
          name: 'Bougainvillea Grafted Bonsai Style',
          localName: 'కాగితపు పూల మొక్క',
          botanicalName: 'Bougainvillea glabra',
          sku: 'PL-BOU-013',
          category: categoryMap.get('FLOWER')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 120,
          sellingPrice: 250,
          currentStock: 35,
          openingStock: 35,
          lowStockThreshold: 8,
          location: 'Greenhouse B2',
        },

        // Indoor & Air-Purifying (HSN 0602, 0% GST)
        {
          name: 'Sansevieria Snake Plant (Golden Hahnii)',
          localName: 'స్నేక్ ప్లాంట్',
          botanicalName: 'Dracaena trifasciata',
          sku: 'PL-SNK-020',
          category: categoryMap.get('INDOOR')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 80,
          sellingPrice: 180,
          currentStock: 80,
          openingStock: 80,
          lowStockThreshold: 15,
          location: 'Shade House C',
        },
        {
          name: 'Areca Palm 3-Feet Healthy Cluster',
          localName: 'అరేకా పామ్',
          botanicalName: 'Dypsis lutescens',
          sku: 'PL-ARC-021',
          category: categoryMap.get('INDOOR')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 150,
          sellingPrice: 320,
          currentStock: 65,
          openingStock: 65,
          lowStockThreshold: 10,
          location: 'Shade House C',
        },
        {
          name: 'ZZ Plant (Zamioculcas zamiifolia)',
          localName: 'జెడ్ జెడ్ ప్లాంట్',
          botanicalName: 'Zamioculcas zamiifolia',
          sku: 'PL-ZZP-022',
          category: categoryMap.get('INDOOR')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 180,
          sellingPrice: 380,
          currentStock: 40,
          openingStock: 40,
          lowStockThreshold: 8,
          location: 'Shade House C',
        },
        {
          name: 'Money Plant Golden Pothos in Hanging Pot',
          localName: 'మనీ ప్లాంట్',
          botanicalName: 'Epipremnum aureum',
          sku: 'PL-MNY-023',
          category: categoryMap.get('INDOOR')._id,
          unit: 'piece',
          hsn: '0602',
          gstRate: 0,
          costPrice: 60,
          sellingPrice: 140,
          currentStock: 90,
          openingStock: 90,
          lowStockThreshold: 20,
          location: 'Shade House C',
        },

        // Pots & Planters (HSN 6912 / 3926, 12% or 18% GST)
        {
          name: 'Ceramic Glazed Round Planter 10-inch (White)',
          localName: 'సిరామిక్ కుండీ 10 అంగుళాలు',
          sku: 'POT-CER-10W',
          category: categoryMap.get('POTS')._id,
          unit: 'piece',
          hsn: '6912',
          gstRate: 12,
          costPrice: 180,
          sellingPrice: 350,
          currentStock: 50,
          openingStock: 50,
          lowStockThreshold: 10,
          location: 'Pot Store Bay 1',
        },
        {
          name: 'Terracotta Natural Clay Pot 12-inch',
          localName: 'మట్టి కుండీ 12 అంగుళాలు',
          sku: 'POT-TER-12',
          category: categoryMap.get('POTS')._id,
          unit: 'piece',
          hsn: '6912',
          gstRate: 12,
          costPrice: 60,
          sellingPrice: 120,
          currentStock: 140,
          openingStock: 140,
          lowStockThreshold: 25,
          location: 'Pot Store Bay 2',
        },
        {
          name: 'Heavy Duty UV Plastic Nursery Pots 8-inch (Pack of 5)',
          localName: 'ప్లాస్టిక్ నర్సరీ కుండీలు',
          sku: 'POT-PLS-08P5',
          category: categoryMap.get('POTS')._id,
          unit: 'pack',
          hsn: '3926',
          gstRate: 18,
          costPrice: 75,
          sellingPrice: 150,
          currentStock: 110,
          openingStock: 110,
          lowStockThreshold: 20,
          location: 'Pot Store Bay 3',
        },

        // Soils & Fertilizers (HSN 3101, 5% GST)
        {
          name: 'Organic Vermicompost Pure Earthworm Compost (25 Kg Bag)',
          localName: 'వర్మీ కంపోస్ట్ 25 కేజీల బస్తా',
          sku: 'SL-VERM-25K',
          category: categoryMap.get('SOIL')._id,
          unit: 'bag',
          hsn: '3101',
          gstRate: 5,
          costPrice: 200,
          sellingPrice: 320,
          currentStock: 80,
          openingStock: 80,
          lowStockThreshold: 15,
          location: 'Fertilizer Godown',
        },
        {
          name: 'Washed Low-EC Cocopeat 5 Kg Compressed Block',
          localName: 'కొబ్బరి పిట్టు బ్లాక్ 5 కేజీలు',
          sku: 'SL-COCO-5K',
          category: categoryMap.get('SOIL')._id,
          unit: 'piece',
          hsn: '3101',
          gstRate: 5,
          costPrice: 90,
          sellingPrice: 160,
          currentStock: 120,
          openingStock: 120,
          lowStockThreshold: 25,
          location: 'Fertilizer Godown',
        },
        {
          name: 'Pure Neem Cake Organic Pest Repellent (5 Kg)',
          localName: 'వేప పిండి 5 కేజీలు',
          sku: 'SL-NEEM-5K',
          category: categoryMap.get('SOIL')._id,
          unit: 'packet',
          hsn: '3101',
          gstRate: 5,
          costPrice: 110,
          sellingPrice: 190,
          currentStock: 60,
          openingStock: 60,
          lowStockThreshold: 12,
          location: 'Fertilizer Godown',
        },

        // Garden Tools (HSN 8201, 18% GST)
        {
          name: 'Falcon Heavy Duty Bypass Pruning Secateur',
          localName: 'కత్తిరింపు కత్తెర',
          sku: 'TL-PRUN-FLC',
          category: categoryMap.get('TOOLS')._id,
          unit: 'piece',
          hsn: '8201',
          gstRate: 18,
          costPrice: 280,
          sellingPrice: 480,
          currentStock: 25,
          openingStock: 25,
          lowStockThreshold: 5,
          location: 'Tool Rack 1',
        },
        {
          name: '5-Litre Garden Watering Can with Brass Rose Sprayer',
          localName: 'నీటి డబ్బా 5 లీటర్లు',
          sku: 'TL-WATR-05L',
          category: categoryMap.get('TOOLS')._id,
          unit: 'piece',
          hsn: '3926',
          gstRate: 18,
          costPrice: 140,
          sellingPrice: 260,
          currentStock: 30,
          openingStock: 30,
          lowStockThreshold: 6,
          location: 'Tool Rack 1',
        },
      ];

      for (const p of productDefs) {
        const prod = await Product.create({
          ...p,
          isActive: true,
          priceStatus: 'active',
        });

        // Create opening stock ledger
        await StockLedger.create({
          product: prod._id,
          productName: prod.name,
          productSku: prod.sku,
          movementType: 'opening',
          quantity: prod.openingStock,
          stockBefore: 0,
          stockAfter: prod.openingStock,
          reference: 'INITIAL_SEED',
          reason: 'Initial inventory seeding',
          user: adminUser._id,
          userName: adminUser.name,
        });
      }
      console.log(`✅ ${productDefs.length} Products seeded with inventory and stock ledgers.`);
    }

    // 5. Seed Customers
    const customerCount = await Customer.countDocuments();
    if (customerCount === 0) {
      await Customer.create([
        {
          name: 'Srinivasa Green Landscapes',
          phone: '9848011223',
          email: 'srinivasa.landscapes@gmail.com',
          address: 'Plot 45, Auto Nagar',
          city: 'Vijayawada',
          state: 'Andhra Pradesh',
          gstin: '37AABCS1234F1Z1',
          creditLimit: 50000,
          creditDays: 30,
          openingBalance: 0,
          currentBalance: 8500,
          totalPurchases: 24500,
          totalPayments: 16000,
        },
        {
          name: 'Dr. K. Ramakrishna',
          phone: '9849200300',
          email: 'ramakrishna.k@yahoo.co.in',
          address: 'Near Rama Temple, Danavaipeta',
          city: 'Rajahmundry',
          state: 'Andhra Pradesh',
          creditLimit: 15000,
          creditDays: 15,
          openingBalance: 0,
          currentBalance: 0,
          totalPurchases: 6200,
          totalPayments: 6200,
        },
        {
          name: 'Venkata Gardens Resort',
          phone: '9988776655',
          email: 'purchase@venkatagardens.com',
          address: 'Beach Road, Kakinada',
          city: 'Kakinada',
          state: 'Andhra Pradesh',
          gstin: '37AAACV9876Q1Z9',
          creditLimit: 100000,
          creditDays: 45,
          openingBalance: 0,
          currentBalance: 14200,
          totalPurchases: 54200,
          totalPayments: 40000,
        },
      ]);
      console.log('✅ Sample customers initialized.');
    }

    // 6. Seed Suppliers
    const supplierCount = await Supplier.countDocuments();
    if (supplierCount === 0) {
      await Supplier.create([
        {
          name: 'Kadiyam Green Wholesale Nurseries',
          phone: '9440123456',
          email: 'sales@kadiyamgreen.com',
          address: 'Main Canal Road, Kadiyam',
          city: 'Kadiyam',
          state: 'Andhra Pradesh',
          gstin: '37AAACK1122P1Z0',
        },
        {
          name: 'Deccan Ceramic & Clay Potteries',
          phone: '9440987654',
          email: 'orders@deccanpottery.com',
          address: 'Industrial Estate, Tadepalligudem',
          city: 'Tadepalligudem',
          state: 'Andhra Pradesh',
          gstin: '37AABCD5544E1Z3',
        },
      ]);
      console.log('✅ Suppliers seeded.');
    }

    // 7. Seed Tax Rules
    const taxRulesCount = await TaxRule.countDocuments();
    if (taxRulesCount === 0) {
      await TaxRule.create([
        {
          hsn: '0602',
          description: 'Live plants, trees, shrubs, bushes, graftings',
          taxRate: 0,
          taxType: 'nil',
          effectiveFrom: new Date('2024-04-01'),
        },
        {
          hsn: '3101',
          description: 'All animal or vegetable organic fertilizers (Vermicompost, cocopeat, neem cake)',
          taxRate: 5,
          taxType: 'gst',
          effectiveFrom: new Date('2024-04-01'),
        },
        {
          hsn: '6912',
          description: 'Ceramic & terracotta flower pots and tableware',
          taxRate: 12,
          taxType: 'gst',
          effectiveFrom: new Date('2024-04-01'),
        },
        {
          hsn: '3926',
          description: 'Plastic nursery pots and planters',
          taxRate: 18,
          taxType: 'gst',
          effectiveFrom: new Date('2024-04-01'),
        },
        {
          hsn: '8201',
          description: 'Hand tools for agriculture, horticulture or forestry',
          taxRate: 18,
          taxType: 'gst',
          effectiveFrom: new Date('2024-04-01'),
        },
      ]);
      console.log('✅ GST tax rules configured.');
    }

    console.log('🎉 VIJAYA NURSERY DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding error:', error);
    if (require.main === module) {
      process.exit(1);
    } else {
      throw error;
    }
  }
};

if (require.main === module) {
  seedDatabase();
}
