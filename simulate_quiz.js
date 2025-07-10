const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function simulateQuizFlow() {
  try {
    console.log('🎯 Simulating exact frontend quiz flow for Akshayaa_S...\n');

    // 1. Login (exactly like frontend)
    console.log('1. Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: 'abc@gmail.com',
      password: 'akshayaa'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    const authHeaders = { Authorization: `Bearer ${token}` };

    console.log(`✅ Logged in: ${user.username}`);

    // 2. Generate a simple quiz (with shorter timeout)
    console.log('\n2. Generating quiz...');
    let quiz;
    try {
      const quizResponse = await axios.post(`${API_BASE_URL}/quiz/generate`, {
        topic: 'Math',
        difficulty: 'easy',
        questionCount: 2
      }, { 
        headers: authHeaders,
        timeout: 10000 // 10 second timeout
      });
      quiz = quizResponse.data;
      console.log(`✅ Quiz generated: "${quiz.title}" (ID: ${quiz.id})`);
    } catch (genError) {
      console.log(`⚠️ Quiz generation failed: ${genError.message}`);
      console.log('   Let me try to get an existing quiz or create a manual test...');
      
      // If generation fails, let's test with the guest quiz system
      console.log('\n   Testing guest quiz system instead...');
      try {
        const guestQuizResponse = await axios.post(`${API_BASE_URL}/quiz/generate`, {
          topic: 'Simple Math',
          difficulty: 'easy',
          questionCount: 1
        }); // No auth headers - will be stored as guest
        console.log(`✅ Guest quiz created for testing`);
        return; // Skip authenticated test for now
      } catch (guestError) {
        console.log(`❌ Even guest quiz failed: ${guestError.message}`);
        return;
      }
    }

    // 3. Submit answers
    console.log('\n3. Submitting quiz answers...');
    const answers = [0, 1]; // Mock answers
    const submitResponse = await axios.post(`${API_BASE_URL}/quiz/${quiz.id}/submit`, {
      answers: answers,
      timeSpent: 60
    }, { headers: authHeaders });

    const result = submitResponse.data;
    console.log(`✅ Quiz submitted!`);
    console.log(`📊 Result: ${result.score.percentage}% (${result.score.correct}/${result.score.total})`);

    // 4. Immediately check history
    console.log('\n4. Checking history immediately after submission...');
    const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });

    const history = historyResponse.data;
    console.log(`📋 History: ${history.totalQuizzes} quiz(s), avg: ${history.averageScore}%`);

    if (history.results.length > 0) {
      console.log('✅ SUCCESS! Quiz found in history:');
      history.results.forEach((result, index) => {
        const score = typeof result.score === 'object' ? result.score.percentage : result.score;
        console.log(`   ${index + 1}. ${result.quiz?.title || 'Unknown'} - ${score}%`);
      });
    } else {
      console.log('❌ PROBLEM: Quiz not found in history after submission!');
      
      // Let's check what went wrong
      console.log('\n🔍 Debugging: Checking user data again...');
      const userCheckResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: authHeaders
      });
      console.log(`User ID: ${userCheckResponse.data.user.id}`);
      
      // Check if quiz was created
      try {
        const quizCheckResponse = await axios.get(`${API_BASE_URL}/quiz/${quiz.id}`, {
          headers: authHeaders
        });
        console.log(`Quiz exists: ${quizCheckResponse.data.title}`);
      } catch (quizError) {
        console.log(`❌ Quiz doesn't exist: ${quizError.response?.data?.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on http://localhost:5000');
    }
  }
}

simulateQuizFlow();
