const mysql = require('mysql2');

// Create connection without specifying database
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Akshayaa@1811'
});

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    console.log('🔗 Connecting to MySQL server...');
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Connected to MySQL server');
    
    console.log('📊 Creating database ai_study_buddy...');
    await new Promise((resolve, reject) => {
      connection.query('CREATE DATABASE IF NOT EXISTS ai_study_buddy', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('✅ Database ai_study_buddy created successfully');
    
    connection.end();
    console.log('🔚 Database initialization complete');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('💡 Make sure MySQL is running on your system');
    console.log('💡 Check your credentials in .env file');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  createDatabase();
}

module.exports = createDatabase;
