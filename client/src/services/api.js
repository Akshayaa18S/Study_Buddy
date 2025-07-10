import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token'); // Changed from 'authToken' to 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response;
  }
};

// Convenience functions for auth
export const register = authAPI.register;
export const login = authAPI.login;
export const logout = authAPI.logout;
export const getCurrentUser = authAPI.getCurrentUser;

// Chat API
export const chatAPI = {
  sendMessage: async (message, conversationId, personality = 'friendly', context = '') => {
    try {
      const response = await apiClient.post('/chat/message', {
        message,
        conversationId,
        personality,
        context
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  },

  getHistory: async (conversationId) => {
    try {
      const response = await apiClient.get(`/chat/history/${conversationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get chat history');
    }
  },

  clearHistory: async (conversationId) => {
    try {
      const response = await apiClient.delete(`/chat/history/${conversationId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to clear chat history');
    }
  },

  sendVoiceMessage: async (transcript, conversationId, personality = 'friendly') => {
    try {
      const response = await apiClient.post('/chat/voice', {
        transcript,
        conversationId,
        personality
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to process voice message');
    }
  },

  getConversations: async () => {
    try {
      const response = await apiClient.get('/chat/conversations');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get conversations');
    }
  }
};

// Quiz API
export const quizAPI = {
  generateQuiz: async (topic, difficulty = 'medium', questionCount = 5, questionType = 'multiple-choice', context = '') => {
    try {
      const response = await apiClient.post('/quiz/generate', {
        topic,
        difficulty,
        questionCount,
        questionType,
        context
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate quiz');
    }
  },

  getQuiz: async (quizId) => {
    try {
      const response = await apiClient.get(`/quiz/${quizId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get quiz');
    }
  },

  submitQuiz: async (quizId, answers, timeSpent = 0) => {
    try {
      const response = await apiClient.post(`/quiz/${quizId}/submit`, {
        answers,
        timeSpent
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to submit quiz');
    }
  },

  getResults: async (resultId) => {
    try {
      const response = await apiClient.get(`/quiz/results/${resultId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get quiz results');
    }
  },

  getHistory: async () => {
    try {
      const response = await apiClient.get('/quiz/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get quiz history');
    }
  }
};

// File API
export const fileAPI = {
  uploadFile: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to upload file');
    }
  },

  getAnalysis: async (analysisId) => {
    try {
      const response = await apiClient.get(`/files/analysis/${analysisId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get file analysis');
    }
  },

  generateQuizFromFile: async (analysisId, difficulty = 'medium', questionCount = 5) => {
    try {
      const response = await apiClient.post(`/files/generate-quiz/${analysisId}`, {
        difficulty,
        questionCount
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to generate quiz from file');
    }
  },

  getHistory: async () => {
    try {
      const response = await apiClient.get('/files/history');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get file history');
    }
  },

  deleteFile: async (analysisId) => {
    try {
      const response = await apiClient.delete(`/files/${analysisId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to delete file');
    }
  }
};

// User API
export const userAPI = {
  getSettings: async () => {
    try {
      const response = await apiClient.get('/user/settings');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get user settings');
    }
  },

  updateSettings: async (settings) => {
    try {
      const response = await apiClient.post('/user/settings', settings);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update settings');
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/user/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get user statistics');
    }
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get user profile');
    }
  },

  logActivity: async (activityType, data) => {
    try {
      const response = await apiClient.post('/user/activity', {
        activityType,
        data
      });
      return response.data;
    } catch (error) {
      // Don't throw error for activity logging to avoid disrupting user experience
      console.warn('Failed to log activity:', error.message);
      return null;
    }
  },

  submitFeedback: async (type, message, rating = null) => {
    try {
      const response = await apiClient.post('/user/feedback', {
        type,
        message,
        rating
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to submit feedback');
    }
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not responding');
  }
};

export default apiClient;
