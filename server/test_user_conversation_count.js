require('dotenv').config();
const { Conversation, Message, User } = require('./models');

async function testUserConversationCount() {
  try {
    console.log('Testing user conversation count in stats...');
    
    // Create a test user
    let testUser;
    try {
      testUser = await User.create({
        username: 'conv_test_user',
        email: 'convtest@example.com',
        password: 'hashedpassword',
        firstName: 'Conv',
        lastName: 'Test'
      });
      console.log('✅ Test user created:', testUser.id);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        testUser = await User.findOne({ where: { username: 'conv_test_user' } });
        console.log('✅ Using existing test user:', testUser.id);
      } else {
        throw error;
      }
    }
    
    // Create multiple conversations for this user
    const conversations = [];
    for (let i = 1; i <= 3; i++) {
      const convId = `conv_test_user_${Date.now()}_${i}`;
      
      const conversation = await Conversation.create({
        id: convId,
        userId: testUser.id,
        personality: 'friendly',
        title: `Test conversation ${i}`
      });
      
      // Add some messages to each conversation
      await Message.create({
        conversationId: conversation.id,
        role: 'user',
        content: `Hello, this is message ${i} from user`
      });
      
      await Message.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: `Hello! This is response ${i} from assistant`
      });
      
      // Update conversation message count
      await conversation.update({
        messageCount: 2,
        lastMessageAt: new Date()
      });
      
      conversations.push(conversation);
      console.log(`✅ Created conversation ${i}:`, convId);
    }
    
    // Now test the user stats logic (same as in user.js)
    const conversationsCount = await Conversation.count({ where: { userId: testUser.id } });
    console.log('📊 Total conversations for user:', conversationsCount);
    
    // Test getting conversations with messages
    const userConversations = await Conversation.findAll({
      where: { userId: testUser.id },
      include: [{
        model: Message,
        as: 'messages'
      }]
    });
    
    console.log('📋 Conversation details:');
    userConversations.forEach(conv => {
      console.log(`  - ${conv.id}: ${conv.messages.length} messages (DB count: ${conv.messageCount})`);
    });
    
    console.log('✅ User conversation count test completed successfully!');
    console.log(`   User should see ${conversationsCount} conversations in their stats`);
    
  } catch (error) {
    console.error('❌ Error testing user conversation count:', error);
  }
}

testUserConversationCount();
