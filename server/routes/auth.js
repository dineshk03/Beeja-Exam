import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';
import { sendEmail } from '../utils/emailService.js';

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [student, admin]
 *                 default: student
 *               batch:
 *                 type: string
 *                 example: Batch-2024-A
 *               studentId:
 *                 type: string
 *                 example: STU001
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: User already exists or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, batch, studentId } = req.body;

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
      batch: batch || '',
      studentId: studentId || '',
    });

    await user.save();

    // Log activity
    await logActivity(user._id, 'register', 'user', user._id, { email, name }, req);

    // Send welcome email (don't block registration if email fails)
    try {
      await sendEmail(user.email, 'welcome', user.name);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('⚠️  Failed to send welcome email:', emailError.message);
      // Continue with registration even if email fails
    }

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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [student, admin]
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is deactivated
 *       500:
 *         description: Server error
 */
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
