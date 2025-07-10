const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testConversationCounting() {
  try {
    console.log('Testing conversation counting after fixes...');
    
    // Test with authenticated user
    console.log('\n1. Creating/logging in test user...');
    
    let authToken;
    const timestamp = Date.now();
    const testUsername = `convtest_${timestamp}`;
    const testEmail = `convtest_${timestamp}@example.com`;
    
    try {
      // Try to register a new user
      const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
        username: testUsername,
        email: testEmail,
        password: 'password123',
        firstName: 'Conv',
        lastName: 'Test'
      });
      console.log('New user registered successfully');
      
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        login: testEmail,
        password: 'password123'
      });
      authToken = loginResponse.data.token;
      
    } catch (registerError) {
      if (registerError.response?.status === 409) {
        console.log('User already exists, logging in...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          login: testEmail,
          password: 'password123'
        });
        authToken = loginResponse.data.token;
      } else {
        throw registerError;
      }
    }
    
    const authHeaders = { Authorization: `Bearer ${authToken}` };
    
    // Check initial stats
    console.log('\n2. Checking initial user stats...');
    const initialStats = await axios.get(`${baseURL}/api/user/stats`, { headers: authHeaders });
    console.log('Initial conversation count:', initialStats.data.totalConversations);
    
    // Send a few messages to create conversations
    console.log('\n3. Creating conversations...');
    
    const conversations = [];
    for (let i = 1; i <= 3; i++) {
      const conversationId = `test_conv_${Date.now()}_${i}`;
      conversations.push(conversationId);
      
      console.log(`Creating conversation ${i}: ${conversationId}`);
      
      const messageResponse = await axios.post(`${baseURL}/api/chat/message`, {
        message: `Hello, this is test message ${i}. Can you help me study mathematics?`,
        conversationId: conversationId,
        personality: 'friendly'
      }, { headers: authHeaders });
      
      console.log(`✓ Message ${i} sent successfully`);
      
      // Send a follow-up message to the same conversation
      await axios.post(`${baseURL}/api/chat/message`, {
        message: `Follow-up question ${i}: What is calculus?`,
        conversationId: conversationId,
        personality: 'friendly'
      }, { headers: authHeaders });
      
      console.log(`✓ Follow-up message ${i} sent successfully`);
    }
    
    // Check updated stats
    console.log('\n4. Checking updated user stats...');
    const updatedStats = await axios.get(`${baseURL}/api/user/stats`, { headers: authHeaders });
    console.log('Updated conversation count:', updatedStats.data.totalConversations);
    console.log('Total messages should be around 12 (6 user + 6 AI responses)');
    
    // Test conversation history for each conversation
    console.log('\n5. Checking conversation histories...');
    for (const convId of conversations) {
      const historyResponse = await axios.get(`${baseURL}/api/chat/history/${convId}`, { headers: authHeaders });
      console.log(`Conversation ${convId}: ${historyResponse.data.messageCount} messages`);
    }
    
    // Final comparison
    console.log('\n6. Summary:');
    console.log(`Initial conversations: ${initialStats.data.totalConversations}`);
    console.log(`Final conversations: ${updatedStats.data.totalConversations}`);
    console.log(`Expected increase: 3`);
    console.log(`Actual increase: ${updatedStats.data.totalConversations - initialStats.data.totalConversations}`);
    
    if (updatedStats.data.totalConversations > initialStats.data.totalConversations) {
      console.log('✅ SUCCESS: Conversation count is being saved and updated!');
    } else {
      console.log('❌ ISSUE: Conversation count is not increasing as expected');
    }
    
  } catch (error) {
    console.error('Error testing conversation counting:', error.response?.data || error.message);
  }
}

testConversationCounting();
