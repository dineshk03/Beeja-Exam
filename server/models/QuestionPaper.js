import mongoose from 'mongoose';

const questionPaperSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  description: {
    type: String,
    trim: true
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update totalMarks when questions are added/removed
questionPaperSchema.pre('save', async function(next) {
  if (this.isModified('questions')) {
    const Question = mongoose.model('Question');
    const questions = await Question.find({ _id: { $in: this.questions } });
    this.totalMarks = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }
  this.updatedAt = new Date();
  next();
});

// Index for faster queries and compound unique constraint
questionPaperSchema.index({ exam: 1, code: 1 }, { unique: true });
questionPaperSchema.index({ isActive: 1 });

const QuestionPaper = mongoose.model('QuestionPaper', questionPaperSchema);

export default QuestionPaper;
