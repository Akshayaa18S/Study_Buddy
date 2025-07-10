const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testSimpleFlow() {
  try {
    console.log('🔍 Testing Simple Auth and History Flow...\n');

    // 1. Login with existing user
    console.log('1. Logging in...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: 'test@example.com',
      password: 'password123'
    });

    const token = authResponse.data.token;
    const user = authResponse.data.user;
    const authHeaders = { Authorization: `Bearer ${token}` };

    console.log(`✅ Logged in as: ${user.username} (${user.email})`);

    // 2. Check current quiz history
    console.log('\n2. Checking current quiz history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });

    const history = historyResponse.data;
    console.log(`✅ Current quiz history: ${history.totalQuizzes} quiz(s) found`);
    console.log(`📊 Current average score: ${history.averageScore}%`);

    // 3. Check file history
    console.log('\n3. Checking file history...');
    const fileHistoryResponse = await axios.get(`${API_BASE_URL}/files/history`, {
      headers: authHeaders
    });

    const fileHistory = fileHistoryResponse.data;
    console.log(`✅ File history: ${fileHistory.totalFiles} file(s) found`);

    // 4. Check current user info
    console.log('\n4. Checking user info...');
    const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders
    });

    const currentUser = userResponse.data.user;
    console.log(`✅ Current user: ${currentUser.username}`);
    console.log(`📈 Study stats: ${JSON.stringify(currentUser.studyStats, null, 2)}`);

    console.log('\n🎉 Simple test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleFlow();
