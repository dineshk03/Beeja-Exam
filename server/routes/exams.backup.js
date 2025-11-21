import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { examsData } from './admin.js';

const router = express.Router();

// Sample exam data (will be replaced by admin-created exams)
const sampleExams = [
  {
    id: '1',
    title: 'JavaScript Fundamentals',
    description: 'Test your knowledge of JavaScript basics',
    duration: 60, // minutes
    totalQuestions: 20,
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is the output of: typeof null?',
        options: ['null', 'undefined', 'object', 'number'],
        correctAnswer: 2,
        points: 5,
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        points: 5,
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'What does "===" operator do in JavaScript?',
        options: [
          'Compares values only',
          'Compares types only',
          'Compares both value and type',
          'Assigns a value'
        ],
        correctAnswer: 2,
        points: 5,
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Which keyword is used to declare a constant in JavaScript?',
        options: ['var', 'let', 'const', 'constant'],
        correctAnswer: 2,
        points: 5,
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'What is a closure in JavaScript?',
        options: [
          'A function with no return value',
          'A function that has access to outer function scope',
          'A loop structure',
          'A type of variable'
        ],
        correctAnswer: 1,
        points: 5,
      },
    ],
  },
  {
    id: '2',
    title: 'React Basics',
    description: 'Assess your React knowledge',
    duration: 45,
    totalQuestions: 15,
    passingScore: 75,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What is JSX?',
        options: [
          'A JavaScript framework',
          'A syntax extension for JavaScript',
          'A CSS preprocessor',
          'A database query language'
        ],
        correctAnswer: 1,
        points: 5,
      },
      {
        id: 'q2',
        type: 'multiple-choice',
        question: 'Which hook is used for side effects in React?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correctAnswer: 1,
        points: 5,
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'What is the virtual DOM?',
        options: [
          'A copy of the real DOM kept in memory',
          'A new browser API',
          'A CSS framework',
          'A testing library'
        ],
        correctAnswer: 0,
        points: 5,
      },
    ],
  },
];

// In-memory exam sessions
const examSessions = [];

// Get all available exams
router.get('/', authenticateToken, (req, res) => {
  // Combine sample exams and admin-created exams
  const allExams = [...sampleExams, ...examsData.filter(e => e.isActive)];
  const examList = allExams.map(({ questions, ...exam }) => ({
    ...exam,
    totalQuestions: exam.questions?.length || 0
  }));
  res.json(examList);
});

// Get exam details (without answers)
router.get('/:id', authenticateToken, (req, res) => {
  const allExams = [...sampleExams, ...examsData];
  const exam = allExams.find(e => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  const examWithoutAnswers = {
    ...exam,
    questions: exam.questions.map(({ correctAnswer, ...q }) => q),
  };

  res.json(examWithoutAnswers);
});

// Start exam session
router.post('/:id/start', authenticateToken, (req, res) => {
  const allExams = [...sampleExams, ...examsData];
  const exam = allExams.find(e => e.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  const session = {
    id: Date.now().toString(),
    examId: exam.id,
    userId: req.user.id,
    startTime: new Date(),
    endTime: new Date(Date.now() + exam.duration * 60 * 1000),
    answers: {},
    flaggedQuestions: [],
    status: 'in-progress',
  };

  examSessions.push(session);

  res.json({
    sessionId: session.id,
    startTime: session.startTime,
    endTime: session.endTime,
  });
});

// Submit answer
router.post('/session/:sessionId/answer', authenticateToken, (req, res) => {
  const { questionId, answer } = req.body;
  const session = examSessions.find(s => s.id === req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (new Date() > new Date(session.endTime)) {
    return res.status(400).json({ error: 'Exam time has expired' });
  }

  session.answers[questionId] = answer;
  res.json({ success: true });
});

// Flag/unflag question
router.post('/session/:sessionId/flag', authenticateToken, (req, res) => {
  const { questionId, flagged } = req.body;
  const session = examSessions.find(s => s.id === req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (flagged) {
    if (!session.flaggedQuestions.includes(questionId)) {
      session.flaggedQuestions.push(questionId);
    }
  } else {
    session.flaggedQuestions = session.flaggedQuestions.filter(id => id !== questionId);
  }

  res.json({ success: true });
});

// Submit exam
router.post('/session/:sessionId/submit', authenticateToken, (req, res) => {
  const session = examSessions.find(s => s.id === req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const allExams = [...sampleExams, ...examsData];
  const exam = allExams.find(e => e.id === session.examId);
  if (!exam) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Calculate score
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  exam.questions.forEach(question => {
    totalPoints += question.points;
    const userAnswer = session.answers[question.id];
    if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
      correctAnswers++;
      earnedPoints += question.points;
    }
  });

  const score = Math.round((earnedPoints / totalPoints) * 100);
  const passed = score >= exam.passingScore;

  session.status = 'completed';
  session.completedAt = new Date();
  session.score = score;
  session.passed = passed;

  res.json({
    score,
    passed,
    correctAnswers,
    totalQuestions: exam.questions.length,
    earnedPoints,
    totalPoints,
  });
});

// Get session status
router.get('/session/:sessionId', authenticateToken, (req, res) => {
  const session = examSessions.find(s => s.id === req.params.sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.json({
    sessionId: session.id,
    examId: session.examId,
    startTime: session.startTime,
    endTime: session.endTime,
    answers: session.answers,
    flaggedQuestions: session.flaggedQuestions,
    status: session.status,
  });
});

export default router;
