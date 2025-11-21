import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';
import Question from '../models/Question.js';
import QuestionPaper from '../models/QuestionPaper.js';
import { logActivity } from '../utils/logger.js';
import { encryptQuestions } from '../utils/encryption.js';

const router = express.Router();

// Check session status (for real-time termination detection)
router.get('/sessions/:sessionId/status', authenticateToken, async (req, res) => {
  try {
    console.log('Checking session status for:', req.params.sessionId);
    const session = await ExamSession.findById(req.params.sessionId).select('status');
    if (!session) {
      console.log('Session not found:', req.params.sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    console.log('Session status:', session.status);
    res.json({ status: session.status });
  } catch (error) {
    console.error('Error checking session status:', error);
    res.status(500).json({ error: 'Failed to check session status' });
  }
});

// Get all active exams for students
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    console.log('Fetching exams for student:', userId);
    console.log('UserObjectId:', userObjectId);
    
    // Get exams assigned to this student or all active exams if no specific assignment
    const exams = await Exam.find({
      isActive: true,
      $or: [
        { assignedStudents: userObjectId },
        { assignedStudents: { $size: 0 } } // Exams with no specific assignments are available to all
      ]
    })
      .select('title description duration passingScore category assignedStudents')
      .lean();
    
    console.log('Found exams:', exams.length);
    exams.forEach(exam => {
      console.log(`Exam: ${exam.title}, assignedStudents:`, exam.assignedStudents);
    });
    
    // Add question count to each exam
    const examsWithCount = await Promise.all(
      exams.map(async (exam) => {
        const fullExam = await Exam.findById(exam._id).populate('questions');
        return {
          ...exam,
          totalQuestions: fullExam.questions.length,
        };
      })
    );
    
    res.json(examsWithCount);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get specific exam details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .lean();
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!exam.isActive) {
      return res.status(403).json({ error: 'Exam is not active' });
    }
    
    // Check if student is assigned (if exam has specific assignments)
    if (exam.assignedStudents && exam.assignedStudents.length > 0) {
      const isAssigned = exam.assignedStudents.some(
        id => id.toString() === req.user.id
      );
      if (!isAssigned) {
        return res.status(403).json({ error: 'You are not assigned to this exam' });
      }
    }
    
    // Remove correct answers from questions
    const sanitizedQuestions = exam.questions.map(q => {
      const { correctAnswer, correctAnswerIndices, correctAnswers, correctMatches, ...rest } = q;
      return rest;
    });
    
    // Debug: Log webcam/mic settings being sent
    console.log('📤 Sending exam to client:', {
      title: exam.title,
      enableWebcam: exam.enableWebcam,
      enableMicrophone: exam.enableMicrophone,
      requirePhotoCapture: exam.requirePhotoCapture
    });
    
    res.json({
      ...exam,
      questions: sanitizedQuestions,
      totalQuestions: exam.questions.length,
    });
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Start an exam session
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    console.log('Starting exam:', { examId: req.params.id, userId: req.user.id });
    
    const exam = await Exam.findById(req.params.id).populate('questions');
    
    if (!exam) {
      console.log('Exam not found');
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    console.log('Exam found:', { title: exam.title, isActive: exam.isActive, assignedCount: exam.assignedStudents?.length || 0 });
    
    if (!exam.isActive) {
      console.log('Exam is not active');
      return res.status(403).json({ error: 'Exam is not active' });
    }
    
    // Check if student is assigned
    if (exam.assignedStudents && exam.assignedStudents.length > 0) {
      console.log('Checking assignment:', {
        userId: req.user.id,
        assignedStudents: exam.assignedStudents.map(id => id.toString()),
      });
      const isAssigned = exam.assignedStudents.some(
        id => id.toString() === req.user.id.toString()
      );
      if (!isAssigned) {
        console.log('Student not assigned to exam');
        return res.status(403).json({ 
          error: 'You are not assigned to this exam',
          details: 'Please contact your administrator to get access to this exam'
        });
      }
      console.log('Student is assigned - proceeding');
    } else {
      console.log('No assignment restrictions - exam available to all');
    }
    
    // Check if exam has a schedule and if it's within the allowed time
    const Schedule = (await import('../models/Schedule.js')).default;
    const schedule = await Schedule.findOne({
      exam: req.params.id,
      status: 'scheduled'
    });
    
    if (schedule) {
      const now = new Date();
      const scheduleDate = new Date(schedule.scheduledDate);
      
      // Parse time strings (format: "HH:MM")
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      
      // Create datetime objects for start and end
      const startDateTime = new Date(scheduleDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);
      
      const endDateTime = new Date(scheduleDate);
      endDateTime.setHours(endHour, endMinute, 0, 0);
      
      console.log('Schedule check:', {
        now: now.toISOString(),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        canStart: now >= startDateTime && now <= endDateTime
      });
      
      // Check if current time is within the scheduled window
      if (now < startDateTime) {
        const timeUntilStart = Math.ceil((startDateTime - now) / (1000 * 60)); // minutes
        return res.status(403).json({
          error: 'Exam not yet available',
          message: `This exam is scheduled to start at ${schedule.startTime} on ${scheduleDate.toLocaleDateString()}`,
          details: {
            scheduledDate: scheduleDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            minutesUntilStart: timeUntilStart,
            canStart: false
          }
        });
      }
      
      if (now > endDateTime) {
        return res.status(403).json({
          error: 'Exam time has passed',
          message: `This exam was scheduled from ${schedule.startTime} to ${schedule.endTime} on ${scheduleDate.toLocaleDateString()}`,
          details: {
            scheduledDate: scheduleDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            canStart: false
          }
        });
      }
      
      console.log('Schedule check passed - within allowed time window');
    } else {
      console.log('No schedule found - exam can be started anytime');
    }
    
    // Check previous attempts
    const previousAttempts = await ExamSession.countDocuments({
      exam: req.params.id,
      student: req.user.id,
      status: 'submitted',
    });
    
    console.log('Attempt check:', { previousAttempts, allowedAttempts: exam.allowedAttempts });
    
    if (previousAttempts >= exam.allowedAttempts) {
      console.log('Max attempts reached');
      return res.status(403).json({ 
        error: 'Maximum attempts reached',
        message: `You have used all ${exam.allowedAttempts} attempt(s) for this exam`,
        details: {
          examTitle: exam.title,
          attemptsUsed: previousAttempts,
          attemptsAllowed: exam.allowedAttempts,
          canRetake: false
        }
      });
    }
    
    console.log('Attempt check passed');
    
    // Check if there's an active session
    const activeSession = await ExamSession.findOne({
      exam: req.params.id,
      student: req.user.id,
      status: 'in-progress',
    });
    
    if (activeSession) {
      return res.json({ 
        sessionId: activeSession._id.toString(), 
        startTime: activeSession.startTime,
        exam 
      });
    }
    
    // Determine which questions to use
    let questionsToUse = exam.questions;
    let selectedQP = null;
    let duration = exam.duration;
    
    // If exam uses question papers, randomly select from admin-selected QPs
    if (exam.useQuestionPapers && exam.selectedQuestionPapers && exam.selectedQuestionPapers.length > 0) {
      // Check if minimum QPs are selected
      if (exam.selectedQuestionPapers.length < (exam.minimumQPRequired || 2)) {
        return res.status(400).json({ 
          error: `Exam requires at least ${exam.minimumQPRequired || 2} question papers to be selected. Currently ${exam.selectedQuestionPapers.length} selected.`,
          requiresQPSelection: true
        });
      }
      
      // Get all selected active QPs
      const activeQPs = await QuestionPaper.find({
        _id: { $in: exam.selectedQuestionPapers },
        isActive: true
      }).populate('questions');
      
      if (activeQPs.length === 0) {
        return res.status(400).json({ 
          error: 'No active question papers available. Please contact administrator.',
          requiresQPSelection: true
        });
      }
      
      // Randomly select one from the selected QPs
      const randomIndex = Math.floor(Math.random() * activeQPs.length);
      selectedQP = activeQPs[randomIndex];
      questionsToUse = selectedQP.questions;
      duration = selectedQP.duration;
      console.log(`Randomly Selected Question Paper: ${selectedQP.code} - ${selectedQP.name} (from ${activeQPs.length} selected QPs)`);
    }
    
    // Create new session
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const session = new ExamSession({
      exam: req.params.id,
      questionPaper: selectedQP?._id,
      student: req.user.id,
      startTime,
      endTime,
      answers: new Map(),
      flaggedQuestions: [],
      totalQuestions: questionsToUse.length,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    await session.save();
    await logActivity(req.user.id, 'exam_start', 'exam', exam._id, { 
      title: exam.title,
      questionPaper: selectedQP ? selectedQP.code : 'default'
    }, req);
    
    // Shuffle function using Fisher-Yates algorithm
    const shuffleArray = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    // Randomize questions order
    const randomizedQuestions = shuffleArray(questionsToUse);
    
    // Store the question order in the session
    session.questionOrder = randomizedQuestions.map(q => q._id);
    await session.save();
    
    // Remove correct answers from questions and shuffle options for MCQ
    const sanitizedQuestions = randomizedQuestions.map(q => {
      const questionObj = q.toObject();
      
      // Shuffle options for multiple-choice questions
      if (questionObj.type === 'multiple-choice' && questionObj.options) {
        // Store original indices to map back correct answer
        const optionsWithIndices = questionObj.options.map((opt, idx) => ({ opt, originalIdx: idx }));
        const shuffledOptions = shuffleArray(optionsWithIndices);
        
        // Update options and correct answer index
        questionObj.options = shuffledOptions.map(item => item.opt);
        
        // Update correctAnswer index if it exists
        if (questionObj.correctAnswer !== undefined) {
          const newIndex = shuffledOptions.findIndex(item => item.originalIdx === questionObj.correctAnswer);
          questionObj.correctAnswer = newIndex;
        }
      }
      
      // Remove correct answers
      delete questionObj.correctAnswer;
      delete questionObj.correctAnswerIndices;
      delete questionObj.correctAnswers;
      delete questionObj.correctMatches;
      
      return questionObj;
    });
    
    // Encrypt questions for security
    const encryptedQuestions = encryptQuestions(sanitizedQuestions);
    
    res.json({
      sessionId: session._id.toString(),
      startTime: session.startTime,
      exam: {
        ...exam.toObject(),
        questions: encryptedQuestions,
      },
    });
  } catch (error) {
    console.error('Error starting exam:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Get exam session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.sessionId)
      .populate({
        path: 'exam',
        populate: { path: 'questions' }
      });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Handle both populated and non-populated student field
    const studentId = session.student._id ? session.student._id.toString() : session.student.toString();
    if (studentId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to session' });
    }
    
    // Convert answers Map to object
    const answersObj = {};
    session.answers.forEach((value, key) => {
      answersObj[key] = value;
    });
    
    res.json({
      ...session.toObject(),
      answers: answersObj,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Save answer
router.post('/session/:sessionId/answer', authenticateToken, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    // Validate input
    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }
    
    if (answer === undefined || answer === null) {
      return res.status(400).json({ error: 'Answer is required' });
    }
    
    const session = await ExamSession.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Handle both populated and non-populated student field
    const studentId = session.student._id ? session.student._id.toString() : session.student.toString();
    if (studentId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Session is not active' });
    }
    
    // Check if session has expired
    if (new Date() > session.endTime) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ error: 'Session has expired' });
    }
    
    session.answers.set(questionId, answer);
    await session.save();
    
    await logActivity(req.user.id, 'answer_save', 'exam', session.exam, { questionId }, req);
    
    res.json({ message: 'Answer saved' });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// Toggle flag on question
router.post('/session/:sessionId/flag', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.body;
    
    // Validate input
    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }
    
    const session = await ExamSession.findById(req.params.sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Handle both populated and non-populated student field
    const studentId = session.student._id ? session.student._id.toString() : session.student.toString();
    if (studentId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Session is not active' });
    }
    
    const index = session.flaggedQuestions.indexOf(questionId);
    if (index > -1) {
      session.flaggedQuestions.splice(index, 1);
    } else {
      session.flaggedQuestions.push(questionId);
    }
    
    await session.save();
    await logActivity(req.user.id, 'question_flag', 'exam', session.exam, { questionId }, req);
    
    res.json({ flagged: index === -1 });
  } catch (error) {
    console.error('Error toggling flag:', error);
    res.status(500).json({ error: 'Failed to toggle flag' });
  }
});

// Submit exam
router.post('/session/:sessionId/submit', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Exam submission started:', {
      sessionId: req.params.sessionId,
      userId: req.user.id
    });

    const session = await ExamSession.findById(req.params.sessionId)
      .populate({
        path: 'exam',
        populate: { path: 'questions' }
      })
      .populate('student', 'name email');
    
    if (!session) {
      console.log('❌ Session not found:', req.params.sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log('✅ Session found:', {
      sessionId: session._id,
      status: session.status,
      student: session.student,
      studentName: session.student?.name,
      studentEmail: session.student?.email,
      examId: session.exam?._id
    });
    
    // Handle both populated and non-populated student field
    const studentId = session.student._id ? session.student._id.toString() : session.student.toString();
    if (studentId !== req.user.id) {
      console.log('❌ Unauthorized access:', {
        sessionStudent: studentId,
        requestUser: req.user.id
      });
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (session.status === 'submitted') {
      console.log('⚠️ Exam already submitted:', {
        sessionId: session._id,
        status: session.status
      });
      return res.status(400).json({ error: 'Exam already submitted' });
    }

    // Validate session data
    if (!session.exam || !session.exam.questions) {
      console.log('❌ Invalid session data:', {
        hasExam: !!session.exam,
        hasQuestions: !!session.exam?.questions
      });
      return res.status(400).json({ error: 'Invalid session data - exam or questions missing' });
    }

    // Initialize answers if not present
    if (!session.answers) {
      console.log('⚠️ No answers found, initializing empty answers');
      session.answers = new Map();
    }

    console.log('📊 Session data:', {
      totalQuestions: session.exam.questions.length,
      answersType: typeof session.answers,
      answersIsMap: session.answers instanceof Map,
      answersKeys: session.answers ? (session.answers instanceof Map ? Array.from(session.answers.keys()) : Object.keys(session.answers)) : [],
      answersSize: session.answers instanceof Map ? session.answers.size : Object.keys(session.answers || {}).length
    });
    
    // Calculate score
    let correctAnswers = 0;
    let earnedPoints = 0;
    const totalPoints = session.exam.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    
    // Array to store detailed question information
    const questionDetails = [];
    
    // Check each answer
    session.exam.questions.forEach((question, index) => {
      // Handle both Map and Object answers
      const studentAnswer = session.answers instanceof Map 
        ? session.answers.get(question._id.toString())
        : session.answers?.[question._id.toString()];
      let isCorrect = false;
      
      if (studentAnswer !== undefined && studentAnswer !== null) {
        switch (question.type) {
          case 'multiple-choice':
          case 'single-choice':
            isCorrect = studentAnswer === question.correctAnswer;
            break;
            
          case 'multiple-answer':
            // Check if student selected all correct answers and no incorrect ones
            if (Array.isArray(studentAnswer) && Array.isArray(question.correctAnswerIndices)) {
              const studentSet = new Set(studentAnswer.map(Number));
              const correctSet = new Set(question.correctAnswerIndices.map(Number));
              
              // Must have same length and contain exactly the same elements
              isCorrect = studentSet.size === correctSet.size &&
                         [...studentSet].every(ans => correctSet.has(ans));
            } else {
              isCorrect = false;
            }
            break;
            
          case 'short-answer':
            const normalizedAnswer = question.caseSensitive 
              ? studentAnswer.trim()
              : studentAnswer.trim().toLowerCase();
            isCorrect = question.correctAnswers.some(ans => {
              const normalizedCorrect = question.caseSensitive 
                ? ans.trim()
                : ans.trim().toLowerCase();
              return normalizedAnswer === normalizedCorrect;
            });
            break;
            
          case 'match-following':
            // Check if all matches are correct
            isCorrect = true;
            if (typeof studentAnswer === 'object' && studentAnswer !== null) {
              // Get correct answer - could be correctMatches (Map), correctAnswer (Object), or correctAnswers
              const correctAnswerData = question.correctMatches || question.correctAnswer || question.correctAnswers || {};
              
              // Convert to object if it's a Map
              const correctAnswerObj = correctAnswerData instanceof Map 
                ? Object.fromEntries(correctAnswerData) 
                : correctAnswerData;
              
              // Ensure we have the correct number of matches
              const studentMatches = Object.keys(studentAnswer).length;
              const expectedMatches = Object.keys(correctAnswerObj).length;
              
              if (studentMatches !== expectedMatches) {
                isCorrect = false;
              } else {
                for (const [key, value] of Object.entries(studentAnswer)) {
                  const correctMatch = correctAnswerObj[key];
                  // Convert both to numbers for comparison to avoid type mismatch
                  if (correctMatch !== Number(value)) {
                    isCorrect = false;
                    break;
                  }
                }
              }
            } else {
              isCorrect = false;
            }
            break;
            
          case 'code-test':
            // For code tests, we'll award points based on test cases passed
            // This is a simplified version - real implementation would run the code
            isCorrect = false; // Default to false for now
            break;
        }
        
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
      
      // Store detailed question information for ALL questions (answered or not)
      questionDetails.push({
        questionId: question._id,
        questionText: question.text,
        questionType: question.type,
        options: question.options || [],
        correctAnswer: question.correctAnswer || question.correctAnswers || question.correctAnswerIndices || question.correctMatches,
        studentAnswer: studentAnswer !== undefined && studentAnswer !== null ? studentAnswer : null,
        isCorrect: isCorrect,
        timeSpent: 0, // Can be tracked if needed
        attemptedAt: studentAnswer !== undefined && studentAnswer !== null ? new Date() : null,
        questionOrder: index + 1
      });
    });
    
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= session.exam.passingScore;
    
    // Calculate grade and category
    let grade, category;
    if (percentage >= 90) {
      grade = 'A+';
      category = 'Outstanding';
    } else if (percentage >= 80) {
      grade = 'A';
      category = 'Excellent';
    } else if (percentage >= 70) {
      grade = 'B+';
      category = 'Very Good';
    } else if (percentage >= 60) {
      grade = 'B';
      category = 'Good';
    } else if (percentage >= 50) {
      grade = 'C';
      category = 'Average';
    } else if (percentage >= 40) {
      grade = 'D';
      category = 'Below Average';
    } else {
      grade = 'F';
      category = 'Fail';
    }
    
    // Calculate additional statistics
    const answeredQuestions = questionDetails.filter(q => 
      q.studentAnswer !== null && q.studentAnswer !== undefined
    ).length;
    const incorrectAnswers = questionDetails.filter(q => 
      q.studentAnswer !== null && q.studentAnswer !== undefined && !q.isCorrect
    ).length;
    const unansweredQuestions = session.exam.questions.length - answeredQuestions;
    
    session.status = 'submitted';
    session.submittedAt = new Date();
    session.score = earnedPoints;
    session.percentage = percentage;
    session.passed = passed;
    session.correctAnswers = correctAnswers;
    session.answeredQuestions = answeredQuestions;
    session.incorrectAnswers = incorrectAnswers;
    session.unansweredQuestions = unansweredQuestions;
    session.grade = grade;
    session.category = category;
    session.questionDetails = questionDetails; // Save detailed question information
    
    await session.save();
    await logActivity(req.user.id, 'exam_submit', 'exam', session.exam._id, { 
      score: earnedPoints,
      percentage,
      passed,
      grade,
      category
    }, req);
    
    // Calculate exam duration
    const examStartTime = session.startTime || session.createdAt;
    const examEndTime = new Date();
    const durationMs = examEndTime - examStartTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const durationFormatted = `${durationMinutes} minutes`;
    
    console.log('⏱️ Duration calculation:', {
      sessionStartTime: session.startTime,
      createdAt: session.createdAt,
      examStartTime: examStartTime,
      examEndTime: examEndTime,
      durationMs: durationMs,
      durationMinutes: durationMinutes,
      durationFormatted: durationFormatted
    });

    const responseData = {
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      correctAnswers,
      totalQuestions: session.totalQuestions,
      grade,
      category,
      // Add user and duration information
      studentName: session.student?.name || 'N/A',
      studentEmail: session.student?.email || 'N/A',
      duration: durationFormatted,
      durationMinutes: durationMinutes
    };
    
    console.log('📊 Response data being sent:', responseData);
    
    console.log('Exam submission successful:', {
      sessionId: session._id,
      studentId: session.student,
      score: earnedPoints,
      percentage,
      passed,
      grade,
      category
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error submitting exam:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sessionId: req.params.sessionId
    });
    res.status(500).json({ 
      error: 'Failed to submit exam',
      details: error.message 
    });
  }
});

export default router;
