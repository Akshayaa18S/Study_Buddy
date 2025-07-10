import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI, fileAPI, userAPI } from '../services/api';
import Dashboard from '../components/Dashboard';

const ChatPage = ({ darkMode, user }) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiPersonality, setAiPersonality] = useState('friendly');
  const [error, setError] = useState('');
  const [showConversationList, setShowConversationList] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and settings when component mounts
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load user settings
        const settings = await userAPI.getSettings();
        setAiPersonality(settings.aiPersonality || 'friendly');
        
        // Try to load conversations from new endpoint
        try {
          const response = await chatAPI.getConversations();
          setConversations(response.conversations || []);
          
          // If user has conversations, load the most recent one
          if (response.conversations && response.conversations.length > 0) {
            const mostRecent = response.conversations[0];
            await loadConversation(mostRecent.id);
          } else {
            // No conversations, start a new one
            startNewConversation();
          }
        } catch (conversationsError) {
          console.warn('Conversations endpoint not available, using fallback:', conversationsError.message);
          // Fallback: Start a new conversation since we can't load existing ones
          // In the future when server is restarted, this will work properly
          startNewConversation();
        }
      } catch (error) {
        console.warn('Failed to initialize chat:', error);
        // Fallback to new conversation
        startNewConversation();
      }
    };
    
    initialize();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load a specific conversation
  const loadConversation = async (conversationId) => {
    if (!conversationId) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await chatAPI.getHistory(conversationId);
      setCurrentConversationId(conversationId);
      
      // Convert backend messages to frontend format
      const formattedMessages = response.messages.map(msg => ({
        type: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        timestamp: new Date(msg.createdAt || msg.timestamp)
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setError('Failed to load conversation history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    const newConversationId = 'conv_' + Date.now();
    setCurrentConversationId(newConversationId);
    setMessages([
      {
        type: 'ai',
        content: "Hey! 👋 I'm your AI Study Buddy! Ask me anything - explain concepts, create quizzes, summarize notes, or just chat about your studies. What do you want to learn today?",
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversationId) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      // Call the real API
      const response = await chatAPI.sendMessage(
        inputMessage,
        currentConversationId,
        aiPersonality
      );

      const aiResponse = {
        type: 'ai',
        content: response.message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Try to refresh conversations list to update last message info
      try {
        const updatedConversations = await chatAPI.getConversations();
        setConversations(updatedConversations.conversations || []);
      } catch (refreshError) {
        console.warn('Could not refresh conversations list (endpoint not available):', refreshError.message);
        // This is expected if server hasn't been restarted yet
      }
      
      // Log activity
      userAPI.logActivity('chat_message', {
        messageLength: inputMessage.length,
        responseLength: response.message.length
      });
      
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      
      // Fallback to mock response if API fails
      const fallbackResponse = {
        type: 'ai',
        content: "I'm having trouble connecting to my brain right now! 🤖 This is a fallback response. Please check your internet connection or try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser! 😅');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && currentConversationId) {
      const userMessage = {
        type: 'user',
        content: `📎 Uploaded file: ${file.name}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      
      try {
        // Upload and analyze file using real API
        const response = await fileAPI.uploadFile(file, (progress) => {
          console.log('Upload progress:', progress);
        });

        const aiResponse = {
          type: 'ai',
          content: `Great! I've analyzed your file "${file.name}". Here's what I found:\n\n${response.analysis}\n\nWould you like me to create a quiz from this content or explain any specific concepts?`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Log activity
        userAPI.logActivity('file_upload', {
          fileName: file.name,
          fileSize: file.size,
          analysisId: response.analysisId
        });
        
      } catch (error) {
        console.error('File upload error:', error);
        setError(error.message);
        
        const aiResponse = {
          type: 'ai',
          content: `I received your file "${file.name}" but I'm having trouble analyzing it right now. Please try again later or contact support if the issue persists.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const quickActions = [
    { text: "Explain Newton's Laws", icon: "🍎" },
    { text: "Create a quiz on photosynthesis", icon: "🌱" },
    { text: "Summarize the French Revolution", icon: "🇫🇷" },
    { text: "Help me with calculus", icon: "📊" }
  ];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Dashboard Toggle */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-3"
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={startNewConversation}
                    className="rounded-pill"
                  >
                    ➕ New Chat
                  </Button>
                  <Button
                    variant={showConversationList ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={() => setShowConversationList(!showConversationList)}
                    className="rounded-pill"
                  >
                    💬 Conversations ({conversations.length})
                  </Button>
                </div>
                <Button
                  variant={showDashboard ? "primary" : "outline-primary"}
                  size="sm"
                  onClick={() => setShowDashboard(!showDashboard)}
                  className="rounded-pill"
                >
                  📊 {showDashboard ? 'Hide' : 'Show'} Dashboard
                </Button>
              </div>
            </motion.div>
          )}

          {/* Dashboard Section */}
          <AnimatePresence>
            {showDashboard && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <Dashboard user={user} darkMode={darkMode} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conversations List */}
          <AnimatePresence>
            {showConversationList && user && conversations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-4"
              >
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">💬 Your Conversations</h6>
                  </Card.Header>
                  <Card.Body className="p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {conversations.map((conv, index) => (
                      <div
                        key={conv.id}
                        className={`p-3 border-bottom conversation-item ${conv.id === currentConversationId ? 'bg-primary bg-opacity-10' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => loadConversation(conv.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="fw-bold text-truncate" style={{ maxWidth: '300px' }}>
                              {conv.title}
                            </div>
                            <small className="text-muted d-block text-truncate" style={{ maxWidth: '400px' }}>
                              {conv.lastMessage}
                            </small>
                            <small className="text-muted">
                              {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </small>
                          </div>
                          <Badge bg={conv.id === currentConversationId ? "primary" : "secondary"}>
                            {conv.personality}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="mb-3" style={{ 
              background: user 
                ? 'linear-gradient(135deg, #28a745, #20c997)' 
                : 'linear-gradient(135deg, #6c757d, #495057)',
              color: 'white',
              border: 'none'
            }}>
              <Card.Body className="py-2 px-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    {user ? (
                      <>
                        <strong>✅ Logged in as {user.username}</strong>
                        <small className="d-block opacity-75">
                          💾 Your conversations are saved • 🏆 Earning study points
                          {currentConversationId && ` • Current: ${currentConversationId.substring(0, 20)}...`}
                        </small>
                      </>
                    ) : (
                      <>
                        <strong>👤 Guest Mode</strong>
                        <small className="d-block opacity-75">
                          ⚠️ Limited features • No save history • Login for full experience
                        </small>
                      </>
                    )}
                  </div>
                  {!user && (
                    <small className="text-white-50">
                      💡 Tip: Login to save your chats!
                    </small>
                  )}
                </div>
              </Card.Body>
            </Card>
          </motion.div>

          <Row>
            <Col lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="chat-container">
                  <Card.Body className="p-0">
                    {error && (
                      <div className="p-3">
                        <Alert variant="warning" className="mb-3">
                          <strong>⚠️ Connection Issue:</strong> {error}
                        </Alert>
                      </div>
                    )}
                    
                    {isLoadingHistory && (
                      <div className="p-3 text-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading conversation history...
                      </div>
                    )}
                    
                    <div className="chat-messages p-3" style={{ height: '70vh', overflowY: 'auto' }}>
                      <AnimatePresence>
                        {messages.map((message, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`chat-message ${message.type}-message`}
                          >
                            <div className={`message-bubble ${message.type}-bubble`}>
                              <div className="message-content">
                                {message.content}
                              </div>
                              <div className="message-time text-muted mt-1">
                                <small>
                                  {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </small>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="ai-message"
                        >
                          <div className="ai-bubble">
                            <Spinner animation="grow" size="sm" className="me-2" />
                            <Spinner animation="grow" size="sm" className="me-2" />
                            <Spinner animation="grow" size="sm" />
                            <span className="ms-2">AI is thinking...</span>
                          </div>
                        </motion.div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </Card.Body>
                </Card>

                {/* Quick Action Buttons */}
                <Row className="mt-3">
                  {quickActions.map((action, index) => (
                    <Col key={index} sm={6} md={3} className="mb-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="w-100"
                          onClick={() => setInputMessage(action.text)}
                        >
                          {action.icon} {action.text}
                        </Button>
                      </motion.div>
                    </Col>
                  ))}
                </Row>

                {/* Input Section */}
                <Card className="mt-3">
                  <Card.Body>
                    <InputGroup>
                      <Button
                        variant="outline-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload file"
                        disabled={!currentConversationId}
                      >
                        📎
                      </Button>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder={currentConversationId ? "Ask me anything about your studies... (Press Enter to send)" : "Start a new conversation first..."}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        style={{ resize: 'none' }}
                        disabled={!currentConversationId}
                      />
                      <Button
                        className="btn-voice"
                        onClick={handleVoiceInput}
                        disabled={isListening || !currentConversationId}
                        title="Voice input"
                      >
                        {isListening ? '🎤' : '🎙️'}
                      </Button>
                      <Button
                        className="btn-ai"
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading || !currentConversationId}
                      >
                        Send 🚀
                      </Button>
                    </InputGroup>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept=".pdf,.txt,.docx,.jpg,.png"
                      onChange={handleFileUpload}
                    />
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatPage;
