import mongoose from 'mongoose';
import config from './index';

let cachedPromise: Promise<typeof mongoose> | null = null;
let mongodInstance: any = null;

const connectDB = async (): Promise<typeof mongoose> => {
  // 1. If already connected, return immediately (crucial for serverless environments)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If a connection is currently pending, await the existing promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = config.mongodb.uri;
  const isAtlas = uri.includes('mongodb+srv://') || uri.includes('@');
  const isProductionOrServerless = Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production');

  // In cloud/Vercel environments, localhost MongoDB is not accessible
  if (isProductionOrServerless && (!process.env.MONGODB_URI || uri.includes('localhost') || uri.includes('127.0.0.1'))) {
    throw new Error(
      'MONGODB_URI is missing in Vercel. Please go to Vercel Project Settings → Environment Variables, add MONGODB_URI with your MongoDB Atlas connection string (mongodb+srv://...), and Redeploy.'
    );
  }

  cachedPromise = (async () => {
    try {
      console.log(`📡 Connecting to MongoDB (${isAtlas ? 'MongoDB Atlas / Cloud' : 'Local URI'})...`);
      const conn = await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });

      console.log(`✅ MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);

      // Auto-seed if database is fresh (has 0 users)
      try {
        const { User } = await import('../models');
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          console.log('🌱 Fresh database detected! Auto-seeding initial nursery catalog & admin accounts...');
          const { seedDatabase } = await import('../scripts/seed');
          await seedDatabase();
          console.log('✅ Auto-seed completed successfully!');
        }
      } catch (seedErr: any) {
        console.warn('Notice during auto-seed check:', seedErr.message);
      }

      return conn;
    } catch (error: any) {
      cachedPromise = null;

      // If user configured Atlas or is in cloud/Vercel, do NOT run memory server; explain error clearly
      if (isAtlas || isProductionOrServerless) {
        let msg = error.message;
        if (error.name === 'MongooseServerSelectionError') {
          msg = 'Could not reach MongoDB Atlas cluster. Please ensure IP Access List in MongoDB Atlas Network Access is set to 0.0.0.0/0 (Allow access from anywhere).';
        } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
          msg = 'MongoDB Atlas authentication failed. Please verify your database username and password in MONGODB_URI.';
        }
        console.error('❌ MongoDB Connection Error:', msg);
        throw new Error(msg);
      }

      // Local development fallback to embedded memory server
      console.log('⚡ Standalone MongoDB not running on localhost:27017. Initializing embedded local database...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'bn-reddy-nursery',
          },
        }).catch(async () => {
          return await MongoMemoryServer.create({ instance: { dbName: 'bn-reddy-nursery' } });
        });

        const memoryUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`✅ Embedded Local MongoDB Server Ready & Connected at: ${memoryUri}`);

        // Seed embedded local database
        const { seedDatabase } = await import('../scripts/seed');
        await seedDatabase();

        return conn;
      } catch (memErr) {
        console.error('❌ Could not establish MongoDB connection:', memErr);
        throw memErr;
      }
    }
  })();

  return cachedPromise;
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
  process.exit(0);
});

export default connectDB;
