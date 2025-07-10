const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Quiz, QuizResult, StudyActivity } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Store quizzes (fallback for non-authenticated users)
const guestQuizzes = new Map();
const guestQuizResults = new Map();

// Fallback quiz generator when AI service is unavailable
const generateFallbackQuiz = (topic, difficulty, questionCount) => {
  const fallbackQuestions = {
    mathematics: [
      {
        question: "What is 15 + 27?",
        options: ["40", "42", "45", "48"],
        correct: 1,
        explanation: "15 + 27 = 42"
      },
      {
        question: "What is 8 × 7?",
        options: ["54", "56", "58", "60"],
        correct: 1,
        explanation: "8 × 7 = 56"
      },
      {
        question: "What is 144 ÷ 12?",
        options: ["10", "12", "14", "16"],
        correct: 1,
        explanation: "144 ÷ 12 = 12"
      }
    ],
    science: [
      {
        question: "What is the chemical symbol for water?",
        options: ["H2O", "CO2", "O2", "H2"],
        correct: 0,
        explanation: "Water is H2O - two hydrogen atoms bonded to one oxygen atom"
      },
      {
        question: "What planet is closest to the Sun?",
        options: ["Venus", "Mercury", "Earth", "Mars"],
        correct: 1,
        explanation: "Mercury is the closest planet to the Sun"
      }
    ],
    general: [
      {
        question: "Which of the following is a prime number?",
        options: ["15", "21", "17", "25"],
        correct: 2,
        explanation: "17 is a prime number as it's only divisible by 1 and itself"
      },
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Madrid", "Paris"],
        correct: 3,
        explanation: "Paris is the capital city of France"
      }
    ]
  };

  // Determine question set based on topic
  let questionSet = fallbackQuestions.general;
  const topicLower = topic.toLowerCase();
  
  if (topicLower.includes('math') || topicLower.includes('arithmetic') || topicLower.includes('number')) {
    questionSet = fallbackQuestions.mathematics;
  } else if (topicLower.includes('science') || topicLower.includes('chemistry') || topicLower.includes('physics') || topicLower.includes('biology')) {
    questionSet = fallbackQuestions.science;
  }

  // Select random questions
  const selectedQuestions = [];
  const availableQuestions = [...questionSet];
  
  for (let i = 0; i < Math.min(questionCount, availableQuestions.length); i++) {
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    selectedQuestions.push(availableQuestions.splice(randomIndex, 1)[0]);
  }

  // If we need more questions than available, repeat some
  while (selectedQuestions.length < questionCount && questionSet.length > 0) {
    const randomQuestion = questionSet[Math.floor(Math.random() * questionSet.length)];
    selectedQuestions.push(randomQuestion);
  }

  return {
    title: `Practice Quiz: ${topic}`,
    topic: topic,
    difficulty: difficulty,
    questions: selectedQuestions
  };
};

// POST /api/quiz/generate - Generate a quiz using AI
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { 
      topic, 
      difficulty = 'medium', 
      questionCount = 5, 
      questionType = 'multiple-choice',
      context = ''
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Create AI prompt for quiz generation
    const prompt = `Create a ${difficulty} level ${questionType} quiz about "${topic}" with ${questionCount} questions.

    ${context ? `Additional context: ${context}` : ''}

    Format the response as a JSON object with this structure:
    {
      "title": "Quiz title",
      "topic": "${topic}",
      "difficulty": "${difficulty}",
      "questions": [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Explanation of why this answer is correct"
        }
      ]
    }

    Make sure:
    - Questions are educational and accurate
    - Options are plausible but only one is correct
    - Explanations are clear and helpful
    - Difficulty matches the requested level
    - All questions are about the specified topic
    - Respond with ONLY the JSON object, no additional text`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse AI response
    let quizData;
    try {
      // Clean the response to extract JSON
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      quizData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('AI Response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    // Generate quiz ID
    const quizId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Add metadata
    const quizMeta = {
      id: quizId,
      title: quizData.title,
      topic: quizData.topic,
      difficulty: quizData.difficulty,
      questionType,
      totalQuestions: quizData.questions.length,
      questions: quizData.questions,
      createdAt: new Date()
    };

    if (req.user) {
      // Authenticated user - save to database
      try {
        const quiz = await Quiz.create({
          id: quizId,
          userId: req.user.id,
          title: quizData.title,
          topic: quizData.topic,
          difficulty: quizData.difficulty,
          questionType,
          questions: quizData.questions,
          totalQuestions: quizData.questions.length
        });

        // Log activity
        await StudyActivity.create({
          userId: req.user.id,
          activityType: 'quiz_generated',
          details: {
            topic: quizData.topic,
            difficulty: quizData.difficulty,
            questionCount: quizData.questions.length
          },
          points: 10
        });

        res.json({
          quizId,
          quiz: quizMeta,
          message: 'Quiz generated successfully'
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        // Fallback to in-memory storage
        guestQuizzes.set(quizId, quizMeta);
        res.json({
          quizId,
          quiz: quizMeta,
          message: 'Quiz generated successfully (using fallback storage)'
        });
      }
    } else {
      // Guest user - use in-memory storage
      guestQuizzes.set(quizId, quizMeta);
      res.json({
        quizId,
        quiz: quizMeta,
        message: 'Quiz generated successfully'
      });
    }

  } catch (error) {
    console.error('Quiz generation error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ 
        error: 'Gemini API key is invalid or missing. Please check your configuration.' 
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('overloaded')) {
      console.log('AI API overloaded, generating fallback quiz...');
      
      // Create a fallback quiz when AI service is unavailable
      const fallbackQuiz = generateFallbackQuiz(topic, difficulty, questionCount);
      const quizId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const quizMeta = {
        id: quizId,
        title: fallbackQuiz.title,
        topic: fallbackQuiz.topic,
        difficulty: fallbackQuiz.difficulty,
        questionType,
        totalQuestions: fallbackQuiz.questions.length,
        questions: fallbackQuiz.questions,
        createdAt: new Date(),
        isAIGenerated: false // Mark as fallback
      };

      if (req.user) {
        // Save fallback quiz for authenticated users
        try {
          await Quiz.create({
            id: quizId,
            userId: req.user.id,
            title: fallbackQuiz.title,
            topic: fallbackQuiz.topic,
            difficulty: fallbackQuiz.difficulty,
            questionType,
            questions: fallbackQuiz.questions,
            totalQuestions: fallbackQuiz.questions.length
          });

          await StudyActivity.create({
            userId: req.user.id,
            activityType: 'quiz_generated',
            details: {
              topic: fallbackQuiz.topic,
              difficulty: fallbackQuiz.difficulty,
              questionCount: fallbackQuiz.questions.length,
              isAIGenerated: false
            }
          });

          res.json({
            quizId,
            quiz: quizMeta,
            message: 'AI service temporarily unavailable. Generated practice quiz.',
            isAIGenerated: false
          });
        } catch (dbError) {
          console.error('Database error:', dbError);
          guestQuizzes.set(quizId, quizMeta);
          res.json({
            quizId,
            quiz: quizMeta,
            message: 'AI service temporarily unavailable. Generated practice quiz (using fallback storage).',
            isAIGenerated: false
          });
        }
      } else {
        // Guest user fallback
        guestQuizzes.set(quizId, quizMeta);
        res.json({
          quizId,
          quiz: quizMeta,
          message: 'AI service temporarily unavailable. Generated practice quiz.',
          isAIGenerated: false
        });
      }
      return;
    }
    
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/quiz/history - Get all quiz history (for a user)
router.get('/history', optionalAuth, async (req, res) => {
  try {
    let allResults = [];

    if (req.user) {
      // Authenticated user - get from database
      try {
        const dbResults = await QuizResult.findAll({
          where: { userId: req.user.id },
          include: [{ 
            model: Quiz, 
            as: 'quiz',
            required: false // Left join - don't require quiz to exist
          }],
          order: [['createdAt', 'DESC']]
        });
        allResults = dbResults || [];
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Fall back to empty array if database query fails
        allResults = [];
      }
    } else {
      // Guest user - get from in-memory storage
      allResults = Array.from(guestQuizResults.values())
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    }
    
    res.json({
      results: allResults,
      totalQuizzes: allResults.length,
      averageScore: allResults.length > 0 
        ? Math.round(allResults.reduce((sum, result) => {
            // Handle both database format (score as integer) and guest format (score.percentage)
            const scoreValue = typeof result.score === 'object' ? result.score.percentage : result.score;
            return sum + scoreValue;
          }, 0) / allResults.length)
        : 0
    });
  } catch (error) {
    console.error('Get quiz history error:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz history' });
  }
});

// GET /api/quiz/:quizId - Get a specific quiz
router.get('/:quizId', optionalAuth, async (req, res) => {
  try {
    const { quizId } = req.params;
    let quiz;

    if (req.user) {
      // Authenticated user - check database first
      quiz = await Quiz.findOne({
        where: { id: quizId, userId: req.user.id }
      });
    }

    if (!quiz) {
      // Check guest storage
      quiz = guestQuizzes.get(quizId);
    }
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz' });
  }
});

// POST /api/quiz/:quizId/submit - Submit quiz answers
router.post('/:quizId/submit', optionalAuth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpent } = req.body;
    
    let quiz;
    
    if (req.user) {
      // Authenticated user - check database first
      quiz = await Quiz.findOne({
        where: { id: quizId, userId: req.user.id }
      });
    }

    if (!quiz) {
      // Check guest storage
      quiz = guestQuizzes.get(quizId);
    }

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Calculate results
    let correctAnswers = 0;
    const results = quiz.questions.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correct;
      if (isCorrect) correctAnswers++;
      
      return {
        questionIndex: index,
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correct,
        isCorrect: isCorrect,
        explanation: question.explanation,
        userAnswerText: question.options[userAnswer] || 'No answer',
        correctAnswerText: question.options[question.correct]
      };
    });
    
    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    
    const quizResult = {
      quizId,
      answers,
      results,
      score: {
        correct: correctAnswers,
        total: quiz.questions.length,
        percentage: score
      },
      timeSpent: timeSpent || 0,
      completedAt: new Date(),
      quiz: {
        title: quiz.title,
        topic: quiz.topic,
        difficulty: quiz.difficulty
      }
    };
    
    // Store result
    const resultId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    if (req.user) {
      // Authenticated user - save to database
      try {
        await QuizResult.create({
          id: resultId,
          userId: req.user.id,
          quizId: quizId,
          answers: answers,
          score: score,
          totalQuestions: quiz.questions.length,
          timeSpent: timeSpent || 0,
          results: results
        });

        // Log activity
        await StudyActivity.create({
          userId: req.user.id,
          activityType: 'quiz_completed',
          details: {
            topic: quiz.title,
            score: score,
            correctAnswers: correctAnswers,
            totalQuestions: quiz.questions.length
          },
          points: Math.max(5, Math.round(score / 10)) // 5-10 points based on score
        });

      } catch (dbError) {
        console.error('Database error saving quiz result:', dbError);
        // Fallback to in-memory storage
        guestQuizResults.set(resultId, quizResult);
      }
    } else {
      // Guest user - use in-memory storage
      guestQuizResults.set(resultId, quizResult);
    }
    
    res.json({
      resultId,
      ...quizResult
    });
    
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// GET /api/quiz/results/:resultId - Get quiz results
router.get('/results/:resultId', optionalAuth, async (req, res) => {
  try {
    const { resultId } = req.params;
    let result;

    if (req.user) {
      // Authenticated user - check database first
      result = await QuizResult.findOne({
        where: { id: resultId, userId: req.user.id },
        include: [{ model: Quiz, as: 'quiz' }]
      });
    }

    if (!result) {
      // Check guest storage
      result = guestQuizResults.get(resultId);
    }
    
    if (!result) {
      return res.status(404).json({ error: 'Quiz result not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz results' });
  }
});

module.exports = router;
