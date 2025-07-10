const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testManualQuiz() {
  try {
    console.log('🔍 Testing Manual Quiz Submission...\n');

    // 1. Login
    console.log('1. Logging in...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: 'abc@gmail.com',
      password: 'akshayaa'
    });

    const token = authResponse.data.token;
    const user = authResponse.data.user;
    const authHeaders = { Authorization: `Bearer ${token}` };

    console.log(`✅ Logged in: ${user.username} (ID: ${user.id})`);

    // 2. Create a manual quiz ID and submit it directly
    console.log('\n2. Testing direct quiz submission...');
    
    // Generate a fake quiz ID for testing
    const fakeQuizId = 'test-quiz-' + Date.now();
    console.log(`📝 Using test quiz ID: ${fakeQuizId}`);

    try {
      // Try to submit answers for a non-existent quiz - this should fail gracefully
      const answers = [0, 1, 0];
      const submitResponse = await axios.post(`${API_BASE_URL}/quiz/${fakeQuizId}/submit`, {
        answers: answers,
        timeSpent: 60
      }, { headers: authHeaders });

      console.log(`✅ Submission response:`, submitResponse.data);

    } catch (submitError) {
      console.log(`❌ Expected error for fake quiz: ${submitError.response?.data?.error}`);
    }

    // 3. Check current history
    console.log('\n3. Checking current history state...');
    const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });

    const history = historyResponse.data;
    console.log(`📋 Current history: ${history.totalQuizzes} quiz(s)`);

    // 4. Check if there are any quizzes in the database at all
    console.log('\n4. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`✅ Server health: ${healthResponse.data.status}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The server appears to be down. Please start it with:');
      console.log('   cd server && npm start');
    }
  }
}

testManualQuiz();
