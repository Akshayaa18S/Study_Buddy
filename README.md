🧠 Gemini Chatbot Backend
This is a Node.js Express backend that powers a conversational AI chatbot using Google's Gemini API. It supports multiple AI personalities like casual, professional, motivational, and more.

Perfect for building study buddies, AI tutors, or just vibey chatbots with custom tones 💬✨

🚀 Features
✨ Personality-driven AI responses

🗂️ Conversation history management (stored in-memory)

🎤 Voice input (simulated with transcript for now)

⚡ Easy testing with Postman or frontend apps

🛠️ Setup Instructions
1. Clone the repo
bash
Copy
Edit
git clone https://github.com/yourusername/gemini-chatbot-backend.git
cd gemini-chatbot-backend
2. Install dependencies
nginx
Copy
Edit
npm install
3. Set up your .env file
Create a .env file in the root directory with your Gemini API key:

ini
Copy
Edit
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
PORT=3000
4. Start the server
nginx
Copy
Edit
npm run dev   # if you're using nodemon
# OR
node index.js
Server runs on http://localhost:3000

🧪 How to Test Using Postman
🔹 POST /api/chat/message
URL: http://localhost:3000/api/chat/message
Method: POST
Headers:

pgsql
Copy
Edit
Content-Type: application/json
Body (raw JSON):

json
Copy
Edit
{
  "message": "What is Newton's first law?",
  "conversationId": "test123",
  "personality": "professional",
  "context": "Physics class revision"
}
🔹 GET /api/chat/history/:conversationId
URL: http://localhost:3000/api/chat/history/test123
Method: GET
Returns conversation history for that ID.

🔹 DELETE /api/chat/history/:conversationId
URL: http://localhost:3000/api/chat/history/test123
Method: DELETE
Clears the stored conversation for that ID.

🔹 POST /api/chat/voice
URL: http://localhost:3000/api/chat/voice
Method: POST
Headers:

pgsql
Copy
Edit
Content-Type: application/json
Body (raw JSON):

json
Copy
Edit
{
  "transcript": "Explain how clouds form.",
  "conversationId": "test123",
  "personality": "enthusiastic"
}
🧠 Personalities Available
friendly: Warm, encouraging, and emoji-loving

professional: Formal, structured explanations

casual: Chill Gen Z vibes 🧃

motivational: Hype coach mode 💪

patient: Calm and step-by-step

enthusiastic: Crazy excited about everything 🤩

📦 Tech Stack
Node.js + Express

Gemini API (Google's AI)

RESTful API endpoints

Postman for testing

🧊 To-Do (for Production)
Use a real database (like MongoDB) instead of in-memory Map

Add authentication

Integrate Whisper API or Gemini STT for real voice input

Rate limit and security features

🤝 Contributing
PRs are welcome! Just keep it clean, functional, and full of good vibes. ✨

📜 License
MIT — Feel free to remix and build cool stuff 🤘
