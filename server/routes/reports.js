import express from 'express';
import ExamSession from '../models/ExamSession.js';
import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Batch from '../models/Batch.js';
import ProctorLog from '../models/ProctorLog.js';
import Schedule from '../models/Schedule.js';
import ScheduledReport from '../models/ScheduledReport.js';
import ReportHistory from '../models/ReportHistory.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { checkPermission, requireAnyAdminPermission } from '../middleware/permissions.js';

const router = express.Router();

// Helper function to build date filter
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  return filter;
};

// Student-Wise Report
router.get('/admin/reports/student_wise', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId, batchId } = req.query;
    
    const sessionFilter = buildDateFilter(startDate, endDate);
    // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };
    if (examId && examId !== 'all') sessionFilter.exam = examId;

    let students = await User.find({ role: 'student' });
    if (batchId && batchId !== 'all') {
      students = students.filter(s => s.batch === batchId);
    }

    const reportData = await Promise.all(students.map(async (student) => {
      const sessions = await ExamSession.find({
        ...sessionFilter,
        student: student._id
      });

      const examsTaken = sessions.length;
      const passed = sessions.filter(s => s.passed).length;
      const failed = sessions.filter(s => !s.passed).length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.percentage || 0), 0);
      const avgScore = examsTaken > 0 ? totalScore / examsTaken : 0;
      
      // Calculate average grade
      const grades = sessions.map(s => s.grade).filter(g => g);
      const avgGrade = grades.length > 0 ? grades[0] : 'N/A';

      return {
        studentName: student.name,
        studentEmail: student.email,
        batch: student.batch || 'N/A',
        examsTaken,
        passed,
        failed,
        avgScore: avgScore.toFixed(1) + '%',
        grade: avgGrade
      };
    }));

    res.json(reportData.filter(r => r.examsTaken > 0));
  } catch (error) {
    console.error('Error generating student-wise report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Batch-Wise Report
router.get('/admin/reports/batch_wise', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId } = req.query;
    
    const sessionFilter = buildDateFilter(startDate, endDate);
    // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };
    if (examId && examId !== 'all') sessionFilter.exam = examId;

    const students = await User.find({ role: 'student' });
    const batchMap = {};

    // Group students by batch
    students.forEach(student => {
      const batch = student.batch || 'No Batch';
      if (!batchMap[batch]) {
        batchMap[batch] = [];
      }
      batchMap[batch].push(student._id);
    });

    const reportData = await Promise.all(Object.entries(batchMap).map(async ([batchName, studentIds]) => {
      const sessions = await ExamSession.find({
        ...sessionFilter,
        student: { $in: studentIds }
      }).populate('student', 'name');

      const totalStudents = studentIds.length;
      const examsTaken = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.percentage || 0), 0);
      const avgScore = examsTaken > 0 ? totalScore / examsTaken : 0;
      const passed = sessions.filter(s => s.passed).length;
      const passRate = examsTaken > 0 ? (passed / examsTaken) * 100 : 0;
      
      // Find top performer
      const sortedSessions = sessions.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
      const topPerformer = sortedSessions.length > 0 ? sortedSessions[0].student?.name : 'N/A';

      return {
        batchName,
        totalStudents,
        examsTaken,
        avgScore: avgScore.toFixed(1) + '%',
        passRate: passRate.toFixed(1) + '%',
        topPerformer
      };
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Error generating batch-wise report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Exam-Wise Report
router.get('/admin/reports/exam_wise', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId, batchId } = req.query;
    
    const examFilter = {};
    if (examId && examId !== 'all') examFilter._id = examId;

    const exams = await Exam.find(examFilter);

    const reportData = await Promise.all(exams.map(async (exam) => {
      const sessionFilter = buildDateFilter(startDate, endDate);
      sessionFilter.exam = exam._id;
      // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };

      let sessions = await ExamSession.find(sessionFilter).populate('student', 'batch');
      
      if (batchId && batchId !== 'all') {
        sessions = sessions.filter(s => s.student?.batch === batchId);
      }

      const totalAttempts = sessions.length;
      const passed = sessions.filter(s => s.passed).length;
      const failed = sessions.filter(s => !s.passed).length;
      const scores = sessions.map(s => s.percentage || 0);
      const avgScore = totalAttempts > 0 ? scores.reduce((a, b) => a + b, 0) / totalAttempts : 0;
      const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
      const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;

      return {
        examTitle: exam.title,
        totalAttempts,
        passed,
        failed,
        avgScore: avgScore.toFixed(1) + '%',
        highestScore: highestScore.toFixed(1) + '%',
        lowestScore: lowestScore.toFixed(1) + '%'
      };
    }));

    res.json(reportData.filter(r => r.totalAttempts > 0));
  } catch (error) {
    console.error('Error generating exam-wise report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Pass/Fail Report
router.get('/admin/reports/pass_fail', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId, batchId, status } = req.query;
    
    const sessionFilter = buildDateFilter(startDate, endDate);
    // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };
    if (examId && examId !== 'all') sessionFilter.exam = examId;
    
    // Filter by pass/fail status
    if (status === 'passed') sessionFilter.passed = true;
    if (status === 'failed') sessionFilter.passed = false;

    let sessions = await ExamSession.find(sessionFilter)
      .populate('student', 'name email batch')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });

    if (batchId && batchId !== 'all') {
      sessions = sessions.filter(s => s.student?.batch === batchId);
    }

    const reportData = sessions.map(session => ({
      studentName: session.student?.name || 'N/A',
      exam: session.exam?.title || 'N/A',
      score: (session.percentage || 0).toFixed(1) + '%',
      status: session.passed ? 'Passed' : 'Failed',
      grade: session.grade || 'N/A',
      date: session.submittedAt ? new Date(session.submittedAt).toLocaleDateString() : 'N/A'
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Error generating pass/fail report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Student Performance Report
router.get('/admin/reports/student_performance', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId, batchId } = req.query;
    
    const sessionFilter = buildDateFilter(startDate, endDate);
    if (examId && examId !== 'all') sessionFilter.exam = examId;

    let students = await User.find({ role: 'student' });
    if (batchId && batchId !== 'all') {
      students = students.filter(s => s.batch === batchId);
    }

    const reportData = await Promise.all(students.map(async (student) => {
      const sessions = await ExamSession.find({
        ...sessionFilter,
        student: student._id,
        status: { $in: ['submitted', 'completed'] }
      });

      const examsTaken = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = examsTaken > 0 ? totalScore / examsTaken : 0;
      const passed = sessions.filter(s => s.passed).length;
      const passRate = examsTaken > 0 ? (passed / examsTaken) * 100 : 0;
      const totalTime = sessions.reduce((sum, s) => {
        if (s.startTime && s.submittedAt) {
          return sum + Math.floor((new Date(s.submittedAt) - new Date(s.startTime)) / 60000);
        }
        return sum;
      }, 0);

      return {
        studentName: student.name,
        studentEmail: student.email,
        studentId: student.studentId,
        examsTaken,
        avgScore: avgScore.toFixed(1),
        passRate: passRate.toFixed(1),
        totalTime,
        status: passRate >= 70 ? 'Excellent' : passRate >= 50 ? 'Average' : 'Needs Improvement'
      };
    }));

    res.json(reportData.filter(r => r.examsTaken > 0));
  } catch (error) {
    console.error('Error generating student performance report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Exam Summary Report
router.get('/admin/reports/exam_summary', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId } = req.query;
    
    const examFilter = {};
    if (examId && examId !== 'all') examFilter._id = examId;

    const exams = await Exam.find(examFilter);

    const reportData = await Promise.all(exams.map(async (exam) => {
      const sessionFilter = buildDateFilter(startDate, endDate);
      sessionFilter.exam = exam._id;
      // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };

      const sessions = await ExamSession.find(sessionFilter);
      
      const totalAttempts = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
      const passed = sessions.filter(s => s.passed).length;
      const passRate = totalAttempts > 0 ? (passed / totalAttempts) * 100 : 0;

      return {
        examTitle: exam.title,
        examId: exam._id,
        totalAttempts,
        avgScore: avgScore.toFixed(1),
        passRate: passRate.toFixed(1),
        duration: exam.duration,
        passingScore: exam.passingScore,
        totalQuestions: exam.questions?.length || 0
      };
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Error generating exam summary report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Batch Analysis Report
router.get('/admin/reports/batch_analysis', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, batchId } = req.query;
    
    const batchFilter = {};
    if (batchId && batchId !== 'all') batchFilter._id = batchId;

    const batches = await Batch.find(batchFilter);

    const reportData = await Promise.all(batches.map(async (batch) => {
      const students = await User.find({ role: 'student', batch: batch._id });
      const studentIds = students.map(s => s._id);

      const sessionFilter = buildDateFilter(startDate, endDate);
      sessionFilter.student = { $in: studentIds };
      // Include both submitted and completed sessions for reports
      sessionFilter.status = { $in: ['submitted', 'completed'] };

      const sessions = await ExamSession.find(sessionFilter);
      
      const totalSessions = sessions.length;
      const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
      const avgScore = totalSessions > 0 ? totalScore / totalSessions : 0;
      const passed = sessions.filter(s => s.passed).length;
      const passRate = totalSessions > 0 ? (passed / totalSessions) * 100 : 0;
      const completionRate = students.length > 0 ? (sessions.length / students.length) * 100 : 0;

      return {
        batchName: batch.name,
        batchId: batch._id,
        totalStudents: students.length,
        totalSessions,
        avgScore: avgScore.toFixed(1),
        passRate: passRate.toFixed(1),
        completionRate: completionRate.toFixed(1)
      };
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Error generating batch analysis report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Attendance Report
router.get('/admin/reports/attendance', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, batchId } = req.query;
    
    let students = await User.find({ role: 'student' });
    if (batchId && batchId !== 'all') {
      students = students.filter(s => s.batch === batchId);
    }

    const scheduleFilter = buildDateFilter(startDate, endDate);
    const schedules = await Schedule.find(scheduleFilter).populate('exam');

    const reportData = await Promise.all(students.map(async (student) => {
      const scheduledExams = schedules.filter(s => 
        s.registeredCandidates.includes(student._id)
      ).length;

      const sessionFilter = buildDateFilter(startDate, endDate);
      sessionFilter.student = student._id;
      const attendedSessions = await ExamSession.countDocuments(sessionFilter);

      const missed = scheduledExams - attendedSessions;
      const attendanceRate = scheduledExams > 0 ? (attendedSessions / scheduledExams) * 100 : 0;

      return {
        studentName: student.name,
        studentEmail: student.email,
        scheduledExams,
        attended: attendedSessions,
        missed: missed > 0 ? missed : 0,
        attendanceRate: attendanceRate.toFixed(1)
      };
    }));

    res.json(reportData.filter(r => r.scheduledExams > 0));
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Proctoring Report
router.get('/admin/reports/proctoring', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId } = req.query;
    
    const logFilter = buildDateFilter(startDate, endDate);
    if (examId && examId !== 'all') logFilter.exam = examId;

    const logs = await ProctorLog.find(logFilter)
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ timestamp: -1 });

    const reportData = logs.map(log => ({
      studentName: log.student?.name || 'Unknown',
      studentEmail: log.student?.email || 'N/A',
      examTitle: log.exam?.title || 'Unknown',
      eventType: log.eventType,
      severity: log.severity,
      description: log.description,
      timestamp: log.timestamp,
      status: log.severity === 'critical' ? 'Flagged' : log.severity === 'high' ? 'Warning' : 'Noted'
    }));

    res.json(reportData);
  } catch (error) {
    console.error('Error generating proctoring report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Time Analysis Report
router.get('/admin/reports/time_analysis', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId, batchId } = req.query;
    
    let students = await User.find({ role: 'student' });
    if (batchId && batchId !== 'all') {
      students = students.filter(s => s.batch === batchId);
    }

    const reportData = await Promise.all(students.map(async (student) => {
      const sessionFilter = buildDateFilter(startDate, endDate);
      sessionFilter.student = student._id;
      // Include both submitted and completed sessions for reports
      sessionFilter.status = { $in: ['submitted', 'completed'] };
      if (examId && examId !== 'all') sessionFilter.exam = examId;

      const sessions = await ExamSession.find(sessionFilter).populate('exam');

      const totalTime = sessions.reduce((sum, s) => {
        if (s.startTime && s.submittedAt) {
          return sum + Math.floor((new Date(s.submittedAt) - new Date(s.startTime)) / 60000);
        }
        return sum;
      }, 0);

      const avgTimePerExam = sessions.length > 0 ? totalTime / sessions.length : 0;
      
      // Calculate efficiency (time vs expected duration)
      const expectedTime = sessions.reduce((sum, s) => sum + (s.exam?.duration || 0), 0);
      const efficiency = expectedTime > 0 ? ((expectedTime - totalTime) / expectedTime * 100) : 0;

      return {
        studentName: student.name,
        studentEmail: student.email,
        totalExams: sessions.length,
        totalTime,
        avgTimePerExam: avgTimePerExam.toFixed(1),
        efficiencyScore: Math.max(0, efficiency).toFixed(1)
      };
    }));

    res.json(reportData.filter(r => r.totalExams > 0));
  } catch (error) {
    console.error('Error generating time analysis report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Question Analysis Report
router.get('/admin/reports/question_analysis', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate, examId } = req.query;
    
    const sessionFilter = buildDateFilter(startDate, endDate);
    // Include both submitted and completed sessions for reports
    sessionFilter.status = { $in: ['submitted', 'completed'] };
    if (examId && examId !== 'all') sessionFilter.exam = examId;

    const sessions = await ExamSession.find(sessionFilter);

    // Aggregate question statistics
    const questionStats = {};

    sessions.forEach(session => {
      if (session.answers) {
        session.answers.forEach(answer => {
          const qId = answer.questionId?.toString();
          if (!qId) return;

          if (!questionStats[qId]) {
            questionStats[qId] = {
              attempts: 0,
              correct: 0,
              totalTime: 0,
              questionText: answer.questionText || 'Unknown'
            };
          }

          questionStats[qId].attempts++;
          if (answer.isCorrect) questionStats[qId].correct++;
          if (answer.timeSpent) questionStats[qId].totalTime += answer.timeSpent;
        });
      }
    });

    const reportData = Object.entries(questionStats).map(([qId, stats]) => {
      const correctRate = (stats.correct / stats.attempts) * 100;
      const avgTime = stats.totalTime / stats.attempts;
      
      let difficulty = 'Easy';
      if (correctRate < 40) difficulty = 'Hard';
      else if (correctRate < 70) difficulty = 'Medium';

      return {
        questionId: qId,
        questionText: stats.questionText,
        attempts: stats.attempts,
        correctRate: correctRate.toFixed(1),
        avgTime: avgTime.toFixed(1),
        difficulty
      };
    });

    res.json(reportData);
  } catch (error) {
    console.error('Error generating question analysis report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// Comprehensive Report
router.get('/admin/reports/comprehensive', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get all report data
    const [studentPerf, examSummary, batchAnalysis, attendance, proctoring, timeAnalysis] = await Promise.all([
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/student_performance?${new URLSearchParams(req.query)}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/exam_summary?${new URLSearchParams(req.query)}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/batch_analysis?${new URLSearchParams(req.query)}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/attendance?${new URLSearchParams(req.query)}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/proctoring?${new URLSearchParams(req.query)}`).then(r => r.json()),
      fetch(`${req.protocol}://${req.get('host')}/api/admin/reports/time_analysis?${new URLSearchParams(req.query)}`).then(r => r.json())
    ]);

    const comprehensiveData = {
      generatedAt: new Date(),
      dateRange: { startDate, endDate },
      studentPerformance: studentPerf,
      examSummary: examSummary,
      batchAnalysis: batchAnalysis,
      attendance: attendance,
      proctoring: proctoring,
      timeAnalysis: timeAnalysis,
      summary: {
        totalStudents: studentPerf.length,
        totalExams: examSummary.length,
        totalBatches: batchAnalysis.length,
        totalProctoringIncidents: proctoring.length
      }
    };

    res.json(comprehensiveData);
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({ message: 'Error generating report', error: error.message });
  }
});

// CSV Export helper
function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] == null ? '' : String(row[h]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    )
  ];
  return lines.join('\r\n');
}

// Generic CSV export endpoint — reuses existing report logic via an internal fetch
router.get('/admin/reports/:type/export', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['student_wise', 'batch_wise', 'exam_wise', 'pass_fail', 'student_performance', 'exam_summary', 'batch_analysis', 'attendance', 'proctoring', 'time_analysis', 'question_analysis'];
    if (!validTypes.includes(type)) return res.status(400).json({ message: 'Invalid report type' });

    const queryString = new URLSearchParams(req.query).toString();
    const internalUrl = `${req.protocol}://${req.get('host')}/api/admin/reports/${type}${queryString ? '?' + queryString : ''}`;
    const internalRes = await fetch(internalUrl, {
      headers: { Authorization: req.headers.authorization }
    });
    const data = await internalRes.json();

    if (!Array.isArray(data)) return res.status(500).json({ message: 'Could not generate report data' });

    const csv = toCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
});

// Scheduled Reports Management

// Get all scheduled reports
router.get('/admin/scheduled-reports', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const scheduledReports = await ScheduledReport.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(scheduledReports);
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    res.status(500).json({ message: 'Error fetching scheduled reports', error: error.message });
  }
});

// Create scheduled report
router.post('/admin/scheduled-reports', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const scheduledReport = new ScheduledReport({
      ...req.body,
      createdBy: req.user.id
    });
    
    await scheduledReport.save();
    res.status(201).json(scheduledReport);
  } catch (error) {
    console.error('Error creating scheduled report:', error);
    res.status(500).json({ message: 'Error creating scheduled report', error: error.message });
  }
});

// Update scheduled report
router.put('/admin/scheduled-reports/:id', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const scheduledReport = await ScheduledReport.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!scheduledReport) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    res.json(scheduledReport);
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    res.status(500).json({ message: 'Error updating scheduled report', error: error.message });
  }
});

// Delete scheduled report
router.delete('/admin/scheduled-reports/:id', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const scheduledReport = await ScheduledReport.findByIdAndDelete(req.params.id);
    
    if (!scheduledReport) {
      return res.status(404).json({ message: 'Scheduled report not found' });
    }
    
    res.json({ message: 'Scheduled report deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({ message: 'Error deleting scheduled report', error: error.message });
  }
});

// Report History Management

// Get report history
router.get('/admin/report-history', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const history = await ReportHistory.find()
      .populate('generatedBy', 'name email')
      .populate('scheduledReportId', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    const total = await ReportHistory.countDocuments();
    
    res.json({
      history,
      total,
      hasMore: total > (parseInt(skip) + parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ message: 'Error fetching report history', error: error.message });
  }
});

// Create report history entry
router.post('/admin/report-history', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const historyEntry = new ReportHistory({
      ...req.body,
      generatedBy: req.user.id
    });
    
    await historyEntry.save();
    res.status(201).json(historyEntry);
  } catch (error) {
    console.error('Error creating report history:', error);
    res.status(500).json({ message: 'Error creating report history', error: error.message });
  }
});

// Delete report history entry
router.delete('/admin/report-history/:id', authenticateToken, requireAnyAdminPermission, checkPermission('reports', 'read'), async (req, res) => {
  try {
    const historyEntry = await ReportHistory.findByIdAndDelete(req.params.id);
    
    if (!historyEntry) {
      return res.status(404).json({ message: 'Report history entry not found' });
    }
    
    res.json({ message: 'Report history entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting report history:', error);
    res.status(500).json({ message: 'Error deleting report history', error: error.message });
  }
});

export default router;
