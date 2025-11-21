import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['multiple-choice', 'single-choice', 'multiple-answer', 'short-answer', 'match-following', 'code-test', 'drag-drop', 'hotspot'],
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  points: {
    type: Number,
    required: true,
    default: 5,
  },
  
  // Multiple/Single Choice fields
  options: [String],
  correctAnswer: Number, // For single correct answer (multiple-choice, single-choice)
  correctAnswerIndices: [Number], // For multiple correct answers (multiple-answer)
  
  // Short Answer fields
  correctAnswers: [String],
  caseSensitive: {
    type: Boolean,
    default: false,
  },
  
  // Match Following fields
  leftItems: [String],
  rightItems: [String],
  correctMatches: {
    type: Map,
    of: Number,
  },
  
  // Code Test fields
  language: String,
  starterCode: String,
  testCases: [{
    input: String,
    expectedOutput: String,
    points: Number,
  }],
  
  // Drag & Drop fields
  draggableItems: [String], // Items that can be dragged
  dropZones: [{
    label: String,
    correctItems: [Number], // Indices of correct draggable items
  }],
  
  // Hotspot fields
  imageUrl: String, // URL or path to the image
  hotspots: [{
    x: Number, // X coordinate (percentage)
    y: Number, // Y coordinate (percentage)
    width: Number, // Width (percentage)
    height: Number, // Height (percentage)
    label: String, // Optional label for the hotspot
  }],
  maxHotspotSelections: Number, // Maximum number of hotspots that can be selected
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Question = mongoose.model('Question', questionSchema);

export default Question;
