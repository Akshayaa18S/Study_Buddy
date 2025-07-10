const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testQuizFlow() {
  try {
    console.log('🔍 Testing Quiz Flow...\n');

    // 1. Register a test user
    console.log('1. Registering test user...');
    let authResponse;
    try {
      authResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.data?.error?.includes('already exists')) {
        console.log('📝 User already exists, trying login...');
        authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          login: 'test@example.com',
          password: 'password123'
        });
        console.log('✅ User logged in successfully');
      } else {
        throw error;
      }
    }

    const token = authResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Generate a quiz
    console.log('\n2. Generating a quiz...');
    const quizResponse = await axios.post(`${API_BASE_URL}/quiz/generate`, {
      topic: 'JavaScript Basics',
      difficulty: 'easy',
      questionCount: 3
    }, { headers: authHeaders });

    const quiz = quizResponse.data;
    console.log(`✅ Quiz generated: ${quiz.title} (ID: ${quiz.id})`);

    // 3. Submit quiz answers
    console.log('\n3. Submitting quiz answers...');
    const answers = [0, 1, 0]; // Mock answers
    const submitResponse = await axios.post(`${API_BASE_URL}/quiz/${quiz.id}/submit`, {
      answers,
      timeSpent: 120
    }, { headers: authHeaders });

    const result = submitResponse.data;
    console.log(`✅ Quiz submitted: ${result.score.percentage}% score`);

    // 4. Check quiz history
    console.log('\n4. Checking quiz history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });

    const history = historyResponse.data;
    console.log(`✅ Quiz history retrieved: ${history.totalQuizzes} quiz(s) found`);
    console.log(`📊 Average score: ${history.averageScore}%`);

    if (history.results.length > 0) {
      console.log('\nRecent results:');
      history.results.forEach((result, index) => {
        console.log(`   ${index + 1}. Quiz: ${result.quiz?.title || 'Unknown'} - Score: ${typeof result.score === 'object' ? result.score.percentage : result.score}%`);
      });
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testQuizFlow();
