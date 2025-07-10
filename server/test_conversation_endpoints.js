const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testConversationEndpoints() {
  try {
    console.log('Testing conversation endpoints...');
    
    // First test user stats to see conversation count
    console.log('\n1. Testing user stats (without auth)...');
    const statsResponse = await axios.get(`${baseURL}/api/user/stats`);
    console.log('Guest stats:', JSON.stringify(statsResponse.data, null, 2));
    
    // Test sending a message as guest
    console.log('\n2. Testing guest conversation...');
    const conversationId = `conv_${Date.now()}`;
    const messageResponse = await axios.post(`${baseURL}/api/chat/message`, {
      message: 'Hello, can you help me with mathematics?',
      conversationId: conversationId,
      personality: 'friendly'
    });
    console.log('Message response:', JSON.stringify(messageResponse.data, null, 2));
    
    // Test getting conversation history
    console.log('\n3. Testing conversation history...');
    const historyResponse = await axios.get(`${baseURL}/api/chat/history/${conversationId}`);
    console.log('History response:', JSON.stringify(historyResponse.data, null, 2));
    
    // Test with authenticated user (create a test user first)
    console.log('\n4. Testing authenticated user stats...');
    
    // Register a test user
    try {
      const registerResponse = await axios.post(`${baseURL}/api/auth/register`, {
        username: 'testuser_conv',
        email: 'testconv@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      console.log('User registered successfully');
      
      // Login to get token
      const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
        username: 'testuser_conv',
        password: 'password123'
      });
      
      const authToken = loginResponse.data.token;
      console.log('Login successful, token received');
      
      // Test authenticated conversation
      const authConvId = `conv_auth_${Date.now()}`;
      const authHeaders = { Authorization: `Bearer ${authToken}` };
      
      const authMessageResponse = await axios.post(`${baseURL}/api/chat/message`, {
        message: 'Hello, I am an authenticated user. Can you help me study?',
        conversationId: authConvId,
        personality: 'professional'
      }, { headers: authHeaders });
      
      console.log('Authenticated message response:', JSON.stringify(authMessageResponse.data, null, 2));
      
      // Send another message to the same conversation
      const authMessage2Response = await axios.post(`${baseURL}/api/chat/message`, {
        message: 'Can you create a quiz about biology?',
        conversationId: authConvId,
        personality: 'professional'
      }, { headers: authHeaders });
      
      console.log('Second message sent successfully');
      
      // Check authenticated user stats
      const authStatsResponse = await axios.get(`${baseURL}/api/user/stats`, { headers: authHeaders });
      console.log('Authenticated user stats:', JSON.stringify(authStatsResponse.data, null, 2));
      
    } catch (authError) {
      if (authError.response?.status === 409) {
        console.log('User already exists, trying to login...');
        
        // Login with existing user
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
          username: 'testuser_conv',
          password: 'password123'
        });
        
        const authToken = loginResponse.data.token;
        const authHeaders = { Authorization: `Bearer ${authToken}` };
        
        // Check stats for existing user
        const authStatsResponse = await axios.get(`${baseURL}/api/user/stats`, { headers: authHeaders });
        console.log('Existing user stats:', JSON.stringify(authStatsResponse.data, null, 2));
      } else {
        console.error('Auth error:', authError.response?.data || authError.message);
      }
    }
    
  } catch (error) {
    console.error('Error testing conversation endpoints:', error.response?.data || error.message);
  }
}

testConversationEndpoints();
