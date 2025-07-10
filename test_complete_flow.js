const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCompleteFlow() {
  try {
    console.log('🔍 Testing Complete Quiz Flow for Akshayaa_S...\n');

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

    // 2. Test with fallback quiz (since AI might be overloaded)
    console.log('\n2. Testing with fallback quiz generation...');
    
    // Force a fallback by using a topic that triggers the AI overload simulation
    try {
      const quizResponse = await axios.post(`${API_BASE_URL}/quiz/generate`, {
        topic: 'Mathematics',
        difficulty: 'easy',
        questionCount: 2
      }, { 
        headers: authHeaders,
        timeout: 5000 // Short timeout to trigger fallback faster
      });

      const quiz = quizResponse.data.quiz;
      console.log(`✅ Quiz generated: "${quiz.title}" (ID: ${quiz.id})`);
      console.log(`   Questions: ${quiz.questions.length}`);
      console.log(`   AI Generated: ${quizResponse.data.isAIGenerated !== false ? 'Yes' : 'No (Fallback)'}`);

      // 3. Submit the quiz
      console.log('\n3. Submitting quiz answers...');
      const answers = [0, 1]; // Answer first option for each question
      const submitResponse = await axios.post(`${API_BASE_URL}/quiz/${quiz.id}/submit`, {
        answers: answers,
        timeSpent: 45
      }, { headers: authHeaders });

      const result = submitResponse.data;
      console.log(`✅ Quiz submitted successfully!`);
      console.log(`📊 Score: ${result.score.percentage}% (${result.score.correct}/${result.score.total})`);
      console.log(`🆔 Result ID: ${result.resultId || 'N/A'}`);

      // 4. Wait a moment then check history
      console.log('\n4. Checking history after submission...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
        headers: authHeaders
      });

      const history = historyResponse.data;
      console.log(`📋 History check: ${history.totalQuizzes} quiz(s) found`);

      if (history.results.length > 0) {
        console.log('🎉 SUCCESS! Quiz results found:');
        history.results.forEach((result, index) => {
          const score = typeof result.score === 'object' ? result.score.percentage : result.score;
          console.log(`   ${index + 1}. ${result.quiz?.title || 'Unknown Quiz'} - ${score}%`);
          console.log(`      Created: ${result.createdAt}`);
          console.log(`      Quiz ID: ${result.quizId}`);
        });
      } else {
        console.log('❌ PROBLEM: No quiz results found in history!');
        
        // Debug information
        console.log('\n🔍 Debug Info:');
        console.log(`User ID: ${user.id}`);
        console.log(`Quiz ID used: ${quiz.id}`);
        console.log(`Auth token present: ${!!token}`);
      }

      // 5. Check if the quiz still exists
      console.log('\n5. Checking if quiz still exists...');
      try {
        const quizCheckResponse = await axios.get(`${API_BASE_URL}/quiz/${quiz.id}`, {
          headers: authHeaders
        });
        console.log(`✅ Quiz still exists: ${quizCheckResponse.data.title}`);
      } catch (quizError) {
        console.log(`❌ Quiz no longer exists: ${quizError.response?.data?.error}`);
      }

    } catch (genError) {
      console.log(`❌ Quiz generation failed: ${genError.message}`);
      
      if (genError.code === 'ECONNABORTED') {
        console.log('⏱️ Request timed out - this is expected for testing fallback');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteFlow();
