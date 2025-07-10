const { sequelize, testConnection } = require('../config/database');
const User = require('./User');
const { Conversation, Message } = require('./Conversation');
const { Quiz, QuizResult } = require('./Quiz');
const { FileAnalysis, StudyActivity } = require('./FileAnalysis');

// Define model relationships
// User relationships
User.hasMany(Conversation, { foreignKey: 'userId', as: 'conversations' });
User.hasMany(Quiz, { foreignKey: 'userId', as: 'quizzes' });
User.hasMany(QuizResult, { foreignKey: 'userId', as: 'quizResults' });
User.hasMany(FileAnalysis, { foreignKey: 'userId', as: 'fileAnalyses' });
User.hasMany(StudyActivity, { foreignKey: 'userId', as: 'activities' });

// Conversation relationships
Conversation.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

// Message relationships
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// Quiz relationships
Quiz.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Quiz.hasMany(QuizResult, { foreignKey: 'quizId', as: 'results' });

// Quiz Result relationships
QuizResult.belongsTo(User, { foreignKey: 'userId', as: 'user' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// File Analysis relationships
FileAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Study Activity relationships
StudyActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Database sync error:', error);
  }
};

module.exports = {
  sequelize,
  testConnection,
  User,
  Conversation,
  Message,
  Quiz,
  QuizResult,
  FileAnalysis,
  StudyActivity,
  syncDatabase
};
