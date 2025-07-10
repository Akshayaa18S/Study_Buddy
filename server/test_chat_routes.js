require('dotenv').config();

// Test if the chat routes file loads without syntax errors
try {
  const chatRoutes = require('./routes/chat');
  console.log('✅ Chat routes file loads successfully');
  console.log('Route object type:', typeof chatRoutes);
  
  // Check if it's an Express router
  if (chatRoutes && typeof chatRoutes.get === 'function') {
    console.log('✅ Router has expected methods');
  } else {
    console.log('❌ Router missing expected methods');
  }
} catch (error) {
  console.error('❌ Error loading chat routes:', error.message);
  console.error('Full error:', error);
}
