import express from 'express';
import Batch from '../models/Batch.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    // Get student count for each batch
    const batchesWithCount = await Promise.all(
      batches.map(async (batch) => {
        const studentCount = await User.countDocuments({ 
          role: 'student', 
          batch: batch.name 
        });
        return {
          ...batch.toObject(),
          studentCount,
        };
      })
    );
    
    res.json(batchesWithCount);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get single batch
router.get('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Get students in this batch
    const students = await User.find({ 
      role: 'student', 
      batch: batch.name 
    }).select('-password');
    
    res.json({ batch, students });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// Create new batch
router.post('/', async (req, res) => {
  try {
    const { name, description, year, department, startDate, endDate } = req.body;
    
    // Check if batch name already exists
    const existingBatch = await Batch.findOne({ name });
    if (existingBatch) {
      return res.status(400).json({ error: 'Batch name already exists' });
    }
    
    const batch = new Batch({
      name,
      description,
      year,
      department,
      startDate,
      endDate,
      createdBy: req.user.id,
    });
    
    await batch.save();
    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// Update batch
router.put('/:id', async (req, res) => {
  try {
    const { name, description, year, department, startDate, endDate, isActive } = req.body;
    
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // If name is being changed, check for duplicates
    if (name && name !== batch.name) {
      const existingBatch = await Batch.findOne({ name });
      if (existingBatch) {
        return res.status(400).json({ error: 'Batch name already exists' });
      }
      
      // Update all students with old batch name to new batch name
      await User.updateMany(
        { batch: batch.name },
        { batch: name }
      );
    }
    
    if (name) batch.name = name;
    if (description !== undefined) batch.description = description;
    if (year !== undefined) batch.year = year;
    if (department !== undefined) batch.department = department;
    if (startDate) batch.startDate = startDate;
    if (endDate) batch.endDate = endDate;
    if (isActive !== undefined) batch.isActive = isActive;
    
    await batch.save();
    res.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// Delete batch
router.delete('/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    // Check if any students are assigned to this batch
    const studentCount = await User.countDocuments({ 
      role: 'student', 
      batch: batch.name 
    });
    
    if (studentCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete batch. ${studentCount} student(s) are assigned to this batch.`,
        studentCount 
      });
    }
    
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Get batch statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const students = await User.find({ 
      role: 'student', 
      batch: batch.name 
    });
    
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.isActive).length;
    const inactiveStudents = students.filter(s => !s.isActive).length;
    
    res.json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      batchName: batch.name,
    });
  } catch (error) {
    console.error('Error fetching batch stats:', error);
    res.status(500).json({ error: 'Failed to fetch batch statistics' });
  }
});

export default router;
