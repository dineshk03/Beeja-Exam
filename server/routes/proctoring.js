import express from 'express';
import mongoose from 'mongoose';
import ProctorLog from '../models/ProctorLog.js';
import ExamSession from '../models/ExamSession.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Log proctoring event
router.post('/sessions/:sessionId/proctor-log', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { eventType, severity, description, metadata, snapshotUrl } = req.body;

    // Verify session belongs to user
    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const proctorLog = new ProctorLog({
      session: sessionId,
      student: req.user.id,
      exam: session.exam,
      eventType,
      severity: severity || 'low',
      description,
      metadata,
      snapshotUrl,
    });

    await proctorLog.save();
    res.status(201).json({ message: 'Event logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging event', error: error.message });
  }
});

// Get proctor logs for a session (Admin)
router.get('/admin/sessions/:sessionId/proctor-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { severity, eventType } = req.query;

    const filter = { session: sessionId };
    if (severity) filter.severity = severity;
    if (eventType) filter.eventType = eventType;

    const logs = await ProctorLog.find(filter)
      .populate('student', 'name email')
      .sort({ timestamp: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctor logs', error: error.message });
  }
});

// Get proctor logs for a student (Admin)
router.get('/admin/students/:studentId/proctor-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { severity, eventType, limit = 100 } = req.query;

    const filter = { student: studentId };
    if (severity) filter.severity = severity;
    if (eventType) filter.eventType = eventType;

    const logs = await ProctorLog.find(filter)
      .populate('exam', 'title')
      .populate('session', 'startTime endTime')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctor logs', error: error.message });
  }
});

// Get proctor statistics for a session (Admin)
router.get('/admin/sessions/:sessionId/proctor-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await ProctorLog.aggregate([
      { $match: { session: sessionId } },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          severities: { $push: '$severity' },
        },
      },
    ]);

    const severityStats = await ProctorLog.aggregate([
      { $match: { session: sessionId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      eventStats: stats,
      severityStats,
      totalEvents: stats.reduce((sum, s) => sum + s.count, 0),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctor stats', error: error.message });
  }
});

// Get proctor stats for a session (Admin)
router.get('/admin/sessions/:sessionId/proctor-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await ProctorLog.aggregate([
      { $match: { session: mongoose.Types.ObjectId(sessionId) } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ severityStats: stats });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctor stats', error: error.message });
  }
});

// Get live proctoring monitor data (Admin)
router.get('/admin/proctor-monitor', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all ongoing sessions
    const ongoingSessions = await ExamSession.find({
      status: 'in-progress',
    })
      .populate('student', 'name email')
      .populate('exam', 'title duration')
      .select('student exam startTime flagged');

    // Get recent high-severity events for each session
    const sessionsWithAlerts = await Promise.all(
      ongoingSessions.map(async (session) => {
        const recentAlerts = await ProctorLog.find({
          session: session._id,
          severity: { $in: ['high', 'critical'] },
          timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        }).limit(5);

        return {
          session: session._id,
          student: session.student,
          exam: session.exam,
          startTime: session.startTime,
          recentAlerts: recentAlerts.length,
          alerts: recentAlerts,
          flagged: session.flagged || false,
        };
      })
    );

    res.json(sessionsWithAlerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching proctor monitor data', error: error.message });
  }
});

export default router;
