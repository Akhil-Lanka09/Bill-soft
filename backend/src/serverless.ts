import app from './app';
import connectDB from './config/database';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (err: any) {
    console.error('Database connection failed in serverless handler:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed: ' + (err.message || 'Check MONGODB_URI and IP whitelist in MongoDB Atlas'),
      code: 'DATABASE_ERROR',
    });
  }
  return app(req, res);
}
