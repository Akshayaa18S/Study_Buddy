// Simple API test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPIs() {
  console.log('🧪 Testing AI Study Buddy APIs...\n');

  // Test 1: Health Check
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', health.data.message);
  } catch (error) {
    console.log('❌ Health Check failed:', error.message);
  }

  // Test 2: User Settings
  try {
    const settings = await axios.get(`${BASE_URL}/user/settings`);
    console.log('✅ User Settings:', Object.keys(settings.data).length, 'settings loaded');
  } catch (error) {
    console.log('❌ User Settings failed:', error.message);
  }

  // Test 3: Chat Message
  try {
    const chatResponse = await axios.post(`${BASE_URL}/chat/message`, {
      message: 'Hello, can you explain photosynthesis?',
      conversationId: 'test_' + Date.now(),
      personality: 'friendly'
    });
    console.log('✅ Chat API: Message sent, received', chatResponse.data.message.length, 'characters');
  } catch (error) {
    console.log('❌ Chat API failed:', error.response?.data?.error || error.message);
  }

  // Test 4: Quiz Generation
  try {
    const quizResponse = await axios.post(`${BASE_URL}/quiz/generate`, {
      topic: 'basic math',
      difficulty: 'easy',
      questionCount: 2
    });
    console.log('✅ Quiz API: Generated quiz with', quizResponse.data.quiz.questions.length, 'questions');
  } catch (error) {
    console.log('❌ Quiz API failed:', error.response?.data?.error || error.message);
  }

  console.log('\n🎯 API Testing Complete!');
}

testAPIs();
