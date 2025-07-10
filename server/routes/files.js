const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { FileAnalysis, StudyActivity } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { guestFileAnalyses } = require('../utils/fileStorage');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '../uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|gif|pdf|txt|doc|docx|md|csv|ppt|pptx/;
    const allowedMimeTypes = /image\/|application\/pdf|text\/plain|text\/markdown|text\/csv|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation/;
    
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Received: ${file.mimetype}. Only images, PDFs, text documents, presentations, and spreadsheets are allowed.`));
    }
  }
});

// Store file analysis results (fallback for non-authenticated users)
// const guestFileAnalyses = new Map(); // Moved to utils/fileStorage.js

// Fallback analysis generator when AI service is unavailable
const generateFallbackAnalysis = (fileName, textContent) => {
  const contentLength = textContent.length;
  const wordCount = textContent.split(/\s+/).length;
  const lineCount = textContent.split(/\n/).length;
  
  // Extract some basic information
  const hasFormulas = /[=+\-*/^()]/.test(textContent);
  const hasNumbers = /\d+/.test(textContent);
  const hasLists = /[-*•]\s/.test(textContent) || /\d+\.\s/.test(textContent);
  
  // Identify potential subjects based on keywords
  const subjects = [];
  const mathKeywords = ['equation', 'formula', 'calculate', 'solve', 'algebra', 'geometry', 'calculus', 'mathematics', 'math'];
  const scienceKeywords = ['experiment', 'hypothesis', 'theory', 'research', 'biology', 'chemistry', 'physics', 'science'];
  const historyKeywords = ['history', 'historical', 'century', 'ancient', 'civilization', 'war', 'revolution'];
  
  if (mathKeywords.some(keyword => textContent.toLowerCase().includes(keyword))) {
    subjects.push('Mathematics');
  }
  if (scienceKeywords.some(keyword => textContent.toLowerCase().includes(keyword))) {
    subjects.push('Science');
  }
  if (historyKeywords.some(keyword => textContent.toLowerCase().includes(keyword))) {
    subjects.push('History');
  }
  
  const subject = subjects.length > 0 ? subjects.join(', ') : 'General Studies';
  
  return `📄 File Analysis Report

📋 DOCUMENT SUMMARY:
• File: ${fileName}
• Content Length: ${contentLength} characters (${wordCount} words)
• Structure: ${lineCount} lines
• Subject Area: ${subject}

🔍 CONTENT ANALYSIS:
${hasFormulas ? '• Contains mathematical formulas or equations' : ''}
${hasNumbers ? '• Includes numerical data and calculations' : ''}
${hasLists ? '• Well-organized with lists and bullet points' : ''}

📚 STUDY RECOMMENDATIONS:
1. Review the main concepts and key terms
2. Create summary notes of important points
3. Practice any problems or exercises mentioned
${hasFormulas ? '4. Work through mathematical examples step by step' : ''}
${hasLists ? '4. Use the existing structure for organized review' : ''}

💡 SUGGESTED LEARNING ACTIVITIES:
• Create flashcards for key terms and concepts
• Summarize each major section in your own words
• Generate practice questions based on the content
• Discuss the material with study partners

⚠️ Note: This is a basic analysis. AI-powered detailed analysis is temporarily unavailable.`;
};

// Helper function to extract text from different file types
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    if (mimeType.includes('text/plain') || mimeType.includes('text/markdown') || mimeType.includes('text/csv')) {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    if (mimeType.includes('application/pdf')) {
      // PDF extraction placeholder - in production, use pdf-parse library
      return `📄 PDF Document Content

This PDF file has been uploaded successfully. 

⚠️ Advanced PDF text extraction is not fully implemented yet. For complete analysis:
1. Convert your PDF to plain text (.txt) format
2. Use online PDF-to-text converters
3. Copy and paste the text content into a .txt file and re-upload

📚 PDF Analysis Features Coming Soon:
• Automatic text extraction from PDF files
• Table and image content recognition  
• Structured document parsing
• Multi-page content analysis

This is educational placeholder content to demonstrate file processing concepts and software development limitations.`;
    }
    
    if (mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
        mimeType.includes('application/msword')) {
      // DOCX/DOC extraction placeholder - in production, use mammoth library
      return `📄 Word Document Content

This Microsoft Word document has been uploaded successfully.

⚠️ Advanced DOCX parsing is not fully implemented yet. For complete analysis:
1. Save your document as plain text (.txt) format
2. Copy the content and create a new .txt file
3. Re-upload the text version for full AI analysis

📚 Word Document Features Coming Soon:
• Automatic text extraction from .docx files
• Formatting and structure preservation
• Table and list content parsing
• Header and footer extraction

This demonstrates the iterative nature of software development where features are added over time.`;
    }
    
    if (mimeType.includes('image/')) {
      // Image OCR placeholder - in production, use OCR libraries
      return `📸 Image Content

This image file has been uploaded successfully.

⚠️ OCR (Optical Character Recognition) is not implemented yet. For text analysis:
1. Manually transcribe any text from the image
2. Create a .txt file with the transcribed content
3. Upload the text file for AI analysis

📚 Image OCR Features Coming Soon:
• Automatic text recognition from images
• Handwriting recognition capabilities
• Table and diagram text extraction
• Multi-language OCR support

This demonstrates placeholder text usage in software development.`;
    }
    
    if (mimeType.includes('application/vnd.ms-powerpoint') || 
        mimeType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
      // PowerPoint extraction placeholder
      return `📊 Presentation Content

This PowerPoint presentation has been uploaded successfully.

⚠️ PowerPoint text extraction is not implemented yet. For complete analysis:
1. Export your slides as plain text
2. Copy slide content to a .txt file
3. Upload the text version for AI analysis

📚 Presentation Features Coming Soon:
• Automatic slide text extraction
• Speaker notes inclusion
• Slide structure preservation
• Chart and diagram text recognition

This illustrates how software features are developed incrementally.`;
    }
    
    // For other file types, return a general placeholder
    return `File content extraction for ${mimeType} files is not implemented yet. This is a placeholder text for the uploaded file that demonstrates software development concepts and limitations.`;
    
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
};

// POST /api/files/upload - Upload and analyze file
router.post('/upload', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = file.path;
    
    // Extract text content
    const textContent = await extractTextFromFile(filePath, file.mimetype);
    
    // Analyze content with AI
    const analysisPrompt = `Analyze the following educational content and provide a comprehensive summary:

    Content: ${textContent.substring(0, 3000)} ${textContent.length > 3000 ? '...(truncated)' : ''}

    Please provide:
    1. A clear summary of the main concepts
    2. Key points that students should focus on
    3. Important definitions or formulas
    4. Study recommendations
    5. Suggested quiz topics

    Format your response in a structured, educational manner that helps students learn effectively.`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysis = response.text();
    
    // Store analysis result
    const analysisId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const analysisResult = {
      id: analysisId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      analysis: analysis,
      textContent: textContent.substring(0, 5000), // Store first 5000 chars
      filePath: filePath
    };
    
    if (req.user) {
      // Authenticated user - save to database
      try {
        await FileAnalysis.create({
          id: analysisId,
          userId: req.user.id,
          fileName: file.originalname,
          fileSize: file.size,
          fileType: file.mimetype,
          filePath: filePath,
          analysis: analysis,
          summary: analysis.substring(0, 500) + (analysis.length > 500 ? '...' : ''),
          extractedText: textContent.substring(0, 5000)
        });

        // Log activity
        await StudyActivity.create({
          userId: req.user.id,
          activityType: 'file_upload',
          details: {
            fileName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype
          },
          points: 15
        });

      } catch (dbError) {
        console.error('Database error saving file analysis:', dbError);
        // Fallback to in-memory storage with userId preserved
        analysisResult.userId = req.user.id;
        guestFileAnalyses.set(analysisId, analysisResult);
      }
    } else {
      // Guest user - use in-memory storage
      guestFileAnalyses.set(analysisId, analysisResult);
    }

    res.json({
      analysisId,
      fileName: file.originalname,
      fileSize: file.size,
      analysis: analysis,
      uploadedAt: new Date(),
      message: 'File uploaded and analyzed successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    if (error.message?.includes('API_KEY')) {
      return res.status(401).json({ 
        error: 'Gemini API key is invalid or missing. Please check your configuration.' 
      });
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit') || error.message?.includes('overloaded')) {
      console.log('AI API overloaded, generating fallback analysis...');
      
      try {
        // Create fallback analysis when AI service is unavailable
        const file = req.file;
        const textContent = await extractTextFromFile(file.path, file.mimetype);
        
        const fallbackAnalysis = generateFallbackAnalysis(file.originalname, textContent);
        const analysisId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        
        const analysisResult = {
          id: analysisId,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
          analysis: fallbackAnalysis,
          textContent: textContent.substring(0, 5000),
          filePath: file.path,
          isAIGenerated: false
        };

        if (req.user) {
          // Save fallback analysis for authenticated users
          try {
            await FileAnalysis.create({
              id: analysisId,
              userId: req.user.id,
              fileName: file.originalname,
              fileSize: file.size,
              fileType: file.mimetype,
              filePath: file.path,
              analysis: fallbackAnalysis,
              summary: fallbackAnalysis.substring(0, 500) + (fallbackAnalysis.length > 500 ? '...' : ''),
              extractedText: textContent.substring(0, 5000)
            });

            await StudyActivity.create({
              userId: req.user.id,
              activityType: 'file_upload',
              details: {
                fileName: file.originalname,
                fileSize: file.size,
                fileType: file.mimetype,
                isAIGenerated: false
              },
              points: 15
            });

            res.json({
              analysisId,
              fileName: file.originalname,
              fileSize: file.size,
              analysis: fallbackAnalysis,
              uploadedAt: new Date(),
              message: 'File uploaded successfully. AI analysis temporarily unavailable, basic analysis provided.',
              isAIGenerated: false
            });
            return;

          } catch (dbError) {
            console.error('Database error:', dbError);
            analysisResult.userId = req.user.id;
            guestFileAnalyses.set(analysisId, analysisResult);
          }
        } else {
          // Guest user - don't set userId
          guestFileAnalyses.set(analysisId, analysisResult);
        }

        res.json({
          analysisId,
          fileName: file.originalname,
          fileSize: file.size,
          analysis: fallbackAnalysis,
          uploadedAt: new Date(),
          message: 'File uploaded successfully. AI analysis temporarily unavailable, basic analysis provided.',
          isAIGenerated: false
        });
        return;

      } catch (fallbackError) {
        console.error('Fallback analysis failed:', fallbackError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to upload and analyze file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/analysis/:analysisId - Get file analysis
router.get('/analysis/:analysisId', optionalAuth, async (req, res) => {
  try {
    const { analysisId } = req.params;
    let analysis;

    if (req.user) {
      // Authenticated user - check database first
      analysis = await FileAnalysis.findOne({
        where: { id: analysisId, userId: req.user.id }
      });
    }

    if (!analysis) {
      // Check guest storage
      analysis = guestFileAnalyses.get(analysisId);
    }
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ error: 'Failed to retrieve analysis' });
  }
});

// POST /api/files/generate-quiz/:analysisId - Generate quiz from file
router.post('/generate-quiz/:analysisId', optionalAuth, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { difficulty = 'medium', questionCount = 5 } = req.body;
    
    let analysis;
    
    if (req.user) {
      // Authenticated user - check database first
      analysis = await FileAnalysis.findOne({
        where: { id: analysisId, userId: req.user.id }
      });
    }

    if (!analysis) {
      // Check guest storage
      analysis = guestFileAnalyses.get(analysisId);
    }

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Generate quiz based on file content
    const quizPrompt = `Create a ${difficulty} level multiple choice quiz with ${questionCount} questions based on this educational content:

    Content: ${analysis.textContent}

    Format the response as a JSON object with this structure:
    {
      "title": "Quiz about [filename]",
      "topic": "Main topic from the file",
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

    Base the questions directly on the content from the file: ${analysis.fileName}

    Respond with ONLY the JSON object, no additional text.`;

    const result = await model.generateContent(quizPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    // Parse AI response
    let quizData;
    try {
      // Clean the response to extract JSON
      const cleanResponse = aiResponse.replace(/```json|```/g, '').trim();
      quizData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI quiz response:', parseError);
      console.error('AI Response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    res.json({
      quiz: quizData,
      sourceFile: analysis.fileName,
      message: 'Quiz generated from file successfully'
    });

  } catch (error) {
    console.error('Generate quiz from file error:', error);
    
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
      error: 'Failed to generate quiz from file',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/files/history - Get file upload history
router.get('/history', optionalAuth, async (req, res) => {
  try {
    let history = [];

    if (req.user) {
      // Authenticated user - get from database first
      try {
        const dbFiles = await FileAnalysis.findAll({
          where: { userId: req.user.id },
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'fileName', 'fileSize', 'fileType', 'createdAt', 'summary']
        });
        
        history = (dbFiles || []).map(item => ({
          id: item.id,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.fileType,
          uploadedAt: item.createdAt,
          analysisPreview: item.summary || 'No preview available'
        }));
      } catch (dbError) {
        console.error('Database query error:', dbError);
        history = [];
      }
      
      // Also check in-memory storage for files that failed to save to database
      const inMemoryFiles = Array.from(guestFileAnalyses.values())
        .filter(item => item.userId === req.user.id)
        .map(item => ({
          id: item.id,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          uploadedAt: item.uploadedAt,
          analysisPreview: item.analysis?.substring(0, 200) + '...' || 'No preview available'
        }));
      
      // Combine and sort by upload date
      history = [...history, ...inMemoryFiles]
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        
    } else {
      // Guest user - get from in-memory storage only
      history = Array.from(guestFileAnalyses.values())
        .filter(item => !item.userId) // Only files without userId (guest files)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
        .map(item => ({
          id: item.id,
          fileName: item.fileName,
          fileSize: item.fileSize,
          mimeType: item.mimeType,
          uploadedAt: item.uploadedAt,
          analysisPreview: item.analysis?.substring(0, 200) + '...' || 'No preview available'
        }));
    }
    
    res.json({
      files: history,
      totalFiles: history.length
    });
  } catch (error) {
    console.error('Get file history error:', error);
    res.status(500).json({ error: 'Failed to retrieve file history' });
  }
});

// DELETE /api/files/:analysisId - Delete file and analysis
router.delete('/:analysisId', optionalAuth, async (req, res) => {
  try {
    const { analysisId } = req.params;
    let analysis;

    if (req.user) {
      // Authenticated user - check database first
      analysis = await FileAnalysis.findOne({
        where: { id: analysisId, userId: req.user.id }
      });
      
      if (analysis) {
        // Delete physical file
        if (fs.existsSync(analysis.filePath)) {
          fs.unlinkSync(analysis.filePath);
        }
        
        // Delete from database
        await analysis.destroy();
        
        res.json({ message: 'File and analysis deleted successfully' });
        return;
      }
    }

    // Check guest storage
    analysis = guestFileAnalyses.get(analysisId);
    
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    // Delete physical file
    if (fs.existsSync(analysis.filePath)) {
      fs.unlinkSync(analysis.filePath);
    }
    
    // Delete analysis record from guest storage
    guestFileAnalyses.delete(analysisId);
    
    res.json({ 
      message: 'File and analysis deleted successfully',
      analysisId 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
