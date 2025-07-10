const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// File Analysis Model
const FileAnalysis = sequelize.define('FileAnalysis', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  analysis: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  textContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processingStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  }
});

// Study Activity Model
const StudyActivity = sequelize.define('StudyActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.ENUM('chat_message', 'quiz_generated', 'quiz_completed', 'file_uploaded', 'study_session'),
    allowNull: false
  },
  details: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  duration: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = { FileAnalysis, StudyActivity };
