# 🤖 AI Study Buddy - Full Stack Application

A modern, full-stack AI-powered study companion built with React, Node.js, Express, MySQL, and Google Gemini AI.

## ✨ Features

### 🎯 Core Features
- **AI Chat Assistant** - Interactive conversations with customizable AI personalities
- **File Upload & Analysis** - Upload study materials and get AI-powered summaries
- **Quiz Generation** - Create custom quizzes from topics or uploaded files
- **Voice Chat** - Voice interaction capabilities
- **Progress Tracking** - Detailed analytics and study progress monitoring
- **Study History** - Complete history of conversations, quizzes, and files

### 🔐 Authentication & User Management
- **User Registration & Login** - Secure JWT-based authentication
- **Guest Mode** - Limited functionality without registration
- **Persistent Data** - MySQL database for authenticated users
- **Settings Sync** - Cloud-synced user preferences

### 📊 Advanced Features
- **Study Dashboard** - Comprehensive analytics with charts and progress bars
- **Achievement System** - Gamified learning with points and badges
- **Study Streaks** - Track consecutive study days
- **Multi-language Support** - Multiple AI personalities and languages
- **Dark/Light Mode** - Customizable theme preferences

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern React with Hooks
- **React Router** - Client-side routing
- **Bootstrap 5** - Responsive UI framework
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **React-Chart.js-2** - React wrapper for Chart.js

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **Sequelize** - ORM for database operations
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload middleware
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### AI Integration
- **Google Gemini AI** - Advanced language model
- **@google/generative-ai** - Official Google AI SDK

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd practice_study_tracker
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Configuration

1. **Backend Environment Setup**
   Create `server/.env` file:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=ai_study_buddy
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password

   # JWT Configuration
   JWT_SECRET=your_super_secure_jwt_secret_key_here

   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key_here

   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

2. **Database Setup**
   ```bash
   cd server
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE ai_study_buddy;
   exit

   # Run database initialization script
   node scripts/init-db.js
   ```

3. **Frontend Environment Setup**
   Create `client/.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server will run on `http://localhost:5000`

2. **Start the frontend application**
   ```bash
   cd client
   npm start
   ```
   Client will run on `http://localhost:3000`

## 📁 Project Structure

```
practice_study_tracker/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── AuthModal.js
│   │   │   ├── Dashboard.js
│   │   │   └── Navbar.js
│   │   ├── pages/          # Page components
│   │   │   ├── ChatPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── FileUploadPage.js
│   │   │   ├── HistoryPage.js
│   │   │   ├── QuizPage.js
│   │   │   ├── SettingsPage.js
│   │   │   └── VoiceChatPage.js
│   │   ├── services/       # API services
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── server/                 # Node.js backend
    ├── config/
    │   └── database.js     # Database configuration
    ├── middleware/
    │   └── auth.js         # Authentication middleware
    ├── models/             # Sequelize models
    │   ├── User.js
    │   ├── Conversation.js
    │   ├── Quiz.js
    │   ├── FileAnalysis.js
    │   └── index.js
    ├── routes/             # API routes
    │   ├── auth.js
    │   ├── chat.js
    │   ├── files.js
    │   ├── quiz.js
    │   └── user.js
    ├── scripts/
    │   └── init-db.js      # Database initialization
    ├── uploads/            # File upload directory
    ├── index.js            # Main server file
    └── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/:conversationId` - Get conversation history
- `DELETE /api/chat/history/:conversationId` - Clear conversation
- `POST /api/chat/voice` - Voice input processing

### Quiz
- `POST /api/quiz/generate` - Generate quiz
- `GET /api/quiz/:quizId` - Get specific quiz
- `POST /api/quiz/:quizId/submit` - Submit quiz answers
- `GET /api/quiz/results/:resultId` - Get quiz results
- `GET /api/quiz/history` - Get quiz history

### Files
- `POST /api/files/upload` - Upload and analyze file
- `GET /api/files/analysis/:analysisId` - Get file analysis
- `POST /api/files/generate-quiz/:analysisId` - Generate quiz from file
- `GET /api/files/history` - Get file history
- `DELETE /api/files/:analysisId` - Delete file

### User
- `GET /api/user/settings` - Get user settings
- `POST /api/user/settings` - Update user settings
- `GET /api/user/stats` - Get user statistics

## 🎨 Features Breakdown

### Authentication System
- **Dual Mode**: Supports both authenticated users and guests
- **JWT Security**: Secure token-based authentication
- **Data Persistence**: MySQL storage for authenticated users
- **Fallback Storage**: In-memory storage for guest users

### AI Integration
- **Google Gemini**: Advanced AI responses
- **Multiple Personalities**: Friendly, Professional, Casual, Motivational, Patient, Enthusiastic
- **Context Awareness**: Maintains conversation history
- **Error Handling**: Graceful API error management

### Study Analytics
- **Progress Tracking**: Visual charts and statistics
- **Achievement System**: Gamified learning experience
- **Study Streaks**: Consecutive day tracking
- **Subject Analysis**: Distribution of study topics

### File Processing
- **Multiple Formats**: Support for PDF, TXT, DOC, DOCX, images
- **AI Analysis**: Automatic content summarization
- **Quiz Generation**: Create quizzes from uploaded content
- **Storage Management**: Secure file upload and storage

## 🔧 Development

### Adding New Features
1. **Backend**: Add routes in `server/routes/`
2. **Database**: Update models in `server/models/`
3. **Frontend**: Add components in `client/src/components/` or pages in `client/src/pages/`
4. **API**: Update API service in `client/src/services/api.js`

### Database Migrations
```bash
cd server
# Create new migration
npx sequelize-cli migration:create --name add-new-feature

# Run migrations
npx sequelize-cli db:migrate
```

### Testing
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 🚀 Deployment

### Production Environment Variables
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
JWT_SECRET=your_production_jwt_secret
GEMINI_API_KEY=your_production_gemini_key
```

### Build for Production
```bash
# Build frontend
cd client
npm run build

# Start production server
cd server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for advanced language processing
- React team for the amazing framework
- Bootstrap for the responsive UI components
- Framer Motion for smooth animations
- Chart.js for data visualizations

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

**Happy Learning! 🎓**
"# Study_Buddy" 
