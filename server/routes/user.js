const express = require('express');
const { User, QuizResult, FileAnalysis, StudyActivity, Conversation, Message } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { guestFileAnalyses } = require('../utils/fileStorage');
const router = express.Router();

// Store user data (in production, use a database)
const users = new Map();
const userSettings = new Map();
const userStats = new Map();

// GET /api/user/settings - Get user settings
router.get('/settings', optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      // Authenticated user - get from database
      const user = await User.findByPk(req.user.id);
      
      if (user && user.preferences) {
        res.json(user.preferences);
        return;
      }
    }
    
    // Default settings for guest users or users without saved preferences
    const defaultSettings = {
      language: 'en',
      aiPersonality: 'friendly',
      progressTracking: true,
      notifications: true,
      autoSave: true,
      voiceEnabled: true,
      studyReminders: true,
      difficulty: 'adaptive',
      theme: 'light'
    };
    
    res.json(defaultSettings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// POST /api/user/settings - Update user settings
router.post('/settings', optionalAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    // Validate settings (basic validation)
    const allowedLanguages = ['en', 'hi', 'ta', 'te', 'es', 'fr', 'de'];
    const allowedPersonalities = ['friendly', 'professional', 'casual', 'motivational', 'patient', 'enthusiastic'];
    const allowedDifficulties = ['adaptive', 'beginner', 'intermediate', 'advanced'];
    
    if (settings.language && !allowedLanguages.includes(settings.language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    
    if (settings.aiPersonality && !allowedPersonalities.includes(settings.aiPersonality)) {
      return res.status(400).json({ error: 'Invalid AI personality' });
    }
    
    if (settings.difficulty && !allowedDifficulties.includes(settings.difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    if (req.user) {
      // Authenticated user - save to database
      try {
        await User.update(
          { preferences: settings },
          { where: { id: req.user.id } }
        );
        
        res.json({ 
          message: 'Settings updated successfully',
          settings: settings
        });
      } catch (dbError) {
        console.error('Database error saving settings:', dbError);
        res.status(500).json({ error: 'Failed to save settings to database' });
      }
    } else {
      // Guest user - settings not persistent
      res.json({ 
        message: 'Settings updated for this session (not saved permanently)',
        settings: settings,
        warning: 'Register an account to save your preferences permanently'
      });
    }
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// GET /api/user/stats - Get user statistics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // Guest user - return basic mock stats
      const stats = {
        totalConversations: 0,
        totalQuizzes: 0,
        totalFilesUploaded: 0,
        averageQuizScore: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        favoriteSubjects: [],
        weeklyProgress: [],
        recentAchievements: [],
        totalPoints: 0,
        isGuest: true
      };
      return res.json(stats);
    }

    // Authenticated user - get real stats from database
    const [
      conversationsCount,
      quizResults,
      studyActivities
    ] = await Promise.all([
      Conversation.count({ where: { userId: req.user.id } }),
      QuizResult.findAll({ where: { userId: req.user.id } }),
      StudyActivity.findAll({ 
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']]
      })
    ]);

    // Get file count from file history (which handles both DB and in-memory storage)
    let totalFilesUploaded = 0;
    try {
      // Use the same logic as the file history endpoint
      const dbFiles = await FileAnalysis.findAll({
        where: { userId: req.user.id },
        attributes: ['id']
      });
      
      // Also check in-memory storage for files that belong to this user
      const { guestFileAnalyses } = require('../utils/fileStorage');
      let memoryFileCount = 0;
      if (guestFileAnalyses) {
        for (const [id, analysis] of guestFileAnalyses.entries()) {
          if (analysis.userId === req.user.id) {
            memoryFileCount++;
          }
        }
      }
      
      totalFilesUploaded = (dbFiles?.length || 0) + memoryFileCount;
    } catch (fileError) {
      console.error('Error counting files:', fileError);
      // Fallback: try direct database count
      try {
        totalFilesUploaded = await FileAnalysis.count({ where: { userId: req.user.id } });
      } catch (fallbackError) {
        console.error('Fallback file count failed:', fallbackError);
        totalFilesUploaded = 0;
      }
    }

    // Calculate stats
    const totalQuizzes = quizResults.length;
    const averageQuizScore = totalQuizzes > 0 
      ? Math.round(quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes)
      : 0;
    
    const totalPoints = studyActivities.reduce((sum, activity) => sum + (activity.points || 0), 0);
    
    // Calculate study streak (simplified - days with activity)
    const today = new Date();
    let studyStreak = 0;
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const hasActivity = studyActivities.some(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate.toDateString() === checkDate.toDateString();
      });
      
      if (hasActivity) {
        if (i === 0 || studyStreak > 0) studyStreak++;
        else break;
      } else if (i === 0) {
        break;
      }
    }

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayActivities = studyActivities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate.toDateString() === date.toDateString();
      });
      
      weeklyProgress.push({
        day: days[date.getDay()],
        quizzes: dayActivities.filter(a => a.activityType === 'quiz_completed').length,
        studyTime: dayActivities.length * 15 // rough estimate
      });
    }

    const stats = {
      totalConversations: conversationsCount,
      totalQuizzes: totalQuizzes,
      totalFilesUploaded: totalFilesUploaded,
      averageQuizScore: averageQuizScore,
      studyStreak: studyStreak,
      totalStudyTime: studyActivities.length * 15, // rough estimate
      favoriteSubjects: ['Mathematics', 'Physics', 'Biology'], // TODO: extract from activity data
      weeklyProgress: weeklyProgress,
      recentAchievements: [
        ...(totalQuizzes >= 5 ? [{ title: 'Quiz Explorer', description: 'Completed 5 quizzes', earnedAt: new Date() }] : []),
        ...(averageQuizScore >= 80 ? [{ title: 'High Achiever', description: '80%+ average score', earnedAt: new Date() }] : []),
        ...(studyStreak >= 3 ? [{ title: 'Study Streak', description: `${studyStreak} days in a row!`, earnedAt: new Date() }] : []),
        ...(totalFilesUploaded >= 3 ? [{ title: 'File Analyzer', description: 'Analyzed 3+ files', earnedAt: new Date() }] : [])
      ],
      totalPoints: totalPoints,
      isGuest: false
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

// POST /api/user/activity - Log user activity
router.post('/activity', (req, res) => {
  try {
    const { activityType, data } = req.body;
    
    // Log different types of activities
    const activity = {
      type: activityType,
      data: data,
      timestamp: new Date(),
      userId: 'default_user' // In production, get from auth
    };
    
    // In production, store this in database for analytics
    console.log('User activity logged:', activity);
    
    res.json({ 
      message: 'Activity logged successfully',
      activity: activity
    });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET /api/user/profile - Get user profile
router.get('/profile', (req, res) => {
  try {
    // Return basic profile info
    const profile = {
      id: 'default_user',
      name: 'Study Buddy User',
      email: 'user@studybuddy.com',
      avatar: null,
      joinedAt: new Date('2024-01-01'),
      preferences: userSettings.get('default_user') || {},
      subscription: 'free' // free, premium, etc.
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// POST /api/user/feedback - Submit user feedback
router.post('/feedback', (req, res) => {
  try {
    const { type, message, rating } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Feedback message is required' });
    }
    
    const feedback = {
      id: Date.now().toString(),
      type: type || 'general',
      message: message,
      rating: rating || null,
      submittedAt: new Date(),
      userId: 'default_user'
    };
    
    // In production, store in database and potentially send notifications
    console.log('User feedback received:', feedback);
    
    res.json({ 
      message: 'Thank you for your feedback!',
      feedbackId: feedback.id
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
