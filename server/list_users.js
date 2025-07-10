require('dotenv').config();
const { User } = require('./models');

async function listUsers() {
  try {
    console.log('Listing all users...');
    
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'firstName', 'lastName']
    });
    
    console.log('Total users:', users.length);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

listUsers();
