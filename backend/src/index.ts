import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports - restart trigger
dotenv.config({ path: path.join(__dirname, '../../.env') });

import app from './app';
import { initializeDatabase, closeConnection } from './models';
import { initializeEnvironment } from './utils/env-validation';

// Validate environment configuration on startup
const env = initializeEnvironment();
const PORT = env.PORT;

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received, starting graceful shutdown...`);

  try {
    // Close database connection
    await closeConnection();

    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection and run migrations
    console.log('🔄 Initializing database...');
    const dbInitialized = await initializeDatabase();

    if (!dbInitialized) {
      console.error('❌ Failed to initialize database. Exiting...');
      process.exit(1);
    }

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 PoolRoute OS API Server Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 API base URL: http://localhost:${PORT}/api`);

      if (process.env.NODE_ENV === 'development') {
        console.log('\n📋 Available Endpoints:');
        console.log('  • POST /api/auth/register - User registration');
        console.log('  • POST /api/auth/login - User login');
        console.log('  • GET /api/auth/profile - Get user profile');
        console.log('  • PUT /api/auth/profile - Update user profile');
        console.log('  • POST /api/auth/change-password - Change password');
        console.log('  • POST /api/auth/refresh - Refresh access token');
        console.log('  • POST /api/auth/logout - User logout');
        console.log('  • GET /health - Health check\n');
      }
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Set server timeout (30 seconds)
    server.timeout = 30000;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize and start the server
startServer().catch((error) => {
  console.error('❌ Server initialization failed:', error);
  process.exit(1);
});