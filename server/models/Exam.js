import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true, // in minutes
  },
  passingScore: {
    type: Number,
    required: true, // percentage
    min: 0,
    max: 100,
  },
  category: {
    type: String,
    default: 'General',
  },
  // Section-based exam support
  hasSections: {
    type: Boolean,
    default: false,
  },
  sections: [{
    name: String, // e.g., "Aptitude", "Technical", "Verbal"
    description: String,
    duration: Number, // Section-specific duration in minutes
    questions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    }],
    allowBackNavigation: {
      type: Boolean,
      default: false, // TCS iON style - can't go back once section is submitted
    },
  }],
  
  // Legacy support - for non-section exams
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  
  // Question Papers support
  useQuestionPapers: {
    type: Boolean,
    default: false
  },
  questionPapers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  }],
  selectedQuestionPapers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionPaper'
  }],
  minimumQPRequired: {
    type: Number,
    default: 2,
    min: 1
  },
  
  // Proctoring Settings
  requireWebcam: {
    type: Boolean,
    default: true
  },
  requireMicrophone: {
    type: Boolean,
    default: true
  },
  requireIdentityVerification: {
    type: Boolean,
    default: true
  },
  allowMobileDevices: {
    type: Boolean,
    default: false
  },
  
  // Instructions and rules
  instructions: {
    type: String,
    default: `General Instructions:
1. Read all questions carefully before answering.
2. Each question carries equal marks unless specified.
3. There is no negative marking.
4. Do not refresh the page during the exam.
5. The exam will auto-submit when time expires.
6. Ensure stable internet connection throughout the exam.`,
  },
  rules: [{
    type: String,
  }],
  
  // Advanced exam features
  showCalculator: {
    type: Boolean,
    default: true,
  },
  showReviewScreen: {
    type: Boolean,
    default: true,
  },
  showQuestionAnalysis: {
    type: Boolean,
    default: false,
  },
  showResultsToStudents: {
    type: Boolean,
    default: true, // By default, show results to students
  },
  requirePhotoCapture: {
    type: Boolean,
    default: false,
  },
  photoCaptureInterval: {
    type: Number,
    default: 300000, // Capture photo every 5 minutes (in ms)
  },
  
  // Proctoring settings
  enableWebcam: {
    type: Boolean,
    default: false,
  },
  enableMicrophone: {
    type: Boolean,
    default: false,
  },
  
  assignedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  batch: {
    type: String,
    default: '', // e.g., "2024-A", "Batch-1", "Morning Batch"
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  allowedAttempts: {
    type: Number,
    default: 3, // Allow 3 attempts by default for development
  },
}, {
  timestamps: true,
});

// Virtual for total points
examSchema.virtual('totalPoints').get(function() {
  return this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
});

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
