require('dotenv').config();
const { Conversation, Message, User } = require('./models');

async function testConversationCreation() {
  try {
    console.log('Testing conversation creation...');
    
    // First, create a test user
    const testUser = await User.create({
      username: 'testuser_conv2',
      email: 'testconv2@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User'
    });
    
    console.log('Test user created:', testUser.id);
    
    // Test creating a conversation with string ID
    const conversationId = 'conv_test_' + Date.now();
    
    const conversation = await Conversation.create({
      id: conversationId,
      userId: testUser.id,
      personality: 'friendly',
      title: 'Test conversation'
    });
    
    console.log('Conversation created:', conversation.id);
    
    // Test creating messages
    const userMessage = await Message.create({
      conversationId: conversation.id,
      role: 'user',
      content: 'Hello, this is a test message'
    });
    
    const assistantMessage = await Message.create({
      conversationId: conversation.id,
      role: 'assistant',
      content: 'Hello! I am here to help you with your studies.'
    });
    
    console.log('Messages created:', userMessage.id, assistantMessage.id);
    
    // Update conversation message count
    await conversation.update({
      messageCount: 2,
      lastMessageAt: new Date()
    });
    
    console.log('Conversation updated with message count');
    
    // Test counting conversations for this user
    const userConvCount = await Conversation.count({ where: { userId: testUser.id } });
    console.log('User conversation count:', userConvCount);
    
    // Test getting conversation with messages
    const fullConversation = await Conversation.findOne({
      where: { id: conversationId },
      include: [{
        model: Message,
        as: 'messages'
      }]
    });
    
    console.log('Full conversation retrieved:', {
      id: fullConversation.id,
      messageCount: fullConversation.messageCount,
      actualMessages: fullConversation.messages.length
    });
    
    console.log('✅ Conversation creation test passed!');
    
  } catch (error) {
    console.error('❌ Error testing conversation creation:', error);
  }
}

testConversationCreation();
