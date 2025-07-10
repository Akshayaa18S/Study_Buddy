require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    console.log('API Key (first 10 chars):', process.env.GEMINI_API_KEY?.substring(0, 10));
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Hello, can you help me with a simple math problem?";
    
    console.log('Sending request to Gemini...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API response received:');
    console.log(text.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Gemini API error:', error.message);
    
    if (error.message?.includes('API_KEY')) {
      console.error('Issue with API key - check if it\'s valid');
    }
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.error('API quota/limit issue');
    }
    if (error.message?.includes('ENOTFOUND') || error.message?.includes('timeout')) {
      console.error('Network connectivity issue');
    }
  }
}

testGeminiAPI();
