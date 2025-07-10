const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testQuizForAkshayaa() {
  try {
    console.log('🔍 Testing Quiz Flow for Akshayaa_S...\n');

    // 1. Login as Akshayaa_S
    console.log('1. Logging in as Akshayaa_S...');
    const authResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      login: 'abc@gmail.com',
      password: 'akshayaa'
    });

    const token = authResponse.data.token;
    const user = authResponse.data.user;
    const authHeaders = { Authorization: `Bearer ${token}` };

    console.log(`✅ Logged in as: ${user.username} (${user.email})`);

    // 2. Create a simple quiz manually (without AI) for testing
    console.log('\n2. Creating a test quiz...');
    
    // Since AI generation might be slow, let's create a quiz manually in the database
    const testQuiz = {
      title: "Basic Math Quiz",
      topic: "Mathematics",
      difficulty: "easy",
      questionType: "multiple-choice",
      questions: [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correct: 1,
          explanation: "2 + 2 equals 4"
        },
        {
          question: "What is 5 * 3?",
          options: ["13", "15", "17", "18"],
          correct: 1,
          explanation: "5 multiplied by 3 equals 15"
        }
      ]
    };

    // Try to generate a quiz via API (this might take time due to AI)
    let quizResponse;
    try {
      console.log('   Generating quiz via AI...');
      quizResponse = await axios.post(`${API_BASE_URL}/quiz/generate`, {
        topic: 'Basic Mathematics',
        difficulty: 'easy',
        questionCount: 2
      }, { 
        headers: authHeaders,
        timeout: 15000 // 15 second timeout
      });
      console.log(`✅ Quiz generated: ${quizResponse.data.title}`);
    } catch (genError) {
      console.log(`❌ Quiz generation failed: ${genError.message}`);
      console.log('   This is likely due to AI API timeout or quota limits');
      return;
    }

    const quiz = quizResponse.data;

    // 3. Submit quiz answers
    console.log('\n3. Submitting quiz answers...');
    const answers = [1, 0]; // Submit some answers
    const submitResponse = await axios.post(`${API_BASE_URL}/quiz/${quiz.id}/submit`, {
      answers: answers,
      timeSpent: 45
    }, { headers: authHeaders });

    const result = submitResponse.data;
    console.log(`✅ Quiz submitted successfully!`);
    console.log(`📊 Score: ${result.score.percentage}% (${result.score.correct}/${result.score.total})`);

    // 4. Check if the result appears in history
    console.log('\n4. Checking updated quiz history...');
    const historyResponse = await axios.get(`${API_BASE_URL}/quiz/history`, {
      headers: authHeaders
    });

    const history = historyResponse.data;
    console.log(`✅ Updated quiz history: ${history.totalQuizzes} quiz(s), avg score: ${history.averageScore}%`);

    if (history.results.length > 0) {
      console.log('   Recent results:');
      history.results.forEach((result, index) => {
        const score = typeof result.score === 'object' ? result.score.percentage : result.score;
        console.log(`   ${index + 1}. ${result.quiz?.title || 'Unknown Quiz'} - ${score}%`);
      });
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testQuizForAkshayaa();
