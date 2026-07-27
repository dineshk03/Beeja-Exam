import express from 'express';
import ExamSession from '../models/ExamSession.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import ProctorLog from '../models/ProctorLog.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { checkPermission, requireAnyAdminPermission } from '../middleware/permissions.js';

const router = express.Router();

// Get comprehensive analytics dashboard data
router.get('/admin/analytics/dashboard', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'dashboard'), async (req, res) => {
  try {
    // Overall statistics
    const totalExams = await Exam.countDocuments();
    const activeExams = await Exam.countDocuments({ isActive: true });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalSessions = await ExamSession.countDocuments();
    const completedSessions = await ExamSession.countDocuments({ status: 'submitted' });

    // Recent activity
    const recentSessions = await ExamSession.find()
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Pass/Fail statistics
    const passFailStats = await ExamSession.aggregate([
      { $match: { status: 'submitted' } },
      {
        $group: {
          _id: '$passed',
          count: { $sum: 1 },
        },
      },
    ]);

    // Average scores by exam
    const examScores = await ExamSession.aggregate([
      { $match: { status: 'submitted' } },
      {
        $group: {
          _id: '$exam',
          avgScore: { $avg: '$percentage' },
          minScore: { $min: '$percentage' },
          maxScore: { $max: '$percentage' },
          totalAttempts: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'examDetails',
        },
      },
      { $unwind: '$examDetails' },
      {
        $project: {
          examTitle: '$examDetails.title',
          avgScore: 1,
          minScore: 1,
          maxScore: 1,
          totalAttempts: 1,
        },
      },
    ]);

    // Question type distribution
    const questionTypeStats = await Question.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Student performance distribution
    const performanceDistribution = await ExamSession.aggregate([
      { $match: { status: 'submitted' } },
      {
        $bucket: {
          groupBy: '$percentage',
          boundaries: [0, 40, 60, 75, 90, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: '$student' },
          },
        },
      },
    ]);

    // Proctoring alerts summary
    const proctorAlerts = await ProctorLog.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      overview: {
        totalExams,
        activeExams,
        totalStudents,
        totalSessions,
        completedSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(2) : 0,
      },
      recentActivity: recentSessions,
      passFailStats,
      examScores,
      questionTypeStats,
      performanceDistribution,
      proctorAlerts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// Get exam-specific analytics
router.get('/admin/analytics/exam/:examId', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Session statistics
    const sessions = await ExamSession.find({ exam: examId, status: 'submitted' });
    
    const totalAttempts = sessions.length;
    const avgScore = sessions.reduce((sum, s) => sum + s.percentage, 0) / totalAttempts || 0;
    const passRate = sessions.filter(s => s.passed).length / totalAttempts * 100 || 0;

    // Score distribution
    const scoreDistribution = sessions.map(s => ({
      studentId: s.student,
      score: s.percentage,
      passed: s.passed,
      submittedAt: s.submittedAt,
    }));

    // Time analysis
    const avgCompletionTime = sessions.reduce((sum, s) => {
      const duration = (new Date(s.submittedAt) - new Date(s.startTime)) / 1000 / 60; // minutes
      return sum + duration;
    }, 0) / totalAttempts || 0;

    // Question-wise analysis
    const questionAnalysis = exam.questions.map(question => {
      const correctCount = sessions.filter(session => {
        const answer = session.answers.get(question._id.toString());
        // Simple comparison - enhance based on question type
        return answer === question.correctAnswer;
      }).length;

      return {
        questionId: question._id,
        questionText: question.question,
        type: question.type,
        difficulty: question.difficulty,
        correctCount,
        incorrectCount: totalAttempts - correctCount,
        successRate: totalAttempts > 0 ? (correctCount / totalAttempts * 100).toFixed(2) : 0,
      };
    });

    res.json({
      exam: {
        id: exam._id,
        title: exam.title,
        totalQuestions: exam.questions.length,
      },
      statistics: {
        totalAttempts,
        avgScore: avgScore.toFixed(2),
        passRate: passRate.toFixed(2),
        avgCompletionTime: avgCompletionTime.toFixed(2),
      },
      scoreDistribution,
      questionAnalysis,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam analytics', error: error.message });
  }
});

// Get student performance report
router.get('/admin/analytics/student/:studentId', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const sessions = await ExamSession.find({ student: studentId, status: 'submitted' })
      .populate('exam', 'title category duration');

    const totalExams = sessions.length;
    const passedExams = sessions.filter(s => s.passed).length;
    const avgScore = sessions.reduce((sum, s) => sum + s.percentage, 0) / totalExams || 0;

    // Performance by category
    const categoryPerformance = {};
    sessions.forEach(session => {
      const category = session.exam.category || 'General';
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = {
          attempts: 0,
          totalScore: 0,
          passed: 0,
        };
      }
      categoryPerformance[category].attempts++;
      categoryPerformance[category].totalScore += session.percentage;
      if (session.passed) categoryPerformance[category].passed++;
    });

    // Convert to array with averages
    const categoryStats = Object.entries(categoryPerformance).map(([category, stats]) => ({
      category,
      attempts: stats.attempts,
      avgScore: (stats.totalScore / stats.attempts).toFixed(2),
      passRate: ((stats.passed / stats.attempts) * 100).toFixed(2),
    }));

    // Recent exams
    const recentExams = sessions.slice(-10).map(s => ({
      examTitle: s.exam.title,
      score: s.percentage,
      passed: s.passed,
      submittedAt: s.submittedAt,
    }));

    // Proctoring incidents
    const proctorIncidents = await ProctorLog.countDocuments({
      student: studentId,
      severity: { $in: ['high', 'critical'] },
    });

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
      },
      summary: {
        totalExams,
        passedExams,
        failedExams: totalExams - passedExams,
        avgScore: avgScore.toFixed(2),
        passRate: totalExams > 0 ? ((passedExams / totalExams) * 100).toFixed(2) : 0,
      },
      categoryPerformance: categoryStats,
      recentExams,
      proctorIncidents,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student analytics', error: error.message });
  }
});

// Get time-based analytics
router.get('/admin/analytics/timeline', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const matchStage = {
      status: 'submitted',
    };

    if (startDate || endDate) {
      matchStage.submittedAt = {};
      if (startDate) matchStage.submittedAt.$gte = new Date(startDate);
      if (endDate) matchStage.submittedAt.$lte = new Date(endDate);
    }

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const timeline = await ExamSession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$submittedAt' },
          },
          totalExams: { $sum: 1 },
          passed: {
            $sum: { $cond: ['$passed', 1, 0] },
          },
          avgScore: { $avg: '$percentage' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching timeline analytics', error: error.message });
  }
});

// Export analytics report
router.get('/admin/analytics/export', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { format = 'json', examId, studentId } = req.query;

    let data = {};

    if (examId) {
      // Export exam-specific data
      const sessions = await ExamSession.find({ exam: examId, status: 'submitted' })
        .populate('student', 'name email')
        .populate('exam', 'title');
      data = { type: 'exam', sessions };
    } else if (studentId) {
      // Export student-specific data
      const sessions = await ExamSession.find({ student: studentId, status: 'submitted' })
        .populate('exam', 'title category');
      data = { type: 'student', sessions };
    } else {
      // Export all data
      const sessions = await ExamSession.find({ status: 'submitted' })
        .populate('student', 'name email')
        .populate('exam', 'title category');
      data = { type: 'all', sessions };
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data.sessions);
      res.header('Content-Type', 'text/csv');
      res.attachment('analytics-report.csv');
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error exporting analytics', error: error.message });
  }
});

// Get student performance data
router.get('/admin/analytics/student-performance', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId } = req.query;
    
    const matchStage = { status: 'submitted' };
    if (startDate) matchStage.submittedAt = { $gte: new Date(startDate) };
    if (endDate) matchStage.submittedAt = { ...matchStage.submittedAt, $lte: new Date(endDate) };
    if (examId) matchStage.exam = mongoose.Types.ObjectId(examId);

    const performance = await ExamSession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$student',
          examsTaken: { $sum: 1 },
          avgScore: { $avg: '$percentage' },
          totalPassed: { $sum: { $cond: ['$passed', 1, 0] } },
          totalTime: { $sum: { $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'studentInfo',
        },
      },
      { $unwind: '$studentInfo' },
      {
        $project: {
          studentName: '$studentInfo.name',
          studentEmail: '$studentInfo.email',
          examsTaken: 1,
          avgScore: 1,
          passRate: { $multiply: [{ $divide: ['$totalPassed', '$examsTaken'] }, 100] },
          totalTime: { $round: '$totalTime' },
        },
      },
      { $sort: { avgScore: -1 } },
    ]);

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student performance', error: error.message });
  }
});

// Get exam comparison data
router.get('/admin/analytics/exam-comparison', authenticateToken, requireAnyAdminPermission, checkPermission('analytics', 'read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = { status: 'submitted' };
    if (startDate) matchStage.submittedAt = { $gte: new Date(startDate) };
    if (endDate) matchStage.submittedAt = { ...matchStage.submittedAt, $lte: new Date(endDate) };

    const comparison = await ExamSession.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$exam',
          totalSessions: { $sum: 1 },
          avgScore: { $avg: '$percentage' },
          totalPassed: { $sum: { $cond: ['$passed', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'exams',
          localField: '_id',
          foreignField: '_id',
          as: 'examInfo',
        },
      },
      { $unwind: '$examInfo' },
      {
        $project: {
          examTitle: '$examInfo.title',
          totalSessions: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRate: { $round: [{ $multiply: [{ $divide: ['$totalPassed', '$totalSessions'] }, 100] }, 1] },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
    ]);

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exam comparison', error: error.message });
  }
});

// Helper function to convert to CSV
function convertToCSV(sessions) {
  const headers = ['Student Name', 'Student Email', 'Exam Title', 'Score', 'Passed', 'Submitted At'];
  const rows = sessions.map(s => [
    s.student?.name || 'N/A',
    s.student?.email || 'N/A',
    s.exam?.title || 'N/A',
    s.percentage,
    s.passed ? 'Yes' : 'No',
    s.submittedAt,
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

export default router;
