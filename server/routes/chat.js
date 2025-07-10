const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Conversation, Message, User, StudyActivity } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Store conversation history (fallback for non-authenticated users)
const guestConversations = new Map();

// AI personality prompts
const personalityPrompts = {
  friendly: "You are a friendly and encouraging AI study buddy. Be warm, supportive, and use emojis appropriately. Always encourage the student and make learning fun.",
  professional: "You are a professional and formal AI tutor. Provide clear, structured explanations with proper academic language. Be thorough and precise in your responses.",
  casual: "You are a casual, Gen Z AI study buddy. Use modern slang, be relatable, and make learning feel like chatting with a friend. Keep it real and engaging!",
  motivational: "You are a motivational AI coach. Be energetic, inspiring, and push the student to excel. Use motivational language and help build confidence.",
  patient: "You are a patient and calm AI tutor. Take time to explain concepts slowly and clearly. Be understanding if the student struggles and provide gentle guidance.",
  enthusiastic: "You are an enthusiastic and energetic AI teacher. Show excitement about every topic, use exclamation points, and make everything sound amazing and interesting!"
};

// POST /api/chat/message - Send a message to AI
router.post('/message', optionalAuth, async (req, res) => {
  try {
    const { message, conversationId, personality = 'friendly', context = '' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let conversation, conversationHistory;

    if (req.user) {
      // Authenticated user - use database
      conversation = await Conversation.findOne({
        where: { id: conversationId, userId: req.user.id },
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']],
          limit: 20
        }]
      });

      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          id: conversationId,
          userId: req.user.id,
          personality,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        });
      }

      // Add user message to database
      await Message.create({
        conversationId: conversation.id,
        role: 'user',
        content: message
      });

      // Get recent messages for context
      const messages = await Message.findAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      conversationHistory = messages.reverse().map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

    } else {
      // Guest user - use in-memory storage
      let guestConv = guestConversations.get(conversationId) || [];
      
      guestConv.push({
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      conversationHistory = guestConv.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      guestConversations.set(conversationId, guestConv);
    }

    // Prepare system prompt with personality
    const systemPrompt = personalityPrompts[personality] || personalityPrompts.friendly;
    
    const fullPrompt = `${systemPrompt}\n\nAdditional context: ${context}\n\nConversation history:\n${conversationHistory}\n\nUser: ${message}\n\nAssistant:`;

    let aiResponse;
    
    try {
      // Call Gemini API with timeout
      console.log('Calling Gemini API...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API_TIMEOUT')), 10000) // 10 second timeout
      );
      
      const apiPromise = model.generateContent(fullPrompt).then(result => result.response.text());
      
      aiResponse = await Promise.race([apiPromise, timeoutPromise]);
      
      console.log('Gemini API response received');
      
    } catch (apiError) {
      console.error('Gemini API error:', apiError.message);
      
      // Fallback response based on personality
      const fallbackResponses = {
        friendly: "I'm sorry, I'm having some technical difficulties right now, but I'm here to help! 😊 Could you please try asking your question again in a moment?",
        professional: "I apologize, but I'm currently experiencing technical issues. Please try your request again shortly, and I'll be happy to assist you with your studies.",
        casual: "Oops! Something went wrong on my end 😅 Give me a sec and try again - I'll be right back to help you out!",
        motivational: "Don't worry! Even the best systems need a moment to recharge! 💪 Try again in a moment and let's crush those study goals together!",
        patient: "I understand this might be frustrating, but I'm experiencing some technical difficulties. Please be patient and try again in a moment. I'm here to help you learn.",
        enthusiastic: "Oh no! My circuits got a bit tangled! 🤖✨ But don't let that stop your learning momentum! Try again in just a moment!"
      };
      
      aiResponse = fallbackResponses[personality] || fallbackResponses.friendly;
      aiResponse += "\n\n*Note: This is a fallback response due to temporary AI service issues.*";
    }

    if (req.user) {
      // Save AI response to database
      await Message.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });

      // Update conversation stats
      await conversation.update({
        messageCount: conversation.messageCount + 2,
        lastMessageAt: new Date()
      });

      // Log activity
      await StudyActivity.create({
        userId: req.user.id,
        activityType: 'chat_message',
        details: {
          messageLength: message.length,
          responseLength: aiResponse.length,
          personality
        },
        points: 5
      });

    } else {
      // Add AI response to guest conversation
      let guestConv = guestConversations.get(conversationId);
      guestConv.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      guestConversations.set(conversationId, guestConv.slice(-50));
    }

    res.json({
      message: aiResponse,
      conversationId: conversationId,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ 
        error: 'Gemini API key is invalid or missing. Please check your configuration.' 
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({ 
        error: 'Gemini API quota exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/chat/history/:conversationId - Get conversation history
router.get('/history/:conversationId', optionalAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    let conversation = null;
    let messages = [];

    if (req.user) {
      // Authenticated user - get from database
      conversation = await Conversation.findOne({
        where: { id: conversationId, userId: req.user.id },
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']]
        }]
      });

      if (conversation) {
        messages = conversation.messages;
      }
    } else {
      // Guest user - get from in-memory storage
      const guestConv = guestConversations.get(conversationId) || [];
      messages = guestConv;
    }
    
    res.json({
      conversationId,
      messages: messages,
      messageCount: messages.length
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation history' });
  }
});

// DELETE /api/chat/history/:conversationId - Clear conversation history
router.delete('/history/:conversationId', optionalAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (req.user) {
      // Authenticated user - delete from database
      const conversation = await Conversation.findOne({
        where: { id: conversationId, userId: req.user.id }
      });

      if (conversation) {
        // Delete all messages for this conversation
        await Message.destroy({
          where: { conversationId: conversationId }
        });

        // Delete the conversation
        await conversation.destroy();
      }
    } else {
      // Guest user - delete from in-memory storage
      guestConversations.delete(conversationId);
    }
    
    res.json({ 
      message: 'Conversation history cleared',
      conversationId 
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// POST /api/chat/voice - Handle voice input (speech-to-text simulation)
router.post('/voice', optionalAuth, async (req, res) => {
  try {
    const { transcript, conversationId, personality } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    // For now, treat voice input the same as text
    // In production, you might want to use OpenAI's Whisper API for speech-to-text
    
    let conversation, conversationHistory;

    if (req.user) {
      // Authenticated user - use database
      conversation = await Conversation.findOne({
        where: { id: conversationId, userId: req.user.id },
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']],
          limit: 20
        }]
      });

      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          id: conversationId,
          userId: req.user.id,
          personality: personality || 'friendly',
          title: transcript.substring(0, 50) + (transcript.length > 50 ? '...' : '')
        });
      }

      // Add user message to database
      await Message.create({
        conversationId: conversation.id,
        role: 'user',
        content: transcript
      });

      // Get recent messages for context
      const messages = await Message.findAll({
        where: { conversationId: conversation.id },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      conversationHistory = messages.reverse().map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

    } else {
      // Guest user - use in-memory storage
      let guestConv = guestConversations.get(conversationId) || [];
      
      guestConv.push({
        role: 'user',
        content: transcript,
        timestamp: new Date()
      });

      conversationHistory = guestConv.slice(-10).map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      guestConversations.set(conversationId, guestConv);
    }

    // Prepare system prompt with personality
    const systemPrompt = personalityPrompts[personality] || personalityPrompts.friendly;
    
    const fullPrompt = `${systemPrompt}\n\nThis message was received via voice input.\n\nConversation history:\n${conversationHistory}\n\nUser: ${transcript}\n\nAssistant:`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    if (req.user) {
      // Save AI response to database
      await Message.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse
      });

      // Update conversation stats
      await conversation.update({
        messageCount: conversation.messageCount + 2,
        lastMessageAt: new Date()
      });

      // Log activity
      await StudyActivity.create({
        userId: req.user.id,
        activityType: 'voice_chat',
        details: {
          messageLength: transcript.length,
          responseLength: aiResponse.length,
          personality
        },
        points: 7 // Slightly more points for voice interaction
      });

    } else {
      // Add AI response to guest conversation
      let guestConv = guestConversations.get(conversationId);
      guestConv.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      guestConversations.set(conversationId, guestConv.slice(-50));
    }

    res.json({
      message: aiResponse,
      conversationId: conversationId,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Voice chat error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ 
        error: 'Gemini API key is invalid or missing. Please check your configuration.' 
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return res.status(429).json({ 
        error: 'Gemini API quota exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process voice input',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/chat/conversations - Get all conversations for the current user
router.get('/conversations', optionalAuth, async (req, res) => {
  try {
    let conversations = [];

    if (req.user) {
      // Authenticated user - get from database
      conversations = await Conversation.findAll({
        where: { userId: req.user.id },
        include: [{
          model: Message,
          as: 'messages',
          order: [['createdAt', 'DESC']],
          limit: 1, // Only get the last message for preview
          required: false
        }],
        order: [['lastMessageAt', 'DESC']]
      });

      // Format conversations for frontend
      conversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        personality: conv.personality,
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        lastMessage: conv.messages?.[0]?.content?.substring(0, 100) + 
                    (conv.messages?.[0]?.content?.length > 100 ? '...' : '') || 'No messages yet',
        lastMessageRole: conv.messages?.[0]?.role || null
      }));
    } else {
      // Guest user - get from in-memory storage
      const guestConvEntries = Array.from(guestConversations.entries());
      conversations = guestConvEntries.map(([convId, messages]) => {
        const lastMessage = messages[messages.length - 1];
        const userMessages = messages.filter(m => m.role === 'user');
        const firstUserMessage = userMessages[0]?.content || 'New conversation';
        
        return {
          id: convId,
          title: firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : ''),
          personality: 'friendly', // Default for guest
          messageCount: messages.length,
          lastMessageAt: lastMessage?.timestamp || new Date(),
          lastMessage: lastMessage?.content?.substring(0, 100) + 
                      (lastMessage?.content?.length > 100 ? '...' : '') || 'No messages yet',
          lastMessageRole: lastMessage?.role || null
        };
      }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    }
    
    res.json({
      conversations: conversations,
      total: conversations.length
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

module.exports = router;
