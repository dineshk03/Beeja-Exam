import mongoose from 'mongoose';

const examSessionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  questionPaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  },
  questionPapers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  }],
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  submittedAt: {
    type: Date,
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Can be number, string, or object
  },
  
  // Store individual question details with answers
  questionDetails: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    questionText: String,
    questionType: String,
    options: [String],
    correctAnswer: mongoose.Schema.Types.Mixed,
    studentAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    timeSpent: Number, // in seconds
    attemptedAt: Date,
    questionOrder: Number // The order this question appeared for this student
  }],
  
  // Store the randomized question order for this session
  questionOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  
  flaggedQuestions: [String],
  
  // Section-based exam tracking
  currentSection: {
    type: Number,
    default: 0,
  },
  completedSections: [Number],
  sectionStartTimes: {
    type: Map,
    of: Date,
  },
  sectionEndTimes: {
    type: Map,
    of: Date,
  },
  
  // Enhanced question status tracking (TCS iON style)
  questionStatus: {
    type: Map,
    of: String, // 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'
  },
  
  // Photo captures for proctoring
  photoCaptures: [{
    timestamp: Date,
    imageUrl: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  }],
  
  score: {
    type: Number,
  },
  percentage: {
    type: Number,
  },
  passed: {
    type: Boolean,
  },
  correctAnswers: {
    type: Number,
  },
  totalQuestions: {
    type: Number,
  },
  grade: {
    type: String,
  },
  category: {
    type: String,
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'expired', 'terminated'],
    default: 'in-progress',
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  flaggedAt: {
    type: Date,
  },
  terminatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  terminatedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for faster queries
examSessionSchema.index({ student: 1, exam: 1 });
examSessionSchema.index({ status: 1 });

const ExamSession = mongoose.model('ExamSession', examSessionSchema);

export default ExamSession;
