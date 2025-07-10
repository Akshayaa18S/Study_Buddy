const axios = require('axios');

const baseURL = 'http://localhost:5000';

async function testUserStats() {
  try {
    console.log('Testing user stats with conversation count...');
    
    // Login with one of the existing test users
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      login: 'convtest_1752118141931@example.com',
      password: 'password123'
    });
    
    const authToken = loginResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${authToken}` };
    
    console.log('✓ Logged in successfully');
    
    // Get user stats
    const statsResponse = await axios.get(`${baseURL}/api/user/stats`, { headers: authHeaders });
    console.log('\nUser Stats:');
    console.log('- Total Conversations:', statsResponse.data.totalConversations);
    console.log('- Total Files Uploaded:', statsResponse.data.totalFilesUploaded);
    console.log('- Total Quizzes:', statsResponse.data.totalQuizzes);
    console.log('- Total Points:', statsResponse.data.totalPoints);
    console.log('- Study Streak:', statsResponse.data.studyStreak);
    
    if (statsResponse.data.totalConversations > 0) {
      console.log('\n✅ SUCCESS: Conversation count is properly reflected in user stats!');
    } else {
      console.log('\n⚠️  Note: This user may not have conversations yet');
    }
    
  } catch (error) {
    console.error('Error testing user stats:', error.response?.data || error.message);
  }
}

testUserStats();
