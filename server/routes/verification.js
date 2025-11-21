import express from 'express';
import IdentityVerification from '../models/IdentityVerification.js';
import SystemCheck from '../models/SystemCheck.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Submit identity verification
router.post('/verification/identity', authenticateToken, async (req, res) => {
  try {
    const {
      sessionId,
      verificationType,
      documentImageUrl,
      faceImageUrl,
      extractedData,
    } = req.body;

    const verification = new IdentityVerification({
      user: req.user.id,
      session: sessionId,
      verificationType,
      documentImageUrl,
      faceImageUrl,
      extractedData,
      verificationStatus: 'pending',
    });

    await verification.save();
    res.status(201).json(verification);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting verification', error: error.message });
  }
});

// Get user's verification status
router.get('/verification/identity/status', authenticateToken, async (req, res) => {
  try {
    const verification = await IdentityVerification.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.json({ verified: false, status: 'not_verified' });
    }

    res.json({
      verified: verification.verificationStatus === 'verified',
      status: verification.verificationStatus,
      verification,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification status', error: error.message });
  }
});

// Admin: Get pending verifications
router.get('/admin/verifications/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const verifications = await IdentityVerification.find({
      verificationStatus: 'pending',
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(verifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verifications', error: error.message });
  }
});

// Admin: Update verification status
router.put('/admin/verifications/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationStatus, matchScore, failureReason, notes } = req.body;

    const verification = await IdentityVerification.findByIdAndUpdate(
      id,
      {
        verificationStatus,
        matchScore,
        failureReason,
        notes,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      },
      { new: true }
    ).populate('user', 'name email');

    if (!verification) {
      return res.status(404).json({ message: 'Verification not found' });
    }

    res.json(verification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification', error: error.message });
  }
});

// Submit system check
router.post('/verification/system-check', authenticateToken, async (req, res) => {
  try {
    const {
      sessionId,
      checkType,
      systemInfo,
      checks,
      overallStatus,
      warnings,
      errors,
      recommendations,
    } = req.body;

    console.log('System check submission:', { userId: req.user.id, checkType, hasChecks: !!checks });

    const systemCheck = new SystemCheck({
      user: req.user.id,
      session: sessionId || null,
      checkType: checkType || 'pre_exam',
      systemInfo: systemInfo || {},
      systemChecks: checks || {},
      overallStatus: overallStatus || 'passed',
      warnings: warnings || [],
      errorMessages: errors || [],
      recommendations: recommendations || [],
    });

    await systemCheck.save();
    res.status(201).json(systemCheck);
  } catch (error) {
    console.error('Error submitting system check:', error);
    res.status(500).json({ message: 'Error submitting system check', error: error.message, stack: error.stack });
  }
});

// Get latest system check
router.get('/verification/system-check/latest', authenticateToken, async (req, res) => {
  try {
    const systemCheck = await SystemCheck.findOne({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    if (!systemCheck) {
      return res.json({ checked: false });
    }

    res.json({
      checked: true,
      systemCheck,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system check', error: error.message });
  }
});

// Admin: Get system checks for a user
router.get('/admin/users/:userId/system-checks', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const systemChecks = await SystemCheck.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(systemChecks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching system checks', error: error.message });
  }
});

export default router;
