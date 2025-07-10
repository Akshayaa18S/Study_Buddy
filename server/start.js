#!/usr/bin/env node

// Load environment variables first
require('dotenv').config();

const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');
const app = require('./index');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('🔄 Starting AI Study Buddy Server...');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    await testConnection();
    
    // Sync database models
    console.log('🔄 Syncing database models...');
    await syncDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log('\n✅ AI Study Buddy Server is running!');
      console.log(`🌐 Server: http://localhost:${PORT}`);
      console.log(`📚 API: http://localhost:${PORT}/api`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log('\n🎯 Ready to help students learn! 🤖\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('\n💡 Please check:');
    console.error('   - MySQL is running');
    console.error('   - Database credentials in .env are correct');
    console.error('   - All required environment variables are set');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down AI Study Buddy Server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down AI Study Buddy Server...');
  process.exit(0);
});

startServer();
