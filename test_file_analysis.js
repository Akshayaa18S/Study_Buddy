const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:5000/api';

async function testFileAnalysis() {
  try {
    console.log('🔍 Testing File Analysis for Akshayaa_S...\n');

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

    // 2. Create a test text file
    console.log('\n2. Creating test file...');
    const testContent = `
    Mathematics Study Notes
    
    Chapter 1: Basic Algebra
    - Variables are symbols that represent unknown values
    - Equations are mathematical statements with an equals sign
    - Example: 2x + 5 = 15, solve for x
    
    Chapter 2: Geometry
    - A triangle has three sides and three angles
    - The sum of angles in a triangle is always 180 degrees
    - Pythagorean theorem: a² + b² = c²
    `;
    
    const testFilePath = path.join(__dirname, 'test_study_notes.txt');
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Test file created: ${testFilePath}`);

    // 3. Upload and analyze the file
    console.log('\n3. Uploading file for analysis...');
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFilePath));

      const uploadResponse = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
        headers: {
          ...authHeaders,
          ...formData.getHeaders()
        },
        timeout: 30000 // 30 second timeout for file analysis
      });

      const analysisResult = uploadResponse.data;
      console.log(`✅ File uploaded and analyzed successfully!`);
      console.log(`📁 File: ${analysisResult.fileName}`);
      console.log(`🆔 Analysis ID: ${analysisResult.id}`);
      console.log(`📊 Analysis preview: ${analysisResult.analysis ? analysisResult.analysis.substring(0, 200) + '...' : 'No preview'}`);

    } catch (uploadError) {
      console.log(`❌ File upload failed: ${uploadError.response?.data?.error || uploadError.message}`);
      
      if (uploadError.code === 'ECONNABORTED') {
        console.log('⏱️ Upload timed out - AI analysis might be taking too long');
      }
    }

    // 4. Check file history
    console.log('\n4. Checking file history...');
    const fileHistoryResponse = await axios.get(`${API_BASE_URL}/files/history`, {
      headers: authHeaders
    });

    const fileHistory = fileHistoryResponse.data;
    console.log(`📋 File history: ${fileHistory.totalFiles} file(s) found`);

    if (fileHistory.files.length > 0) {
      console.log('📁 Recent files:');
      fileHistory.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.fileName} (${(file.fileSize / 1024).toFixed(1)}KB)`);
        console.log(`      Uploaded: ${file.uploadedAt}`);
        console.log(`      Preview: ${file.analysisPreview || 'No preview'}`);
      });
    } else {
      console.log('❌ No files found in history');
    }

    // 5. Check updated user stats
    console.log('\n5. Checking updated user stats...');
    const userStatsResponse = await axios.get(`${API_BASE_URL}/user/stats`, {
      headers: authHeaders
    });

    const stats = userStatsResponse.data;
    console.log(`📊 Files uploaded: ${stats.totalFilesUploaded}`);
    console.log(`📈 Total points: ${stats.totalPoints}`);

    // 6. Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('\n🧹 Test file cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The server appears to be down. Please start it with:');
      console.log('   cd server && npm start');
    }
  }
}

testFileAnalysis();
