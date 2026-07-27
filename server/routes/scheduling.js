import express from 'express';
import mongoose from 'mongoose';
import Schedule from '../models/Schedule.js';
import Exam from '../models/Exam.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { checkPermission, requireAnyAdminPermission } from '../middleware/permissions.js';

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
        assignedStudents: schedule.exam?.assignedStudents?.length || 0,
        allowedBatches: schedule.allowedBatches?.length || 0,
        registeredCandidates: schedule.registeredCandidates?.length || 0
      });
    });
    
    // Also check user's batch
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id).select('batch');
    
    res.json({
      total: allSchedules.length,
      schedules: allSchedules,
      currentUser: {
        id: req.user.id,
        batch: user?.batch || 'No batch assigned'
      },
      currentTime: new Date().toISOString(),
      currentDate: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all schedules (Admin)
router.get('/admin/schedules', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'read'), async (req, res) => {
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
router.post('/admin/schedules', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'create'), async (req, res) => {
  try {
    const {
      examId,
      scheduledDate,
      startTime,
      endTime,
      maxCandidates,
      venue,
      allowedBatches,
      proctorSettings,
    } = req.body;

    console.log('Creating schedule with data:', { 
      examId, 
      scheduledDate, 
      startTime, 
      endTime, 
      allowedBatches,
      userId: req.user.id 
    });

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
      allowedBatches: allowedBatches || [],
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
router.put('/admin/schedules/:id', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'update'), async (req, res) => {
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
router.delete('/admin/schedules/:id', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'delete'), async (req, res) => {
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

    // Filter schedules using the same access control logic as exam listing
    const availableSchedules = [];
    
    for (const schedule of schedules) {
      if (!schedule.exam) {
        console.log('Schedule has no exam:', schedule._id);
        continue;
      }
      
      // Use the same access control logic as the main exam listing
      const userObjectId = new mongoose.Types.ObjectId(req.user.id);
      
      // Check if student has access to this schedule
      const hasAccess = await checkStudentScheduleAccess(schedule, userObjectId, req.user.id);
      
      console.log(`Schedule ${schedule._id} for exam "${schedule.exam.title}":`, {
        assignedStudents: schedule.exam.assignedStudents?.length || 0,
        registeredCandidates: schedule.registeredCandidates?.length || 0,
        allowedBatches: schedule.allowedBatches?.length || 0,
        hasAccess
      });
      
      if (hasAccess) {
        availableSchedules.push(schedule);
      }
    }
    
    // Helper function to check if student has access to a schedule (same as exams.js)
    async function checkStudentScheduleAccess(schedule, userObjectId, userId) {
      // 1. Check if student is explicitly registered in the schedule
      if (schedule.registeredCandidates && schedule.registeredCandidates.some(id => id.toString() === userId)) {
        return true;
      }
      
      // 2. Check if student is assigned to the exam
      if (schedule.exam && schedule.exam.assignedStudents && schedule.exam.assignedStudents.some(id => id.toString() === userId)) {
        return true;
      }
      
      // 3. Check batch-based access (schedule level)
      if (schedule.allowedBatches && schedule.allowedBatches.length > 0) {
        try {
          const User = (await import('../models/User.js')).default;
          const user = await User.findById(userId).select('batch');
          
          if (user && user.batch && schedule.allowedBatches.includes(user.batch)) {
            return true;
          }
        } catch (error) {
          console.log('Error checking batch access:', error.message);
        }
      }
      
      // 4. Check batch-based access (exam level)
      if (schedule.exam && schedule.exam.batch) {
        try {
          const User = (await import('../models/User.js')).default;
          const user = await User.findById(userId).select('batch');
          
          if (user && user.batch && user.batch === schedule.exam.batch) {
            return true;
          }
        } catch (error) {
          console.log('Error checking exam batch access:', error.message);
        }
      }
      
      // 5. If exam has no restrictions, allow access (open exam)
      const hasNoAssignments = !schedule.exam.assignedStudents || schedule.exam.assignedStudents.length === 0;
      const hasNoRegistrations = !schedule.registeredCandidates || schedule.registeredCandidates.length === 0;
      const hasNoBatchRestrictions = (!schedule.allowedBatches || schedule.allowedBatches.length === 0) && 
                                    (!schedule.exam.batch || schedule.exam.batch === '');
      
      if (hasNoAssignments && hasNoRegistrations && hasNoBatchRestrictions) {
        return true;
      }
      
      return false;
    }

    console.log('Available schedules for student:', availableSchedules.length);
    res.json(availableSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Error fetching schedules', error: error.message });
  }
});

// Quick fix: Update schedule status (Admin)
router.patch('/admin/schedules/:id/status', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('exam', 'title');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    console.log(`Schedule ${schedule._id} status updated to: ${status}`);
    res.json({ message: 'Status updated successfully', schedule });
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});

// Auto-update expired schedules (Admin utility)
router.post('/admin/schedules/update-expired', authenticateToken, requireAnyAdminPermission, checkPermission('scheduling', 'update'), async (req, res) => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Find schedules that have passed their end time + 5 minute grace period
    const expiredSchedules = await Schedule.find({
      status: 'scheduled',
      scheduledDate: { $lte: new Date(currentDate) }
    });
    
    let updatedCount = 0;
    
    for (const schedule of expiredSchedules) {
      const scheduleDate = schedule.scheduledDate.toISOString().split('T')[0];
      
      // Check if schedule is from today and has passed end time (no grace period)
      if (scheduleDate === currentDate) {
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        const endMinutes = endHour * 60 + endMinute; // No grace period
        const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
        
        if (currentMinutes > endMinutes) {
          await Schedule.findByIdAndUpdate(schedule._id, { status: 'completed' });
          updatedCount++;
          console.log(`Auto-updated schedule ${schedule._id} to completed`);
        }
      } else if (scheduleDate < currentDate) {
        // Past dates should definitely be completed
        await Schedule.findByIdAndUpdate(schedule._id, { status: 'completed' });
        updatedCount++;
        console.log(`Auto-updated past schedule ${schedule._id} to completed`);
      }
    }
    
    res.json({ 
      message: `Updated ${updatedCount} expired schedules to completed status`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error updating expired schedules:', error);
    res.status(500).json({ message: 'Error updating expired schedules', error: error.message });
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
