const { Sequelize } = require('sequelize');

// Load environment variables if not already loaded
if (!process.env.DB_NAME) {
  require('dotenv').config();
}

// Initialize Sequelize with MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ai_study_buddy',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    console.log('💡 Make sure MySQL is running and credentials are correct in .env file');
    console.log('💡 You may need to create the database first: CREATE DATABASE ai_study_buddy;');
  }
};

module.exports = {
  sequelize,
  testConnection
};
