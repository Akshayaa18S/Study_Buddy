const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import database
const { testConnection, syncDatabase } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
const initializeDatabase = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await testConnection();
    
    console.log('📊 Synchronizing database...');
    await syncDatabase(process.env.NODE_ENV === 'development' && process.env.RESET_DB === 'true');
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI Study Buddy Server is running!',
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Import and use routes
try {
  console.log('Loading routes...');
  
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  app.use('/api/auth', authRoutes);
  
  const chatRoutes = require('./routes/chat');
  console.log('✅ Chat routes loaded');
  app.use('/api/chat', chatRoutes);
  
  const quizRoutes = require('./routes/quiz');
  console.log('✅ Quiz routes loaded');
  app.use('/api/quiz', quizRoutes);
  
  const fileRoutes = require('./routes/files');
  console.log('✅ File routes loaded');
  app.use('/api/files', fileRoutes);
  
  const userRoutes = require('./routes/user');
  console.log('✅ User routes loaded');
  app.use('/api/user', userRoutes);
  
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error('Stack:', error.stack);
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export the app (server starting is handled by start.js)
module.exports = app;
