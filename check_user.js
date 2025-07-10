const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function checkSpecificUser() {
  try {
    console.log('🔍 Checking user: Akshayaa_S (abc@gmail.com)...\n');

    // 1. Try to login with email
    console.log('1. Trying login with email...');
    try {
      const emailLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: 'abc@gmail.com',
        password: 'akshayaa'
      });
      
      const token = emailLoginResponse.data.token;
      const user = emailLoginResponse.data.user;
      console.log(`✅ Email login successful: ${user.username} (${user.email})`);
      
      await testUserData(token, user);
      return;
      
    } catch (emailError) {
      console.log(`❌ Email login failed: ${emailError.response?.data?.error || emailError.message}`);
    }

    // 2. Try to login with username
    console.log('\n2. Trying login with username...');
    try {
      const usernameLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        login: 'Akshayaa_S',
        password: 'akshayaa'
      });
      
      const token = usernameLoginResponse.data.token;
      const user = usernameLoginResponse.data.user;
      console.log(`✅ Username login successful: ${user.username} (${user.email})`);
      
      await testUserData(token, user);
      return;
      
    } catch (usernameError) {
      console.log(`❌ Username login failed: ${usernameError.response?.data?.error || usernameError.message}`);
    }

    // 3. If login failed, try to register the user
    console.log('\n3. User not found, attempting registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: 'Akshayaa_S',
        email: 'abc@gmail.com',
        password: 'akshayaa'
      });
      
      const token = registerResponse.data.token;
      const user = registerResponse.data.user;
      console.log(`✅ Registration successful: ${user.username} (${user.email})`);
      
      await testUserData(token, user);
      
    } catch (registerError) {
      console.log(`❌ Registration failed: ${registerError.response?.data?.error || registerError.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testUserData(token, user) {
  const authHeaders = { Authorization: `Bearer ${token}` };
  
  console.log(`\n📊 Testing data for user: ${user.username}`);
  
  // Check quiz history
  try {
    const quizHistoryResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });
    const quizHistory = quizHistoryResponse.data;
    console.log(`✅ Quiz history: ${quizHistory.totalQuizzes} quiz(s), avg score: ${quizHistory.averageScore}%`);
    
    if (quizHistory.results.length > 0) {
      console.log('   Recent quiz results:');
      quizHistory.results.slice(0, 3).forEach((result, index) => {
        const score = typeof result.score === 'object' ? result.score.percentage : result.score;
        console.log(`   ${index + 1}. ${result.quiz?.title || 'Unknown Quiz'} - ${score}%`);
      });
    }
  } catch (error) {
    console.log(`❌ Quiz history error: ${error.response?.data?.error || error.message}`);
  }
  
  // Check file history
  try {
    const fileHistoryResponse = await axios.get(`${API_BASE_URL}/files/history`, {
      headers: authHeaders
    });
    const fileHistory = fileHistoryResponse.data;
    console.log(`✅ File history: ${fileHistory.totalFiles} file(s) analyzed`);
    
    if (fileHistory.files.length > 0) {
      console.log('   Recent files:');
      fileHistory.files.slice(0, 3).forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.fileName} (${(file.fileSize / 1024).toFixed(1)}KB)`);
      });
    }
  } catch (error) {
    console.log(`❌ File history error: ${error.response?.data?.error || error.message}`);
  }
  
  // Check user stats
  try {
    const userStatsResponse = await axios.get(`${API_BASE_URL}/user/stats`, {
      headers: authHeaders
    });
    const stats = userStatsResponse.data;
    console.log(`✅ User stats: ${JSON.stringify(stats, null, 2)}`);
  } catch (error) {
    console.log(`❌ User stats error: ${error.response?.data?.error || error.message}`);
  }
}

checkSpecificUser();
