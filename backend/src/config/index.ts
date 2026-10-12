import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/vijaya-nursery',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  business: {
    name: process.env.BUSINESS_NAME || 'Vijaya Nursery',
    timezone: process.env.BUSINESS_TIMEZONE || 'Asia/Kolkata',
    state: process.env.BUSINESS_STATE || 'Andhra Pradesh',
    gstStateCode: process.env.GST_STATE_CODE || '37',
    invoicePrefix: process.env.INVOICE_PREFIX || 'VN',
    financialYear: process.env.FINANCIAL_YEAR || '2026-27',
    currency: process.env.CURRENCY || 'INR',
    address: {
      line1: 'Near NH-16 Bypass, Kadiyam Road',
      city: 'Rajahmundry',
      state: 'Andhra Pradesh',
      pincode: '533126',
    },
    phone: '+91 98480 22334',
    gstin: '37ABCDE1234F1Z5',
  },

  invoice: {
    prefix: 'BN',
    padding: 5,
  },

  upi: {
    id: process.env.UPI_ID || '',
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    dir: process.env.UPLOAD_DIR || 'uploads',
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  },

  override: {
    maxAttempts: 5,
    lockoutMinutes: 15,
  },

  auth: {
    maxLoginAttempts: 5,
    lockoutMinutes: 30,
    saltRounds: 12,
  },
} as const;

export default config;
