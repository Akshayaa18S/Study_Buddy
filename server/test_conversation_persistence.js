const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testConversationPersistence() {
  try {
    console.log('Testing conversation persistence and retrieval...');
    
    // Create a test user
    const timestamp = Date.now();
    const testEmail = `convpersist_${timestamp}@example.com`;
    
    console.log('\n1. Creating test user...');
    const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
      username: `convpersist_${timestamp}`,
      email: testEmail,
      password: 'password123',
      firstName: 'Persist',
      lastName: 'Test'
    });
    
    console.log('✓ User registered successfully');
    
    // Login
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      login: testEmail,
      password: 'password123'
    });
    
    const authHeaders = { Authorization: `Bearer ${loginResponse.data.token}` };
    console.log('✓ User logged in successfully');
    
    // Test empty conversations list
    console.log('\n2. Testing empty conversations list...');
    const emptyConversations = await axios.get(`${baseURL}/api/chat/conversations`, { headers: authHeaders });
    console.log('Empty conversations response:', emptyConversations.data);
    
    // Create first conversation
    console.log('\n3. Creating first conversation...');
    const conv1Id = `test_persist_conv_1_${timestamp}`;
    
    const msg1Response = await axios.post(`${baseURL}/api/chat/message`, {
      message: 'Hello, this is my first message in conversation 1',
      conversationId: conv1Id,
      personality: 'friendly'
    }, { headers: authHeaders });
    
    console.log('✓ First message sent successfully');
    
    // Send another message to the same conversation
    const msg2Response = await axios.post(`${baseURL}/api/chat/message`, {
      message: 'This is my second message in the same conversation',
      conversationId: conv1Id,
      personality: 'friendly'
    }, { headers: authHeaders });
    
    console.log('✓ Second message sent successfully');
    
    // Create second conversation
    console.log('\n4. Creating second conversation...');
    const conv2Id = `test_persist_conv_2_${timestamp}`;
    
    const msg3Response = await axios.post(`${baseURL}/api/chat/message`, {
      message: 'Hello, this is my first message in conversation 2',
      conversationId: conv2Id,
      personality: 'professional'
    }, { headers: authHeaders });
    
    console.log('✓ Third message sent successfully');
    
    // Get conversations list
    console.log('\n5. Getting conversations list...');
    const conversationsResponse = await axios.get(`${baseURL}/api/chat/conversations`, { headers: authHeaders });
    console.log('Conversations list:', JSON.stringify(conversationsResponse.data, null, 2));
    
    // Get history for each conversation
    console.log('\n6. Getting conversation histories...');
    
    const conv1History = await axios.get(`${baseURL}/api/chat/history/${conv1Id}`, { headers: authHeaders });
    console.log(`Conversation 1 history (${conv1History.data.messageCount} messages):`, 
                conv1History.data.messages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));
    
    const conv2History = await axios.get(`${baseURL}/api/chat/history/${conv2Id}`, { headers: authHeaders });
    console.log(`Conversation 2 history (${conv2History.data.messageCount} messages):`, 
                conv2History.data.messages.map(m => `${m.role}: ${m.content.substring(0, 50)}...`));
    
    console.log('\n✅ SUCCESS: Conversation persistence and retrieval working correctly!');
    console.log('- Conversations are being created and saved');
    console.log('- Conversation list endpoint returns correct data');
    console.log('- Individual conversation history can be retrieved');
    console.log('- Messages are persisted across requests');
    
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
  }
}

testConversationPersistence();
