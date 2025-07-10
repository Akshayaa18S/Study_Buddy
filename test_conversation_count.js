require('dotenv').config({ path: './.env' });
const { Conversation, Message, User } = require('./models');

async function testConversationCount() {
  try {
    console.log('Testing conversation count...');
    
    // Count all conversations
    const totalConversations = await Conversation.count();
    console.log('Total conversations in DB:', totalConversations);
    
    // Count all messages
    const totalMessages = await Message.count();
    console.log('Total messages in DB:', totalMessages);
    
    // Count all users
    const totalUsers = await User.count();
    console.log('Total users in DB:', totalUsers);
    
    // Get all conversations with details
    const conversations = await Conversation.findAll({
      include: [{
        model: Message,
        as: 'messages'
      }]
    });
    
    console.log('\nConversation details:');
    conversations.forEach(conv => {
      console.log(`- ID: ${conv.id}, User: ${conv.userId}, Messages: ${conv.messages?.length || 0}, DB MessageCount: ${conv.messageCount}`);
    });
    
    // Test user stats for specific users
    if (totalUsers > 0) {
      console.log('\nUser conversation counts:');
      const users = await User.findAll();
      for (const user of users) {
        const userConvCount = await Conversation.count({ where: { userId: user.id } });
        console.log(`- User ${user.id} (${user.username}): ${userConvCount} conversations`);
      }
    }
    
  } catch (error) {
    console.error('Error testing conversation count:', error);
  }
}

testConversationCount();
