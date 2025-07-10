const axios = require('axios');

async function testStats() {
  try {
    console.log('Testing /api/user/stats endpoint...');
    const response = await axios.get('http://localhost:5000/api/user/stats');
    console.log('Stats Response:');
    console.log('- Total Conversations:', response.data.totalConversations);
    console.log('- Total Files:', response.data.totalFilesUploaded);
    console.log('- Total Quizzes:', response.data.totalQuizzes);
    console.log('- Average Quiz Score:', response.data.averageQuizScore + '%');
    console.log('- Study Streak:', response.data.studyStreak + ' days');
    console.log('- Is Guest:', response.data.isGuest);
    console.log('\nFull response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testStats();
