const axios = require('axios');

async function testStatsAPI() {
  try {
    console.log('🧪 Testing Stats API for Dashboard...');
    
    // Test the stats endpoint
    const response = await axios.get('http://localhost:5000/api/user/stats');
    
    console.log('📊 Stats API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Verify the structure matches what Dashboard expects
    const stats = response.data;
    const expectedFields = [
      'totalConversations',
      'totalQuizzes', 
      'totalFilesUploaded',
      'averageQuizScore',
      'studyStreak',
      'totalPoints'
    ];
    
    console.log('\n✅ Dashboard Field Validation:');
    expectedFields.forEach(field => {
      const hasField = stats.hasOwnProperty(field);
      const value = stats[field];
      console.log(`  ${hasField ? '✓' : '✗'} ${field}: ${value}`);
    });
    
    console.log('\n🎯 Dashboard will display:');
    console.log(`💬 Conversations: ${stats.totalConversations || 0}`);
    console.log(`🧠 Quizzes: ${stats.totalQuizzes || 0}`);
    console.log(`📄 Files: ${stats.totalFilesUploaded || 0}`);
    console.log(`⭐ Avg Score: ${stats.averageQuizScore || 0}%`);
    console.log(`🔥 Streak: ${stats.studyStreak || 0} days`);
    console.log(`🏆 Points: ${stats.totalPoints || 0}`);
    
  } catch (error) {
    console.error('❌ Error testing stats API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testStatsAPI();
