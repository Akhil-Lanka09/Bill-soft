import app from './app';
import config from './config';
import connectDB from './config/database';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🌱 VIJAYA NURSERY - POS & BILLING SYSTEM`);
      console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
      console.log(`📡 API URL: http://localhost:${config.port}/api`);
      console.log(`====================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

startServer();
