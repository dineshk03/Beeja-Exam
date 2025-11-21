import express from 'express';
import Schedule from '../models/Schedule.js';
import Exam from '../models/Exam.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Debug: Get all schedules without filters (for testing)
router.get('/schedules/debug', authenticateToken, async (req, res) => {
  try {
    const allSchedules = await Schedule.find({})
      .populate('exam', 'title description duration passingScore totalQuestions assignedStudents')
      .sort({ scheduledDate: 1 });
    
    console.log('DEBUG: Total schedules in database:', allSchedules.length);
    allSchedules.forEach(schedule => {
      console.log('Schedule:', {
        id: schedule._id,
        exam: schedule.exam?.title,
        date: schedule.scheduledDate,
        status: schedule.status,
        assignedStudents: schedule.exam?.assignedStudents?.length || 0
      });
    });
    
    res.json({
      total: allSchedules.length,
      schedules: allSchedules,
      currentUser: req.user.id
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all schedules (Admin)
router.get('/admin/schedules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, examId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (examId) filter.exam = examId;

    const schedules = await Schedule.find(filter)
      .populate('exam', 'title description duration questions passingScore category')
      .populate('registeredCandidates', 'name email')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 });

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// Create schedule (Admin)
router.post('/admin/schedules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      examId,
      scheduledDate,
      startTime,
      endTime,
      maxCandidates,
      venue,
      proctorSettings,
    } = req.body;

    console.log('Creating schedule with data:', { examId, scheduledDate, startTime, endTime, userId: req.user.id });

    // Verify exam exists
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const schedule = new Schedule({
      exam: examId,
      scheduledDate,
      startTime,
      endTime,
      maxCandidates: maxCandidates || 50,
      venue: venue || 'Online',
      proctorSettings: proctorSettings || {
        webcamRequired: true,
        screenRecording: false,
        idVerification: true,
        browserLockdown: false,
      },
      createdBy: req.user.id,
    });

    await schedule.save();
    await schedule.populate('exam', 'title description duration');

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Error creating schedule', error: error.message, stack: error.stack });
  }
});

// Update schedule (Admin)
router.put('/admin/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const schedule = await Schedule.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('exam', 'title description duration');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
});

// Delete schedule (Admin)
router.delete('/admin/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting schedule', error: error.message });
  }
});

// Get available schedules for students
router.get('/schedules', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day to include today's schedules
    
    console.log('Fetching schedules for student:', req.user.id);
    console.log('Current date (start of day):', now);
    
    const schedules = await Schedule.find({
      status: 'scheduled',
      scheduledDate: { $gte: now },
    })
      .populate('exam', 'title description duration passingScore totalQuestions assignedStudents')
      .sort({ scheduledDate: 1 });

    console.log('Total schedules found:', schedules.length);

    // Filter schedules where student is assigned to the exam
    const availableSchedules = schedules.filter(schedule => {
      if (!schedule.exam) {
        console.log('Schedule has no exam:', schedule._id);
        return false;
      }
      
      const isAssigned = schedule.exam.assignedStudents.length === 0 || 
                        schedule.exam.assignedStudents.some(id => id.toString() === req.user.id);
      
      console.log(`Schedule ${schedule._id} for exam "${schedule.exam.title}":`, {
        assignedStudents: schedule.exam.assignedStudents.length,
        isOpenToAll: schedule.exam.assignedStudents.length === 0,
        isStudentAssigned: schedule.exam.assignedStudents.some(id => id.toString() === req.user.id),
        result: isAssigned
      });
      
      return isAssigned;
    });

    console.log('Available schedules for student:', availableSchedules.length);
    res.json(availableSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// Register for a schedule
router.post('/schedules/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if already registered
    if (schedule.registeredCandidates.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already registered for this schedule' });
    }

    // Check capacity
    if (schedule.registeredCandidates.length >= schedule.maxCandidates) {
      return res.status(400).json({ message: 'Schedule is full' });
    }

    schedule.registeredCandidates.push(req.user.id);
    await schedule.save();

    res.json({ message: 'Successfully registered for schedule' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering for schedule', error: error.message });
  }
});

// Unregister from a schedule
router.delete('/schedules/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.registeredCandidates = schedule.registeredCandidates.filter(
      candidateId => candidateId.toString() !== req.user.id
    );
    await schedule.save();

    res.json({ message: 'Successfully unregistered from schedule' });
  } catch (error) {
    res.status(500).json({ message: 'Error unregistering from schedule', error: error.message });
  }
});

export default router;
