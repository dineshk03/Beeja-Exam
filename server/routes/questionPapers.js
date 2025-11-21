import express from 'express';
import QuestionPaper from '../models/QuestionPaper.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Get all question papers for an exam
router.get('/exams/:examId/question-papers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const questionPapers = await QuestionPaper.find({ exam: req.params.examId })
      .populate('questions')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(questionPapers);
  } catch (error) {
    console.error('Error fetching question papers:', error);
    res.status(500).json({ error: 'Failed to fetch question papers' });
  }
});

// Get single question paper
router.get('/question-papers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id)
      .populate('questions')
      .populate('exam', 'title')
      .populate('createdBy', 'name email');
    
    if (!questionPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    
    res.json(questionPaper);
  } catch (error) {
    console.error('Error fetching question paper:', error);
    res.status(500).json({ error: 'Failed to fetch question paper' });
  }
});

// Create question paper
router.post('/exams/:examId/question-papers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Creating question paper with data:', req.body);
    const { name, code, description, questions, duration } = req.body;
    
    // Validate required fields
    if (!name || !code || !duration) {
      return res.status(400).json({ error: 'Name, code, and duration are required' });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question must be selected' });
    }
    
    // Check if code already exists for this exam
    const existing = await QuestionPaper.findOne({ exam: req.params.examId, code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Question paper code already exists for this exam' });
    }
    
    const questionPaper = new QuestionPaper({
      name,
      code: code.toUpperCase(),
      exam: req.params.examId,
      description,
      questions,
      duration,
      createdBy: req.user.id
    });
    
    await questionPaper.save();
    
    // Add to exam's question papers array
    await Exam.findByIdAndUpdate(req.params.examId, {
      $push: { questionPapers: questionPaper._id },
      useQuestionPapers: true
    });
    
    await questionPaper.populate('questions');
    
    res.status(201).json(questionPaper);
  } catch (error) {
    console.error('Error creating question paper:', error);
    
    // Handle duplicate key error for compound unique constraint
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return res.status(400).json({ error: 'Question paper code already exists for this exam' });
    }
    
    res.status(500).json({ error: 'Failed to create question paper' });
  }
});

// Update question paper
router.put('/question-papers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, questions, duration, isActive } = req.body;
    
    const questionPaper = await QuestionPaper.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        questions,
        duration,
        isActive,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('questions');
    
    if (!questionPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    
    res.json(questionPaper);
  } catch (error) {
    console.error('Error updating question paper:', error);
    res.status(500).json({ error: 'Failed to update question paper' });
  }
});

// Delete question paper
router.delete('/question-papers/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id);
    
    if (!questionPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    
    // Remove from exam's question papers array
    await Exam.findByIdAndUpdate(questionPaper.exam, {
      $pull: { questionPapers: questionPaper._id }
    });
    
    await questionPaper.deleteOne();
    
    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Error deleting question paper:', error);
    res.status(500).json({ error: 'Failed to delete question paper' });
  }
});

// Assign random question paper to student
router.post('/exams/:examId/assign-qp', authenticateToken, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId).populate('questionPapers');
    
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (!exam.useQuestionPapers || !exam.questionPapers || exam.questionPapers.length === 0) {
      return res.status(400).json({ error: 'No question papers available for this exam' });
    }
    
    // Get active question papers
    const activeQPs = exam.questionPapers.filter(qp => qp.isActive);
    
    if (activeQPs.length === 0) {
      return res.status(400).json({ error: 'No active question papers available' });
    }
    
    // Randomly select a question paper
    const randomIndex = Math.floor(Math.random() * activeQPs.length);
    const selectedQP = activeQPs[randomIndex];
    
    res.json({
      questionPaperId: selectedQP._id,
      questionPaperCode: selectedQP.code,
      questionPaperName: selectedQP.name
    });
  } catch (error) {
    console.error('Error assigning question paper:', error);
    res.status(500).json({ error: 'Failed to assign question paper' });
  }
});

export default router;
