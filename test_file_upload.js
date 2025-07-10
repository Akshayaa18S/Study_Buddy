const fs = require('fs');
const FormData = require('form-data');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Helper function for HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => result, text: () => data });
        } catch (e) {
          resolve({ ok: res.statusCode < 400, status: res.statusCode, text: () => data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      if (options.body.pipe) {
        options.body.pipe(req);
      } else {
        req.write(options.body);
        req.end();
      }
    } else {
      req.end();
    }
  });
}

async function testFileUpload() {
  try {
    console.log('🧪 Testing file upload functionality...\n');
    
    // Create a test text file
    const testContent = `
# Software Development Concepts

## What is Software Development Lifecycle?

Software development lifecycle (SDLC) is a structured process used to design, develop, and deploy software applications. It consists of several phases:

1. **Planning**: Define project goals and requirements
2. **Analysis**: Gather detailed requirements and specifications  
3. **Design**: Create system architecture and user interface designs
4. **Implementation**: Write the actual code
5. **Testing**: Verify the software works as expected
6. **Deployment**: Release the software to users
7. **Maintenance**: Ongoing support and updates

## Key Concepts

- **MIME Types**: Multipurpose Internet Mail Extensions used to identify file types
- **File Processing**: Converting file content into usable data formats
- **Placeholder Text**: Temporary content shown when actual data is unavailable

## Study Questions

1. What are the phases of SDLC?
2. Why might some features not be implemented yet in software?
3. What is the purpose of MIME types?
4. How do placeholders help in software development?
`;
    
    const testFileName = 'test_study_material.txt';
    const testFilePath = `e:\\practice_study_tracker\\${testFileName}`;
    
    // Write test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`✅ Created test file: ${testFileName}`);
    
    // Create form data for file upload
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    console.log('📤 Uploading file to backend...');
    
    // Test file upload
    const response = await makeRequest('http://localhost:5000/api/files/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    if (!response.ok) {
      const errorText = response.text();
      console.error(`❌ Upload failed with status ${response.status}:`);
      console.error(errorText);
      return;
    }
    
    const result = response.json();
    console.log('✅ File upload successful!');
    console.log('📊 Response data:');
    console.log(`   - Analysis ID: ${result.analysisId}`);
    console.log(`   - File Name: ${result.fileName}`);
    console.log(`   - File Size: ${result.fileSize} bytes`);
    console.log(`   - Message: ${result.message}`);
    
    console.log('\n🤖 AI Analysis Preview:');
    console.log(result.analysis.substring(0, 500) + '...\n');
    
    // Test getting file history
    console.log('📋 Testing file history retrieval...');
    const historyResponse = await makeRequest('http://localhost:5000/api/files/history');
    
    if (historyResponse.ok) {
      const historyData = historyResponse.json();
      console.log(`✅ Retrieved ${historyData.totalFiles} files from history`);
      
      if (historyData.files.length > 0) {
        console.log('📁 Latest file:', historyData.files[0].fileName);
      }
    } else {
      console.error('❌ Failed to retrieve file history');
    }
    
    // Test quiz generation from file
    console.log('\n🎯 Testing quiz generation from uploaded file...');
    const quizResponse = await makeRequest(`http://localhost:5000/api/files/generate-quiz/${result.analysisId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        difficulty: 'medium',
        questionCount: 3
      })
    });
    
    if (quizResponse.ok) {
      const quizData = quizResponse.json();
      console.log('✅ Quiz generation successful!');
      console.log(`📝 Quiz Title: ${quizData.quiz.title}`);
      console.log(`🎯 Topic: ${quizData.quiz.topic}`);
      console.log(`📊 Questions: ${quizData.quiz.questions.length}`);
      
      if (quizData.quiz.questions.length > 0) {
        console.log('\n❓ Sample Question:');
        console.log(`   Q: ${quizData.quiz.questions[0].question}`);
        console.log(`   Options: ${quizData.quiz.questions[0].options.join(', ')}`);
      }
    } else {
      const errorText = quizResponse.text();
      console.log('⚠️ Quiz generation failed (this might be expected if AI service is unavailable)');
      console.log(`   Error: ${errorText}`);
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\n🧹 Cleaned up test file');
    
    console.log('\n✅ File upload functionality test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testFileUpload();
