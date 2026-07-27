import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import Exam from '../models/Exam.js';
import ExamSession from '../models/ExamSession.js';
import Question from '../models/Question.js';
import QuestionPaper from '../models/QuestionPaper.js';
import Schedule from '../models/Schedule.js';
import { logActivity } from '../utils/logger.js';
import { encryptQuestions } from '../utils/encryption.js';
import { sendEmail } from '../utils/emailService.js';

const router = express.Router();

// Helper function to check if student has access to a schedule
async function checkStudentScheduleAccess(schedule, userObjectId, userId) {
  console.log(`🔍 Checking access for student ${userId} to schedule ${schedule._id}`);

  // 1. Check if student is explicitly registered in the schedule
  if (schedule.registeredCandidates && schedule.registeredCandidates.some(id => id.toString() === userId)) {
    console.log('   ✅ Access granted: Student registered in schedule');
    return true;
  }

  // 2. Check if student is assigned to the exam
  if (schedule.exam && schedule.exam.assignedStudents && schedule.exam.assignedStudents.some(id => id.toString() === userId)) {
    console.log('   ✅ Access granted: Student assigned to exam');
    return true;
  }

  // 3. Check batch-based access (schedule level)
  if (schedule.allowedBatches && schedule.allowedBatches.length > 0) {
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId).select('batch');

      if (user && user.batch && schedule.allowedBatches.includes(user.batch)) {
        console.log(`   ✅ Access granted: Student batch "${user.batch}" allowed in schedule`);
        return true;
      }

      console.log(`   ❌ Access denied: Student batch "${user?.batch || 'none'}" not in allowed batches [${schedule.allowedBatches.join(', ')}]`);
    } catch (error) {
      console.log('   ❌ Error checking batch access:', error.message);
    }
  }

  // 4. Check batch-based access (exam level)
  if (schedule.exam && schedule.exam.batch) {
    try {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId).select('batch');

      if (user && user.batch && user.batch === schedule.exam.batch) {
        console.log(`   ✅ Access granted: Student batch "${user.batch}" matches exam batch`);
        return true;
      }

      console.log(`   ❌ Access denied: Student batch "${user?.batch || 'none'}" doesn't match exam batch "${schedule.exam.batch}"`);
    } catch (error) {
      console.log('   ❌ Error checking exam batch access:', error.message);
    }
  }

  // 5. MODIFIED: If exam has no restrictions, allow access (open exam)
  const hasNoAssignments = !schedule.exam.assignedStudents || schedule.exam.assignedStudents.length === 0;
  const hasNoRegistrations = !schedule.registeredCandidates || schedule.registeredCandidates.length === 0;
  const hasNoBatchRestrictions = (!schedule.allowedBatches || schedule.allowedBatches.length === 0) &&
    (!schedule.exam.batch || schedule.exam.batch === '');

  if (hasNoAssignments && hasNoRegistrations && hasNoBatchRestrictions) {
    console.log('   ✅ Access granted: Open exam with no restrictions');
    return true;
  }

  console.log('   ❌ Access denied: Student not authorized for this schedule');
  return false;
}

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

    // Get current date and time for schedule checking
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    console.log('🕒 Current time check:', {
      currentDate,
      currentTime,
      now: now.toISOString()
    });

    // Find all active schedules that are happening now or today (with extended window)
    const activeSchedules = await Schedule.find({
      status: 'scheduled',
      scheduledDate: {
        $gte: new Date(currentDate), // Today or future
        $lt: new Date(new Date(currentDate).getTime() + 24 * 60 * 60 * 1000) // Before tomorrow
      }
    }).populate('exam', 'title assignedStudents batch');

    // Filter schedules that are currently active (within extended time window) AND student has access
    const currentlyActiveSchedules = [];

    for (const schedule of activeSchedules) {
      const scheduleDate = schedule.scheduledDate.toISOString().split('T')[0];
      const isToday = scheduleDate === currentDate;

      if (!isToday) continue; // Only show today's schedules

      // Check if current time is within the exact schedule window (no grace period)
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;

      // No grace periods - exact time window only
      const isWithinTimeWindow = currentTime >= startTime && currentTime <= endTime;

      // Check if student has access to this schedule
      const hasAccess = await checkStudentScheduleAccess(schedule, userObjectId, userId);

      console.log(`📅 Schedule "${schedule.exam?.title}": ${startTime} - ${endTime} (exact), Current: ${currentTime}, Within window: ${isWithinTimeWindow}, Has access: ${hasAccess}`);

      if (hasAccess && isWithinTimeWindow) {
        currentlyActiveSchedules.push(schedule);
      }
    }

    const scheduledExamIds = currentlyActiveSchedules.map(s => s.exam._id);

    console.log('🔍 Schedule check for user:', userId);
    console.log('   Active schedules found:', activeSchedules.length);
    console.log('   Currently active schedules:', currentlyActiveSchedules.length);
    console.log('   Available exam IDs:', scheduledExamIds);

    const exams = await Exam.find({
      isActive: true,
      $or: [
        { assignedStudents: userObjectId },  // Explicitly assigned
        { _id: { $in: scheduledExamIds } }   // Currently scheduled and active
      ]
    })
      .select('title description duration passingScore category assignedStudents')
      .lean();

    console.log('Found exams:', exams.length);
    exams.forEach(exam => {
      console.log(`Exam: ${exam.title}, assignedStudents:`, exam.assignedStudents);
    });

    // Add question count to each exam - enforce QP system
    const examsWithCount = await Promise.all(
      exams.map(async (exam) => {
        const fullExam = await Exam.findById(exam._id)
          .populate('questions')
          .populate('selectedQuestionPapers');

        // Check if exam is properly configured with Question Papers
        const requiresQPSetup = fullExam.useQuestionPapers &&
          (!fullExam.selectedQuestionPapers || fullExam.selectedQuestionPapers.length < (fullExam.minimumQPRequired || 2));

        console.log(`📋 Exam "${fullExam.title}" QP Status:`, {
          useQuestionPapers: fullExam.useQuestionPapers,
          selectedQPCount: fullExam.selectedQuestionPapers?.length || 0,
          minimumRequired: fullExam.minimumQPRequired || 2,
          requiresQPSetup,
          directQuestions: fullExam.questions?.length || 0
        });

        // If QP system is enforced but not configured, show 0 questions
        let totalQuestions = 0;
        if (fullExam.useQuestionPapers) {
          if (fullExam.selectedQuestionPapers && fullExam.selectedQuestionPapers.length >= (fullExam.minimumQPRequired || 2)) {
            // Calculate total questions from all selected QPs (sum of all QPs)
            const qpQuestionCounts = fullExam.selectedQuestionPapers.map(qp => qp.questions?.length || 0);
            totalQuestions = qpQuestionCounts.reduce((sum, count) => sum + count, 0);

            console.log(`   📊 QP Question Counts: [${qpQuestionCounts.join(', ')}] = Total: ${totalQuestions}`);
          }
        } else {
          // Legacy: direct question assignment (should be migrated)
          totalQuestions = fullExam.questions.length;
        }

        return {
          ...exam,
          totalQuestions,
          requiresQPSetup,
          qpConfigured: !requiresQPSetup
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

    // Check if exam requires Question Papers but doesn't have enough
    const requiresQPSetup = exam.useQuestionPapers &&
      (!exam.selectedQuestionPapers || exam.selectedQuestionPapers.length < (exam.minimumQPRequired || 2));

    // Get current schedule's proctoring settings if available
    let proctorSettings = null;
    try {
      const currentSchedule = await Schedule.findOne({
        exam: req.params.id,
        status: 'scheduled',
        scheduledDate: {
          $gte: new Date(new Date().toISOString().split('T')[0]),
          $lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (currentSchedule) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const isWithinWindow = currentTime >= currentSchedule.startTime && currentTime <= currentSchedule.endTime;
        const gracePeriodMs = 5 * 60 * 1000;
        const endTime = new Date(`${new Date().toISOString().split('T')[0]}T${currentSchedule.endTime}:00`);
        const isWithinGrace = now <= new Date(endTime.getTime() + gracePeriodMs);

        if (isWithinWindow || isWithinGrace) {
          proctorSettings = currentSchedule.proctorSettings;
          console.log('📋 Using schedule proctoring settings:', proctorSettings);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch schedule proctoring settings:', error.message);
    }

    res.json({
      ...exam,
      questions: sanitizedQuestions,
      totalQuestions: exam.questions.length,
      requiresQPSetup,
      qpStatus: {
        useQuestionPapers: exam.useQuestionPapers,
        selectedCount: exam.selectedQuestionPapers?.length || 0,
        minimumRequired: exam.minimumQPRequired || 2,
        isConfigured: !requiresQPSetup
      },
      // Include schedule proctoring settings if available
      scheduleProctorSettings: proctorSettings,
      // Map schedule settings to expected format for PreExamChecks
      requireWebcam: proctorSettings?.webcamRequired || exam.enableWebcam || false,
      requireMicrophone: proctorSettings?.microphoneRequired || exam.enableMicrophone || false,
      requireIdentityVerification: proctorSettings?.idVerification || exam.requirePhotoCapture || false,
      requireScreenRecording: proctorSettings?.screenRecording || false,
      requireBrowserLockdown: proctorSettings?.browserLockdown || false
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
    const allSchedules = await Schedule.find({
      exam: req.params.id,
      status: 'scheduled'
    });

    // Find the most appropriate schedule (same logic as frontend)
    let schedule = null;
    if (allSchedules.length > 0) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Filter to today's schedules
      const todaySchedules = allSchedules.filter(s => {
        const scheduleDate = new Date(s.scheduledDate).toISOString().split('T')[0];
        return scheduleDate === currentDate;
      });

      if (todaySchedules.length > 0) {
        // Find currently active schedule
        const activeSchedule = todaySchedules.find(s =>
          currentTime >= s.startTime && currentTime <= s.endTime
        );

        if (activeSchedule) {
          schedule = activeSchedule;
        } else {
          // Find next upcoming schedule today
          const upcomingSchedule = todaySchedules
            .filter(s => currentTime < s.startTime)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

          if (upcomingSchedule) {
            schedule = upcomingSchedule;
          } else {
            // All schedules today have passed, use most recent
            schedule = todaySchedules
              .sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
          }
        }

        // Check if student has access to the selected schedule
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        if (schedule && !(await checkStudentScheduleAccess(schedule, userObjectId, req.user.id))) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'You are not authorized to take this scheduled exam. Please contact your administrator.',
            details: {
              reason: 'Not assigned to exam or registered in schedule',
              canStart: false
            }
          });
        }
      } else {
        // No schedules today, use next upcoming
        schedule = allSchedules.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
      }
    }

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

      // Check if current time is within the exact scheduled window (no grace period)
      if (now < startDateTime) {
        const timeUntilStart = Math.ceil((startDateTime - now) / (1000 * 60)); // minutes
        return res.status(403).json({
          error: 'Exam not yet available',
          message: `This exam is scheduled to start at ${schedule.startTime} on ${scheduleDate.toLocaleDateString()}.`,
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
        const minutesSinceEnd = Math.floor((now - endDateTime) / (1000 * 60));
        return res.status(403).json({
          error: 'Exam time has passed',
          message: `This exam was scheduled from ${schedule.startTime} to ${schedule.endTime} on ${scheduleDate.toLocaleDateString()}.`,
          details: {
            scheduledDate: scheduleDate,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            minutesSinceEnd: minutesSinceEnd,
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

    // Enforce Question Paper system - require minimum 2 QPs
    if (!exam.useQuestionPapers || !exam.selectedQuestionPapers || exam.selectedQuestionPapers.length < exam.minimumQPRequired) {
      console.log('❌ Question Paper validation failed:', {
        useQuestionPapers: exam.useQuestionPapers,
        selectedQPCount: exam.selectedQuestionPapers?.length || 0,
        minimumRequired: exam.minimumQPRequired || 2
      });
      return res.status(400).json({
        error: 'Exam configuration incomplete',
        message: `This exam requires at least ${exam.minimumQPRequired || 2} Question Papers to be selected. Please contact administrator.`,
        details: {
          useQuestionPapers: exam.useQuestionPapers,
          selectedQPCount: exam.selectedQuestionPapers?.length || 0,
          minimumRequired: exam.minimumQPRequired || 2
        }
      });
    }

    // Randomly select a Question Paper for this student
    const randomIndex = Math.floor(Math.random() * exam.selectedQuestionPapers.length);
    const selectedQPId = exam.selectedQuestionPapers[randomIndex];

    // Populate the selected Question Paper with questions
    const selectedQP = await QuestionPaper.findById(selectedQPId).populate('questions');

    if (!selectedQP || !selectedQP.questions || selectedQP.questions.length === 0) {
      console.log('❌ Selected Question Paper has no questions:', {
        selectedQPId,
        hasQP: !!selectedQP,
        questionCount: selectedQP?.questions?.length || 0
      });
      return res.status(400).json({
        error: 'Question Paper configuration error',
        message: 'The selected Question Paper has no questions. Please contact administrator.'
      });
    }

    // Use questions from the selected Question Paper
    let questionsToUse = selectedQP.questions;
    let duration = exam.duration; // Always use exam's duration, not QP duration

    console.log(`Randomly Selected Question Paper: ${selectedQP.code} - ${selectedQP.name} (from ${exam.selectedQuestionPapers.length} selected QPs)`);

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
        console.log(`🔍 Evaluating Q${index + 1} (${question.type}):`, {
          questionId: question._id,
          studentAnswer,
          studentAnswerType: typeof studentAnswer,
          correctAnswer: question.correctAnswer || question.correctAnswerIndices || question.correctAnswers,
          correctMatches: question.correctMatches,
          hasCorrectMatches: !!question.correctMatches,
          correctMatchesType: typeof question.correctMatches,
          correctMatchesIsMap: question.correctMatches instanceof Map
        });

        switch (question.type) {
          case 'multiple-choice':
          case 'single-choice':
            // Convert both to numbers for comparison to handle string/number mismatch
            isCorrect = Number(studentAnswer) === Number(question.correctAnswer);
            console.log(`   Comparison: Number(${studentAnswer}) === Number(${question.correctAnswer}) = ${isCorrect}`);
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
        } else if (session.exam.negativeMarking?.enabled) {
          earnedPoints -= question.points * (session.exam.negativeMarking.deductionValue || 0.25);
        }
      }

      // Store detailed question information for ALL questions (answered or not)
      questionDetails.push({
        questionId: question._id,
        questionText: question.question,
        questionType: question.type,
        options: question.options || [],
        correctAnswer: (() => {
          // Handle different question types properly
          switch (question.type) {
            case 'multiple-choice':
            case 'single-choice':
              return question.correctAnswer;
            case 'multiple-answer':
              return question.correctAnswerIndices;
            case 'short-answer':
              return question.correctAnswers;
            case 'match-following':
              // Convert Map to Object for JSON serialization
              return question.correctMatches instanceof Map
                ? Object.fromEntries(question.correctMatches)
                : question.correctMatches;
            default:
              return question.correctAnswer || question.correctAnswers || question.correctAnswerIndices;
          }
        })(),
        studentAnswer: studentAnswer !== undefined && studentAnswer !== null ? studentAnswer : null,
        isCorrect: isCorrect,
        timeSpent: 0, // Can be tracked if needed
        attemptedAt: studentAnswer !== undefined && studentAnswer !== null ? new Date() : null,
        questionOrder: index + 1,
        // Add additional fields for different question types
        leftItems: question.leftItems || [],
        rightItems: question.rightItems || [],
        caseSensitive: question.caseSensitive || false
      });
    });

    earnedPoints = Math.max(0, earnedPoints);
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

    // Send exam completed email
    try {
      await sendEmail(session.student.email, 'examCompleted', [
        session.student.name,
        session.exam.title,
        Math.round(percentage),
        passed
      ]);
      console.log('✅ Exam completed email sent to:', session.student.email);
    } catch (emailError) {
      console.error('⚠️  Failed to send exam completed email:', emailError.message);
      // Continue even if email fails
    }

    // Calculate exam duration
    const examStartTime = session.startTime || session.createdAt;
    const examEndTime = new Date();
    const durationMs = examEndTime - examStartTime;
    const totalSeconds = Math.floor(durationMs / 1000);
    const durationMinutes = Math.floor(totalSeconds / 60);
    const durationSeconds = totalSeconds % 60;

    // Format duration with minutes and seconds
    let durationFormatted;
    if (durationMinutes > 0) {
      durationFormatted = `${durationMinutes} minute${durationMinutes !== 1 ? 's' : ''} ${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
    } else {
      durationFormatted = `${durationSeconds} second${durationSeconds !== 1 ? 's' : ''}`;
    }

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
      incorrectAnswers,
      answeredQuestions,
      unansweredQuestions,
      totalQuestions: session.exam.questions.length,
      grade,
      category,
      questionDetails, // Add detailed question analysis
      // Add user and duration information
      studentName: session.student?.name || 'N/A',
      studentEmail: session.student?.email || 'N/A',
      duration: durationFormatted,
      durationMinutes: durationMinutes,
      durationSeconds: durationSeconds,
      totalDurationSeconds: totalSeconds,
      negativeMarkingEnabled: session.exam.negativeMarking?.enabled || false,
      negativeDeductionValue: session.exam.negativeMarking?.deductionValue || 0
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
