const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

async function testFileUpload() {
  try {
    console.log('Testing file upload API...');
    
    // Create a test text file
    const testContent = `Test Educational Content

This is a sample educational document for testing the file upload system.

Key Concepts:
1. Software Development Lifecycle
2. File Processing
3. Text Extraction
4. API Testing

This content should be analyzed by the AI system to provide educational insights.

Study Points:
- Understanding MIME types
- File validation processes
- Error handling in uploads
- Fallback mechanisms

Practice Questions:
1. What is a MIME type?
2. How does file validation work?
3. What are fallback mechanisms?

This is a comprehensive test document that covers multiple educational concepts.`;

    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, testContent);
    
    console.log('Created test file:', testFilePath);
    console.log('File size:', fs.statSync(testFilePath).size, 'bytes');
    
    // Create form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    // Test the upload
    const response = await axios.post('http://localhost:5000/api/files/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });
    
    console.log('Upload successful!');
    console.log('Analysis ID:', response.data.analysisId);
    console.log('File Name:', response.data.fileName);
    console.log('Analysis Preview:', response.data.analysis.substring(0, 200) + '...');
    console.log('AI Generated:', response.data.isAIGenerated !== false);
    
    // Test getting the analysis
    const analysisResponse = await axios.get(`http://localhost:5000/api/files/analysis/${response.data.analysisId}`);
    console.log('\nAnalysis retrieval successful!');
    console.log('Full analysis length:', analysisResponse.data.analysis?.length || 'No analysis');
    
    // Clean up
    fs.unlinkSync(testFilePath);
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFileUpload();
