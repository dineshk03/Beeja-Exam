import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Create default admin account
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@exam.com' });
    if (!adminExists) {
      const admin = new User({
        email: 'admin@exam.com',
        name: 'Admin User',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'admin',
      });
      await admin.save();
      console.log('✅ Default admin created: admin@exam.com / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// Call after a short delay to ensure DB is connected
setTimeout(createDefaultAdmin, 1000);

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const user = new User({
      email,
      name,
      password, // Will be hashed by pre-save hook
      role: role || 'student', // Default role is student
    });

    await user.save();

    // Log activity
    await logActivity(user._id, 'register', 'user', user._id, { email, name }, req);

    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log activity
    await logActivity(user._id, 'login', 'user', user._id, { email }, req);

    // Generate token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
