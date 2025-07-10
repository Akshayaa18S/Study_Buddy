require('dotenv').config();
const { sequelize } = require('./config/database');
const { Conversation, Message } = require('./models');

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    // Force sync to update the schema (WARNING: This will drop existing data)
    await sequelize.sync({ force: true });
    
    console.log('Database schema updated successfully!');
    console.log('NOTE: All existing conversation data has been cleared due to schema change.');
    
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await sequelize.close();
  }
}

updateSchema();
