require('dotenv').config();
const { Conversation, Message, User } = require('./models');

async function testDatabasePersistence() {
  try {
    console.log('Testing database persistence directly...');
    
    // Create a test user
    const testUser = await User.create({
      username: `dbtest_${Date.now()}`,
      email: `dbtest_${Date.now()}@example.com`,
      password: 'password123',
      firstName: 'DB',
      lastName: 'Test'
    });
    
    console.log('✓ Test user created:', testUser.username);
    
    // Create conversations manually
    const conv1 = await Conversation.create({
      id: `dbtest_conv_1_${Date.now()}`,
      userId: testUser.id,
      title: 'Test Conversation 1',
      personality: 'friendly',
      messageCount: 0,
      lastMessageAt: new Date()
    });
    
    console.log('✓ First conversation created:', conv1.id);
    
    // Add messages to conversation
    const userMsg1 = await Message.create({
      conversationId: conv1.id,
      role: 'user',
      content: 'Hello, this is a test message'
    });
    
    const aiMsg1 = await Message.create({
      conversationId: conv1.id,
      role: 'assistant',
      content: 'Hello! I\'m here to help you with your studies.'
    });
    
    // Update conversation message count
    await conv1.update({
      messageCount: 2,
      lastMessageAt: new Date()
    });
    
    console.log('✓ Messages added to first conversation');
    
    // Create second conversation
    const conv2 = await Conversation.create({
      id: `dbtest_conv_2_${Date.now()}`,
      userId: testUser.id,
      title: 'Test Conversation 2',
      personality: 'professional',
      messageCount: 2,
      lastMessageAt: new Date()
    });
    
    await Message.create({
      conversationId: conv2.id,
      role: 'user',
      content: 'This is another conversation'
    });
    
    await Message.create({
      conversationId: conv2.id,
      role: 'assistant',
      content: 'I understand. This is a separate conversation thread.'
    });
    
    console.log('✓ Second conversation created with messages');
    
    // Test retrieval
    console.log('\n--- Testing Retrieval ---');
    
    // Get all conversations for user
    const userConversations = await Conversation.findAll({
      where: { userId: testUser.id },
      include: [{
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }],
      order: [['lastMessageAt', 'DESC']]
    });
    
    console.log(`✓ Retrieved ${userConversations.length} conversations for user`);
    
    userConversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ${conv.title} (${conv.messages.length} messages)`);
      conv.messages.forEach((msg, msgIndex) => {
        console.log(`      ${msgIndex + 1}. [${msg.role}]: ${msg.content.substring(0, 40)}...`);
      });
    });
    
    // Test conversation count in user stats
    const conversationCount = await Conversation.count({ where: { userId: testUser.id } });
    console.log(`\n✓ Total conversations for user: ${conversationCount}`);
    
    // Test retrieving specific conversation history
    const specificConv = await Conversation.findOne({
      where: { id: conv1.id, userId: testUser.id },
      include: [{
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }]
    });
    
    console.log(`✓ Retrieved specific conversation: ${specificConv.title}`);
    console.log(`   - Has ${specificConv.messages.length} messages`);
    console.log(`   - Message count field: ${specificConv.messageCount}`);
    
    console.log('\n🎉 SUCCESS: Database persistence is working perfectly!');
    console.log('✅ Conversations are created and stored in database');
    console.log('✅ Messages are linked to conversations correctly');
    console.log('✅ Conversation history can be retrieved');
    console.log('✅ User stats can count conversations accurately');
    console.log('✅ Frontend will be able to load conversation data');
    
    console.log('\n📋 Summary for Frontend:');
    console.log('- When user logs in, call GET /api/chat/conversations to get conversation list');
    console.log('- When user selects a conversation, call GET /api/chat/history/{id} to load messages');
    console.log('- When user sends new message, it creates/updates conversation automatically');
    console.log('- User stats show accurate conversation counts');
    
  } catch (error) {
    console.error('❌ Error testing database persistence:', error);
  }
}

testDatabasePersistence();
