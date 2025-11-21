import express from 'express';
import { requireAdmin } from '../middleware/adminAuth.js';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';
import ActivityLog from '../models/ActivityLog.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Flag student session for review
router.post('/sessions/:id/flag', requireAdmin, async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.flagged = true;
    session.flaggedBy = req.user.id;
    session.flaggedAt = new Date();
    await session.save();

    await logActivity(req.user.id, 'session_flagged', 'session', session._id, { 
      student: session.student,
      exam: session.exam 
    }, req);

    res.json({ message: 'Session flagged successfully', session });
  } catch (error) {
    console.error('Error flagging session:', error);
    res.status(500).json({ error: 'Failed to flag session' });
  }
});

// Terminate exam session
router.post('/sessions/:id/terminate', requireAdmin, async (req, res) => {
  try {
    console.log('Terminating session:', req.params.id);
    const session = await ExamSession.findById(req.params.id);
    if (!session) {
      console.log('Session not found:', req.params.id);
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('Current session status:', session.status);
    if (session.status === 'submitted') {
      return res.status(400).json({ error: 'Session already completed' });
    }

    session.status = 'terminated';
    session.terminatedBy = req.user.id;
    session.terminatedAt = new Date();
    session.endTime = new Date();
    await session.save();
    console.log('Session terminated successfully. New status:', session.status);

    await logActivity(req.user.id, 'session_terminated', 'session', session._id, { 
      student: session.student,
      exam: session.exam,
      reason: 'Admin terminated'
    }, req);

    res.json({ message: 'Session terminated successfully', session });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Get all exams (admin view with full details)
router.get('/exams', requireAdmin, async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('questions')
      .populate('assignedStudents', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get single exam by ID
router.get('/exams/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('questions')
      .populate('questionPapers')
      .populate('selectedQuestionPapers')
      .populate('assignedStudents', 'name email')
      .populate('createdBy', 'name email');
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// Toggle question paper selection for exam
router.put('/exams/:id/toggle-qp', requireAdmin, async (req, res) => {
  try {
    const { questionPaperId } = req.body;
    
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Check if QP is already selected
    const qpIndex = exam.selectedQuestionPapers.findIndex(
      qp => qp.toString() === questionPaperId
    );
    
    if (qpIndex > -1) {
      // Remove from selection
      exam.selectedQuestionPapers.splice(qpIndex, 1);
    } else {
      // Add to selection
      exam.selectedQuestionPapers.push(questionPaperId);
    }
    
    exam.useQuestionPapers = exam.selectedQuestionPapers.length > 0;
    await exam.save();
    
    await exam.populate('selectedQuestionPapers');
    
    res.json({ 
      message: qpIndex > -1 ? 'Question paper deselected' : 'Question paper selected',
      selectedCount: exam.selectedQuestionPapers.length,
      minimumRequired: exam.minimumQPRequired || 2,
      exam 
    });
  } catch (error) {
    console.error('Error toggling question paper:', error);
    res.status(500).json({ error: 'Failed to toggle question paper' });
  }
});

// Create new exam
router.post('/exams', requireAdmin, async (req, res) => {
  try {
    const { 
      title, description, duration, passingScore, category, startDate, endDate, allowedAttempts,
      // Advanced exam features
      showCalculator, showReviewScreen, showQuestionAnalysis, showResultsToStudents, requirePhotoCapture, photoCaptureInterval,
      enableWebcam, enableMicrophone, instructions, rules,
      // Pre-exam settings
      requireWebcam, requireMicrophone, requireIdentityVerification, allowMobileDevices
    } = req.body;
    
    const exam = new Exam({
      title,
      description,
      duration,
      passingScore,
      category: category || 'General',
      startDate,
      endDate,
      allowedAttempts: allowedAttempts || 1,
      // Advanced features
      showCalculator: showCalculator || false,
      showReviewScreen: showReviewScreen || false,
      showQuestionAnalysis: showQuestionAnalysis || false,
      showResultsToStudents: showResultsToStudents !== undefined ? showResultsToStudents : true,
      requirePhotoCapture: requirePhotoCapture || false,
      photoCaptureInterval: photoCaptureInterval || 300000,
      enableWebcam: enableWebcam || false,
      enableMicrophone: enableMicrophone || false,
      instructions: instructions || '',
      rules: rules || [],
      // Pre-exam settings (with defaults from model)
      requireWebcam: requireWebcam !== undefined ? requireWebcam : true,
      requireMicrophone: requireMicrophone !== undefined ? requireMicrophone : true,
      requireIdentityVerification: requireIdentityVerification !== undefined ? requireIdentityVerification : true,
      allowMobileDevices: allowMobileDevices || false,
      createdBy: req.user.id,
      isActive: true,
    });
    
    await exam.save();
    await logActivity(req.user.id, 'exam_create', 'exam', exam._id, { title }, req);
    
    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// Update exam
router.put('/exams/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    const { 
      title, description, duration, passingScore, category, isActive, startDate, endDate, allowedAttempts,
      // Advanced exam features
      showCalculator, showReviewScreen, showQuestionAnalysis, showResultsToStudents, requirePhotoCapture, photoCaptureInterval,
      enableWebcam, enableMicrophone, instructions, rules,
      // Pre-exam settings
      requireWebcam, requireMicrophone, requireIdentityVerification, allowMobileDevices
    } = req.body;
    
    if (title) exam.title = title;
    if (description) exam.description = description;
    if (duration) exam.duration = duration;
    if (passingScore) exam.passingScore = passingScore;
    if (category) exam.category = category;
    if (isActive !== undefined) exam.isActive = isActive;
    if (startDate) exam.startDate = startDate;
    if (endDate) exam.endDate = endDate;
    if (allowedAttempts) exam.allowedAttempts = allowedAttempts;
    
    // Advanced features
    if (showCalculator !== undefined) exam.showCalculator = showCalculator;
    if (showReviewScreen !== undefined) exam.showReviewScreen = showReviewScreen;
    if (showQuestionAnalysis !== undefined) exam.showQuestionAnalysis = showQuestionAnalysis;
    if (showResultsToStudents !== undefined) exam.showResultsToStudents = showResultsToStudents;
    if (requirePhotoCapture !== undefined) exam.requirePhotoCapture = requirePhotoCapture;
    if (photoCaptureInterval !== undefined) exam.photoCaptureInterval = photoCaptureInterval;
    if (enableWebcam !== undefined) exam.enableWebcam = enableWebcam;
    if (enableMicrophone !== undefined) exam.enableMicrophone = enableMicrophone;
    if (instructions !== undefined) exam.instructions = instructions;
    if (rules !== undefined) exam.rules = rules;
    
    // Pre-exam settings
    if (requireWebcam !== undefined) exam.requireWebcam = requireWebcam;
    if (requireMicrophone !== undefined) exam.requireMicrophone = requireMicrophone;
    if (requireIdentityVerification !== undefined) exam.requireIdentityVerification = requireIdentityVerification;
    if (allowMobileDevices !== undefined) exam.allowMobileDevices = allowMobileDevices;
    
    console.log('💾 Saving exam with updated settings:', {
      showResultsToStudents: exam.showResultsToStudents,
      requireWebcam: exam.requireWebcam,
      requireMicrophone: exam.requireMicrophone,
      requireIdentityVerification: exam.requireIdentityVerification,
      allowMobileDevices: exam.allowMobileDevices
    });
    
    await exam.save();
    await logActivity(req.user.id, 'exam_update', 'exam', exam._id, { title: exam.title }, req);
    
    res.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// Delete exam
router.delete('/exams/:id', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    await logActivity(req.user.id, 'exam_delete', 'exam', exam._id, { title: exam.title }, req);
    await Exam.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Get all questions in question bank
router.get('/questions', requireAdmin, async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get single question by ID
router.get('/questions/:id', requireAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// Create new question
router.post('/questions', requireAdmin, async (req, res) => {
  try {
    const question = new Question({
      ...req.body,
      createdBy: req.user.id,
    });
    
    await question.save();
    await logActivity(req.user.id, 'question_create', 'question', question._id, { type: question.type }, req);
    
    res.status(201).json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update question
router.put('/questions/:id', requireAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    Object.assign(question, req.body);
    await question.save();
    await logActivity(req.user.id, 'question_update', 'question', question._id, { type: question.type }, req);
    
    res.json(question);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete question
router.delete('/questions/:id', requireAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    await logActivity(req.user.id, 'question_delete', 'question', question._id, { type: question.type }, req);
    await Question.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Bulk add questions to exam (MUST be before single question route)
router.post('/exams/:examId/questions/bulk', requireAdmin, async (req, res) => {
  try {
    const { questionIds } = req.body;
    
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs array is required' });
    }
    
    const exam = await Exam.findById(req.params.examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    // Verify all questions exist
    const questions = await Question.find({ _id: { $in: questionIds } });
    if (questions.length !== questionIds.length) {
      return res.status(404).json({ error: 'Some questions not found' });
    }
    
    // Add only questions that aren't already in the exam
    let addedCount = 0;
    for (const questionId of questionIds) {
      if (!exam.questions.includes(questionId)) {
        exam.questions.push(questionId);
        addedCount++;
      }
    }
    
    await exam.save();
    await logActivity(req.user.id, 'bulk_add_questions', 'exam', exam._id, { 
      count: addedCount,
      total: questionIds.length 
    }, req);
    
    const populatedExam = await Exam.findById(exam._id).populate('questions');
    res.json({ 
      exam: populatedExam,
      addedCount,
      skippedCount: questionIds.length - addedCount,
      message: `${addedCount} questions added successfully${questionIds.length - addedCount > 0 ? ` (${questionIds.length - addedCount} already existed)` : ''}`
    });
  } catch (error) {
    console.error('Error bulk adding questions to exam:', error);
    res.status(500).json({ error: 'Failed to bulk add questions to exam' });
  }
});

// Add question to exam
router.post('/exams/:examId/questions/:questionId', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    const question = await Question.findById(req.params.questionId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if question already added
    if (exam.questions.includes(req.params.questionId)) {
      return res.status(400).json({ error: 'Question already added to exam' });
    }
    
    exam.questions.push(req.params.questionId);
    await exam.save();
    
    const populatedExam = await Exam.findById(exam._id).populate('questions');
    res.json(populatedExam);
  } catch (error) {
    console.error('Error adding question to exam:', error);
    res.status(500).json({ error: 'Failed to add question to exam' });
  }
});

// Remove question from exam
router.delete('/exams/:examId/questions/:questionId', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    exam.questions = exam.questions.filter(q => q.toString() !== req.params.questionId);
    await exam.save();
    
    const populatedExam = await Exam.findById(exam._id).populate('questions');
    res.json(populatedExam);
  } catch (error) {
    console.error('Error removing question from exam:', error);
    res.status(500).json({ error: 'Failed to remove question from exam' });
  }
});

// Get exam statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ isActive: true });
    const totalQuestions = await Question.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalSessions = await ExamSession.countDocuments();
    const completedSessions = await ExamSession.countDocuments({ status: 'submitted' });
    const ongoingExams = await ExamSession.countDocuments({ status: 'in-progress' });
    
    // Calculate average score and pass rate from submitted sessions
    const completedSessionsData = await ExamSession.find({ status: 'submitted' })
      .populate('exam', 'passingScore');
    
    let totalScore = 0;
    let passedCount = 0;
    
    completedSessionsData.forEach(session => {
      if (session.percentage !== undefined) {
        totalScore += session.percentage;
        if (session.percentage >= (session.exam?.passingScore || 60)) {
          passedCount++;
        }
      }
    });
    
    const averageScore = completedSessionsData.length > 0 
      ? totalScore / completedSessionsData.length 
      : 0;
    
    const passRate = completedSessionsData.length > 0 
      ? (passedCount / completedSessionsData.length) * 100 
      : 0;
    
    const questionsByType = {
      'multiple-choice': await Question.countDocuments({ type: 'multiple-choice', isActive: true }),
      'single-choice': await Question.countDocuments({ type: 'single-choice', isActive: true }),
      'short-answer': await Question.countDocuments({ type: 'short-answer', isActive: true }),
      'match-following': await Question.countDocuments({ type: 'match-following', isActive: true }),
      'code-test': await Question.countDocuments({ type: 'code-test', isActive: true }),
    };
    
    // Calculate simple trends (placeholder - you can enhance this with historical data)
    const examsTrend = totalExams > 0 ? Math.round((activeExams / totalExams) * 10) : 0;
    const activeExamsTrend = activeExams > 0 ? 5 : 0;
    const questionsTrend = totalQuestions > 0 ? 8 : 0;
    const studentsTrend = totalStudents > 0 ? 3 : 0;
    const sessionsTrend = totalSessions > 0 ? 12 : 0;
    const completedTrend = completedSessions > 0 ? 7 : 0;
    const scoreTrend = averageScore > 60 ? 2 : -1;
    const passRateTrend = passRate > 50 ? 4 : -2;
    
    const stats = {
      totalExams,
      activeExams,
      totalQuestions,
      totalStudents,
      activeStudents,
      totalSessions,
      completedSessions,
      ongoingExams,
      averageScore,
      passRate,
      questionsByType,
      // Trend data
      examsTrend,
      activeExamsTrend,
      questionsTrend,
      studentsTrend,
      sessionsTrend,
      completedTrend,
      scoreTrend,
      passRateTrend,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ==================== STUDENT MANAGEMENT ====================

// Get all students
router.get('/students', requireAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('assignedExams', 'title duration')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get single student details
router.get('/students/:id', requireAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-password')
      .populate('assignedExams');
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Get student's exam sessions
    const sessions = await ExamSession.find({ student: req.params.id })
      .populate('exam', 'title duration')
      .sort({ createdAt: -1 });
    
    res.json({ student, sessions });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
});

// Update student details
router.put('/students/:id', requireAdmin, async (req, res) => {
  try {
    const { name, studentId, password, batch } = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Update fields
    if (name) student.name = name;
    if (studentId !== undefined) student.studentId = studentId;
    if (batch !== undefined) student.batch = batch;
    
    // Only update password if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      student.password = await bcrypt.hash(password, 10);
    }
    
    await student.save();
    
    await logActivity(req.user.id, 'student_update', 'user', student._id, { name, studentId, batch }, req);
    
    // Return student without password
    const updatedStudent = await User.findById(student._id).select('-password');
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// Update student status (activate/deactivate)
router.put('/students/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    student.isActive = isActive;
    await student.save();
    
    await logActivity(req.user.id, 'student_update', 'user', student._id, { isActive }, req);
    
    res.json(student);
  } catch (error) {
    console.error('Error updating student status:', error);
    res.status(500).json({ error: 'Failed to update student status' });
  }
});

// Delete student
router.delete('/students/:id', requireAdmin, async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    await logActivity(req.user.id, 'student_delete', 'user', student._id, { name: student.name }, req);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

// ==================== EXAM ASSIGNMENT ====================

// Assign student to exam
router.post('/exams/:examId/assign/:studentId', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    const student = await User.findById(req.params.studentId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Check if already assigned
    if (exam.assignedStudents.includes(req.params.studentId)) {
      return res.status(400).json({ error: 'Student already assigned to this exam' });
    }
    
    // Add to exam's assigned students
    exam.assignedStudents.push(req.params.studentId);
    await exam.save();
    
    // Add to student's assigned exams
    if (!student.assignedExams.includes(req.params.examId)) {
      student.assignedExams.push(req.params.examId);
      await student.save();
    }
    
    await logActivity(req.user.id, 'student_assign', 'exam', exam._id, { 
      studentId: student._id, 
      studentName: student.name 
    }, req);
    
    res.json({ message: 'Student assigned successfully', exam });
  } catch (error) {
    console.error('Error assigning student:', error);
    res.status(500).json({ error: 'Failed to assign student' });
  }
});

// Unassign student from exam
router.delete('/exams/:examId/assign/:studentId', requireAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    const student = await User.findById(req.params.studentId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Remove from exam's assigned students
    exam.assignedStudents = exam.assignedStudents.filter(
      id => id.toString() !== req.params.studentId
    );
    await exam.save();
    
    // Remove from student's assigned exams
    student.assignedExams = student.assignedExams.filter(
      id => id.toString() !== req.params.examId
    );
    await student.save();
    
    await logActivity(req.user.id, 'student_unassign', 'exam', exam._id, { 
      studentId: student._id, 
      studentName: student.name 
    }, req);
    
    res.json({ message: 'Student unassigned successfully', exam });
  } catch (error) {
    console.error('Error unassigning student:', error);
    res.status(500).json({ error: 'Failed to unassign student' });
  }
});

// Bulk assign students to exam
router.post('/exams/:examId/assign-bulk', requireAdmin, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const exam = await Exam.findById(req.params.examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    let assignedCount = 0;
    
    for (const studentId of studentIds) {
      const student = await User.findById(studentId);
      if (student && student.role === 'student') {
        // Add to exam if not already assigned
        if (!exam.assignedStudents.includes(studentId)) {
          exam.assignedStudents.push(studentId);
          assignedCount++;
        }
        
        // Add to student if not already assigned
        if (!student.assignedExams.includes(req.params.examId)) {
          student.assignedExams.push(req.params.examId);
          await student.save();
        }
      }
    }
    
    await exam.save();
    await logActivity(req.user.id, 'student_assign', 'exam', exam._id, { 
      count: assignedCount 
    }, req);
    
    res.json({ message: `${assignedCount} students assigned successfully`, exam });
  } catch (error) {
    console.error('Error bulk assigning students:', error);
    res.status(500).json({ error: 'Failed to assign students' });
  }
});

// Assign all students from a batch to exam
router.post('/exams/:examId/assign-batch', requireAdmin, async (req, res) => {
  try {
    const { batch } = req.body;
    const exam = await Exam.findById(req.params.examId);
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!batch) {
      return res.status(400).json({ error: 'Batch name is required' });
    }
    
    // Find all students in the specified batch
    const students = await User.find({ role: 'student', batch: batch, isActive: true });
    
    if (students.length === 0) {
      return res.status(404).json({ error: `No active students found in batch: ${batch}` });
    }
    
    let assignedCount = 0;
    
    for (const student of students) {
      // Add to exam if not already assigned
      if (!exam.assignedStudents.includes(student._id)) {
        exam.assignedStudents.push(student._id);
        assignedCount++;
      }
      
      // Add to student if not already assigned
      if (!student.assignedExams.includes(req.params.examId)) {
        student.assignedExams.push(req.params.examId);
        await student.save();
      }
    }
    
    await exam.save();
    await logActivity(req.user.id, 'batch_assign', 'exam', exam._id, { 
      batch: batch,
      count: assignedCount,
      totalStudents: students.length
    }, req);
    
    res.json({ 
      message: `${assignedCount} students from batch "${batch}" assigned successfully`,
      totalStudents: students.length,
      assignedCount,
      batch,
      exam 
    });
  } catch (error) {
    console.error('Error assigning batch to exam:', error);
    res.status(500).json({ error: 'Failed to assign batch to exam' });
  }
});

// Get all unique batches
router.get('/batches', requireAdmin, async (req, res) => {
  try {
    const batches = await User.distinct('batch', { role: 'student', batch: { $ne: '' } });
    res.json(batches.sort());
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// ==================== ACTIVITY LOGS ====================

// Get activity logs
router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    
    const query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;
    
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await ActivityLog.countDocuments(query);
    
    res.json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get student activity logs
router.get('/students/:id/logs', requireAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching student logs:', error);
    res.status(500).json({ error: 'Failed to fetch student logs' });
  }
});

// Get recent exam sessions
router.get('/sessions/recent', requireAdmin, async (req, res) => {
  try {
    const sessions = await ExamSession.find()
      .populate('student', 'name email')
      .populate('exam', 'title passingScore')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    res.status(500).json({ error: 'Failed to fetch recent sessions' });
  }
});

// Get detailed student answers for a session
router.get('/sessions/:sessionId/details', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.sessionId)
      .populate('student', 'name email studentId')
      .populate('exam', 'title description duration passingScore')
      .populate('questionDetails.questionId');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    res.json({
      session: {
        _id: session._id,
        student: session.student,
        exam: session.exam,
        startTime: session.startTime,
        endTime: session.endTime,
        submittedAt: session.submittedAt,
        score: session.score,
        percentage: session.percentage,
        passed: session.passed,
        correctAnswers: session.correctAnswers,
        totalQuestions: session.totalQuestions,
        grade: session.grade,
        category: session.category,
        status: session.status
      },
      questionDetails: session.questionDetails || [],
      questionOrder: session.questionOrder || []
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ message: 'Error fetching session details', error: error.message });
  }
});

// Get all sessions with detailed answers
router.get('/sessions/detailed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { examId, studentId, limit = 50, skip = 0 } = req.query;
    
    const filter = {};
    if (examId) filter.exam = examId;
    if (studentId) filter.student = studentId;
    
    const sessions = await ExamSession.find(filter)
      .populate('student', 'name email studentId')
      .populate('exam', 'title')
      .select('student exam startTime submittedAt score percentage passed grade status questionDetails')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await ExamSession.countDocuments(filter);
    
    res.json({
      sessions,
      total,
      hasMore: total > (parseInt(skip) + parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching detailed sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

export default router;

