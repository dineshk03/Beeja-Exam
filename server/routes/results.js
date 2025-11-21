import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ExamSession from '../models/ExamSession.js';
import User from '../models/User.js';
import Exam from '../models/Exam.js';

const router = express.Router();

// Get user's exam results with statistics
router.get('/my-results', authenticateToken, async (req, res) => {
  try {
    const results = await ExamSession.find({
      student: req.user.id,
      status: 'submitted',
    })
      .populate('exam', 'title duration passingScore showResultsToStudents')
      .sort({ submittedAt: -1 });

    // Filter out results where admin has disabled showing results to students
    const visibleResults = results.filter(result => 
      result.exam && result.exam.showResultsToStudents !== false
    );

    // Calculate statistics based on visible results only
    const stats = {
      totalExams: visibleResults.length,
      passed: visibleResults.filter(r => r.passed).length,
      failed: visibleResults.filter(r => !r.passed).length,
      avgScore: visibleResults.length > 0 
        ? visibleResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / visibleResults.length 
        : 0,
    };

    res.json({ results: visibleResults, stats });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Get specific result/marksheet
router.get('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const result = await ExamSession.findById(req.params.sessionId)
      .populate('student', 'name email studentId')
      .populate('exam', 'title duration passingScore showResultsToStudents');
    
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Check if user is authorized to view this result
    if (result.student._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if admin allows students to see results for this exam
    if (result.exam && result.exam.showResultsToStudents === false) {
      return res.status(403).json({ error: 'Results are not available for this exam' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

export default router;
