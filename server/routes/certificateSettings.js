import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import CertificateSettings from '../models/CertificateSettings.js';
import ExamSession from '../models/ExamSession.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use environment variable for upload path in production (e.g., AWS EFS mount)
    const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
    const uploadPath = path.join(baseUploadPath, 'certificates');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const type = req.body.type || 'certificate';
    const subType = req.body.subType || 'asset';
    const filename = `${type}-${subType}-${uniqueSuffix}${path.extname(file.originalname)}`;
    console.log('Generated filename:', filename, 'for type:', type, 'subType:', subType);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get certificate settings
router.get('/admin/certificate-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let settings = await CertificateSettings.findOne({ isDefault: true });
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new CertificateSettings({ isDefault: true });
      await settings.save();
      console.log('Created default certificate settings');
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching certificate settings:', error);
    res.status(500).json({ message: 'Error fetching certificate settings', error: error.message });
  }
});

// Update certificate settings
router.post('/admin/certificate-settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Updating certificate settings with data:', req.body);
    
    let settings = await CertificateSettings.findOne({ isDefault: true });
    
    if (!settings) {
      // Create new settings if none exist
      settings = new CertificateSettings({ ...req.body, isDefault: true });
    } else {
      // Update existing settings
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && req.body[key] !== null && !Array.isArray(req.body[key])) {
          // Handle nested objects (logos, signatures, qrCodeSettings, colors)
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          // Handle primitive values
          settings[key] = req.body[key];
        }
      });
    }
    
    await settings.save();
    console.log('Certificate settings saved successfully');
    
    res.json({ 
      message: 'Certificate settings updated successfully', 
      settings: settings 
    });
  } catch (error) {
    console.error('Error updating certificate settings:', error);
    res.status(500).json({ message: 'Error updating certificate settings', error: error.message });
  }
});

// Test endpoint to verify database connection
router.get('/admin/certificate-settings/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await CertificateSettings.countDocuments();
    const settings = await CertificateSettings.findOne({ isDefault: true });
    
    res.json({
      message: 'Database connection working',
      documentsCount: count,
      hasDefaultSettings: !!settings,
      settingsId: settings?._id
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ message: 'Database connection failed', error: error.message });
  }
});

// Reset settings to Beeja Academy defaults
router.post('/admin/certificate-settings/reset-defaults', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const beejaDefaults = {
      companyName: 'Beeja Academy',
      companyTagline: 'Excellence in Education',
      certificateTitle: 'CERTIFICATE',
      coursePrefix: '',
      courseName: '',
      academicCredit: '',
      'logos.company': null,
      'signatures.signature1.name': 'Director',
      'signatures.signature1.title': 'Director',
      'signatures.signature1.organization': 'Beeja Academy',
      'signatures.signature1.image': null,
      'signatures.signature2.name': '',
      'signatures.signature2.title': '',
      'signatures.signature2.organization': '',
      'signatures.signature2.image': null,
      'qrCodeSettings.verificationUrl': 'https://www.beejaacademy.com',
      'colors.primary': '#00bcd4',
      'colors.secondary': '#006064',
      'colors.text': '#1a1a2e',
      isDefault: true,
    };

    let settings = await CertificateSettings.findOne({ isDefault: true });
    if (!settings) {
      settings = new CertificateSettings({ isDefault: true });
    }
    Object.keys(beejaDefaults).forEach(key => {
      if (key.includes('.')) {
        const [parent, child, grandchild] = key.split('.');
        if (grandchild) {
          if (!settings[parent]) settings[parent] = {};
          if (!settings[parent][child]) settings[parent][child] = {};
          settings[parent][child][grandchild] = beejaDefaults[key];
        } else {
          if (!settings[parent]) settings[parent] = {};
          settings[parent][child] = beejaDefaults[key];
        }
      } else {
        settings[key] = beejaDefaults[key];
      }
    });
    settings.markModified('logos');
    settings.markModified('signatures');
    settings.markModified('qrCodeSettings');
    settings.markModified('colors');
    await settings.save();
    res.json({ message: 'Reset to Beeja Academy defaults successfully', settings });
  } catch (error) {
    console.error('Error resetting certificate settings:', error);
    res.status(500).json({ message: 'Error resetting settings', error: error.message });
  }
});

// Get certificate settings for students (public endpoint for certificate generation)
router.get('/certificate-settings', async (req, res) => {
  try {
    const settings = await CertificateSettings.findOne({ isDefault: true });
    
    if (!settings) {
      return res.status(404).json({ message: 'Certificate settings not found' });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching certificate settings for students:', error);
    res.status(500).json({ message: 'Error fetching certificate settings', error: error.message });
  }
});

// Upload certificate assets (logos, signatures, backgrounds)
router.post('/admin/upload-certificate-asset', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received:', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/certificates/${req.file.filename}`;
    
    // Check if file actually exists
    const filePath = path.join(__dirname, '../uploads/certificates', req.file.filename);
    const fileExists = fs.existsSync(filePath);
    
    console.log('File upload result:', {
      filename: req.file.filename,
      url: fileUrl,
      filePath: filePath,
      fileExists: fileExists,
      type: req.body.type,
      subType: req.body.subType
    });
    
    res.json({
      message: 'File uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      type: req.body.type,
      subType: req.body.subType,
      fileExists: fileExists
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Debug endpoint to check uploaded files
router.get('/admin/certificate-files/debug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/certificates');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({
        message: 'Uploads directory does not exist',
        directory: uploadsDir,
        files: []
      });
    }
    
    const files = fs.readdirSync(uploadsDir);
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        url: `/uploads/certificates/${filename}`
      };
    });
    
    res.json({
      message: 'Files in uploads directory',
      directory: uploadsDir,
      totalFiles: files.length,
      files: fileDetails
    });
  } catch (error) {
    console.error('Error checking files:', error);
    res.status(500).json({ message: 'Error checking files', error: error.message });
  }
});

// Generate QR Code — student-accessible (own session only) and admin
router.post('/generate-qr-code', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    const settings = await CertificateSettings.findOne({ isDefault: true });
    const verificationUrl = `${settings?.qrCodeSettings?.verificationUrl || 'https://www.beejaacademy.com'}/verify/${sessionId}`;
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, { width: 200, margin: 2 });
    res.json({ qrCode: qrCodeDataURL, verificationUrl, sessionId });
  } catch (error) {
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
});

// Generate QR Code for certificate verification
router.post('/admin/generate-qr-code', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId, studentId, examId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    // Get current certificate settings from database
    const settings = await CertificateSettings.findOne({ isDefault: true });
    
    if (!settings) {
      return res.status(404).json({ message: 'Certificate settings not found in database' });
    }

    const verificationUrl = `${settings.qrCodeSettings.verificationUrl}/verify/${sessionId}`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(verificationUrl, {
      width: settings.qrCodeSettings.size === 'small' ? 150 : 
             settings.qrCodeSettings.size === 'large' ? 250 : 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    res.json({
      qrCode: qrCodeDataURL,
      verificationUrl,
      sessionId
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
});

// Clear all certificate settings (admin only)
router.delete('/admin/certificate-settings/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await CertificateSettings.deleteMany({});
    console.log('Cleared all certificate settings from database');
    
    res.json({
      message: 'All certificate settings cleared from database',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing certificate settings:', error);
    res.status(500).json({ message: 'Error clearing certificate settings', error: error.message });
  }
});

// Reset to default certificate settings (admin only)
router.post('/admin/certificate-settings/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Clear existing settings
    await CertificateSettings.deleteMany({});
    
    // Create fresh default settings
    const defaultSettings = new CertificateSettings({ isDefault: true });
    await defaultSettings.save();
    
    console.log('Reset certificate settings to database defaults');
    
    res.json({
      message: 'Certificate settings reset to database defaults',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting certificate settings:', error);
    res.status(500).json({ message: 'Error resetting certificate settings', error: error.message });
  }
});

// Verify certificate endpoint
router.get('/verify/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // In a real application, you would fetch the exam session from database
    // const session = await ExamSession.findById(sessionId).populate('student exam');
    
    // For now, return a simple verification response
    res.json({
      valid: true,
      sessionId,
      message: 'Certificate is valid and verified',
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Error verifying certificate', error: error.message });
  }
});

// Get certificate template with settings applied
router.get('/admin/certificate-template/:sessionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // In a real application, fetch the exam session data
    // const session = await ExamSession.findById(sessionId).populate('student exam');
    
    // Generate QR code for this certificate
    const qrCodeDataURL = await QRCode.toDataURL(
      `${certificateSettings.qrCodeSettings.verificationUrl}/verify/${sessionId}`,
      {
        width: certificateSettings.qrCodeSettings.size === 'small' ? 150 : 
               certificateSettings.qrCodeSettings.size === 'large' ? 250 : 200,
        margin: 2
      }
    );

    res.json({
      settings: certificateSettings,
      qrCode: qrCodeDataURL,
      sessionId,
      // session: session // In real app, include session data
    });
  } catch (error) {
    console.error('Error generating certificate template:', error);
    res.status(500).json({ message: 'Error generating certificate template', error: error.message });
  }
});

// Bulk certificate generation
router.post('/admin/generate-bulk-certificates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { sessionIds } = req.body;
    
    if (!sessionIds || !Array.isArray(sessionIds)) {
      return res.status(400).json({ message: 'Session IDs array is required' });
    }

    const certificates = [];
    
    for (const sessionId of sessionIds) {
      // Generate QR code for each certificate
      const qrCodeDataURL = await QRCode.toDataURL(
        `${certificateSettings.qrCodeSettings.verificationUrl}/verify/${sessionId}`,
        {
          width: 200,
          margin: 2
        }
      );
      
      certificates.push({
        sessionId,
        qrCode: qrCodeDataURL,
        settings: certificateSettings
      });
    }

    res.json({
      message: `Generated ${certificates.length} certificates`,
      certificates
    });
  } catch (error) {
    console.error('Error generating bulk certificates:', error);
    res.status(500).json({ message: 'Error generating bulk certificates', error: error.message });
  }
});

// Generate and download a PDF certificate for a passed exam session
router.get('/certificates/:sessionId/download', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ExamSession.findById(sessionId)
      .populate('student', 'name email')
      .populate('exam', 'title passingScore');

    if (!session) return res.status(404).json({ message: 'Session not found' });

    const studentId = session.student._id ? session.student._id.toString() : session.student.toString();
    const isOwner = studentId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Unauthorized' });

    if (!session.passed) return res.status(400).json({ message: 'Certificate only available for passed exams' });

    const settings = await CertificateSettings.findOne({ isDefault: true }) || {};
    const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../uploads');
    const verificationUrl = `${settings.qrCodeSettings?.verificationUrl || 'https://www.beejaacademy.com'}/verify/${sessionId}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 120, margin: 1 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    // Helper: resolve /uploads/... path to local file buffer
    const loadImageBuffer = (urlPath) => {
      if (!urlPath) return null;
      try {
        const localPath = path.join(baseUploadPath, urlPath.replace(/^\/uploads\//, ''));
        if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
      } catch (_) {}
      return null;
    };

    const logoBuffer = loadImageBuffer(settings.logos?.company);
    const sig1ImageBuffer = loadImageBuffer(settings.signatures?.signature1?.image);

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${sessionId}.pdf"`);
    doc.pipe(res);

    const teal = '#00bcd4';
    const tealDark = '#006064';
    const purple = '#6d28d9';
    const darkText = '#1a1a2e';
    const W = doc.page.width;
    const H = doc.page.height;
    const pad = 28;

    // White background
    doc.rect(0, 0, W, H).fill('white');

    // Teal outer border
    doc.rect(0, 0, W, H).lineWidth(2).stroke(teal);

    // Corner bracket decorations (L-shapes)
    const cOff = 10, cLen = 20, cW = 2.5;
    doc.moveTo(cOff, cOff + cLen).lineTo(cOff, cOff).lineTo(cOff + cLen, cOff).lineWidth(cW).stroke(teal);
    doc.moveTo(W - cOff - cLen, cOff).lineTo(W - cOff, cOff).lineTo(W - cOff, cOff + cLen).lineWidth(cW).stroke(teal);
    doc.moveTo(cOff, H - cOff - cLen).lineTo(cOff, H - cOff).lineTo(cOff + cLen, H - cOff).lineWidth(cW).stroke(teal);
    doc.moveTo(W - cOff - cLen, H - cOff).lineTo(W - cOff, H - cOff).lineTo(W - cOff, H - cOff - cLen).lineWidth(cW).stroke(teal);

    // Faint watermark text
    const companyWm = settings.companyName || 'Beeja Academy';
    doc.save();
    doc.opacity(0.04);
    doc.fontSize(62).fillColor(teal).font('Helvetica-Bold');
    doc.text(companyWm, 0, H / 2 - 36, { align: 'center', width: W, lineBreak: false });
    doc.restore();

    // ── Header row ──
    const issuedDate = session.submittedAt || session.createdAt || new Date();
    const d = new Date(issuedDate);
    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const certIdText = `Certificate ID: BA-${sessionId.slice(-8).toUpperCase()}`;
    const issuedText = `Issued on: ${datePart}, ${timePart}`;

    doc.fontSize(8).fillColor('#666666').font('Helvetica')
      .text(certIdText, pad, pad + 8);
    doc.fontSize(8).fillColor('#666666').font('Helvetica')
      .text(issuedText, W - pad - 150, pad + 8);

    // Company logo + name (centered in header)
    const companyName = settings.companyName || 'Beeja Academy';
    const headerCenterX = W / 2;
    let logoW = 0;
    if (logoBuffer) {
      logoW = 28;
      doc.image(logoBuffer, headerCenterX - 60, pad, { height: logoW, fit: [logoW, logoW] });
    }
    const nameX = logoBuffer ? headerCenterX - 60 + logoW + 6 : 0;
    if (logoBuffer) {
      doc.fontSize(18).fillColor(darkText).font('Helvetica-Bold')
        .text(companyName, nameX, pad + 4, { lineBreak: false });
    } else {
      doc.fontSize(18).fillColor(darkText).font('Helvetica-Bold')
        .text(companyName, 0, pad, { align: 'center', width: W });
    }

    // ── CERTIFICATE title ──
    const certTitle = (settings.certificateTitle || 'CERTIFICATE').split(' ')[0];
    doc.fontSize(38).fillColor(darkText).font('Helvetica-Bold')
      .text(certTitle, 0, pad + 38, { align: 'center', width: W, characterSpacing: 7 });

    // ── Decorative dots ──
    const dotY = pad + 90;
    const dotColors = [tealDark, '#00838f', '#26c6da', '#80deea'];
    const dotGap = 11;
    let dotX = W / 2 - (dotColors.length * dotGap) / 2 + dotGap / 2;
    dotColors.forEach(c => {
      doc.circle(dotX, dotY, 4).fill(c);
      dotX += dotGap;
    });

    // ── Subtitle ──
    doc.fontSize(9).fillColor('#333333').font('Helvetica-Bold')
      .text('THIS CERTIFICATE IS PRESENTED TO', 0, dotY + 12, { align: 'center', width: W, characterSpacing: 2 });

    // ── Student name ──
    const studentName = session.student?.name || 'Student';
    doc.fontSize(32).fillColor(purple).font('Helvetica-Oblique')
      .text(studentName, 0, dotY + 28, { align: 'center', width: W });

    // ── Teal underline ──
    const nameY = dotY + 70;
    const lineLen = Math.min(Math.max(studentName.length * 11, 100), 200);
    doc.moveTo(W / 2 - lineLen / 2, nameY).lineTo(W / 2 + lineLen / 2, nameY).lineWidth(1.5).stroke(teal);

    // ── Body text ──
    const coursePrefix = settings.coursePrefix || '';
    const courseName = settings.courseName || '';
    const examTitle = session.exam?.title || 'Course';
    let bodyY = nameY + 12;

    doc.fontSize(10).fillColor('#444444').font('Helvetica')
      .text('has successfully completed online training on', 0, bodyY, { align: 'center', width: W });
    bodyY += 18;

    const mainCourse = coursePrefix || examTitle;
    doc.fontSize(15).fillColor(teal).font('Helvetica-Bold')
      .text(mainCourse, 0, bodyY, { align: 'center', width: W });
    bodyY += 22;

    if (coursePrefix && courseName) {
      doc.fontSize(10).fillColor('#444444').font('Helvetica')
        .text('and real-time project training on', 0, bodyY, { align: 'center', width: W });
      bodyY += 18;
      doc.fontSize(13).fillColor(teal).font('Helvetica-Bold')
        .text(courseName, 0, bodyY, { align: 'center', width: W });
    }

    // ── Footer: QR | website+email | signature ──
    const footerY = H - 72;
    const qrSize = 50;

    // QR code (left)
    if (settings.qrCodeSettings?.enabled !== false) {
      doc.image(qrBuffer, pad, footerY - qrSize + 6, { width: qrSize });
      doc.fontSize(7).fillColor('#888888').font('Helvetica')
        .text('Scan to Verify', pad, footerY - qrSize + 6 + qrSize + 2, { width: qrSize, align: 'center' });
    }

    // Center: website + email
    const webText = (settings.qrCodeSettings?.verificationUrl || 'https://www.beejaacademy.com').replace(/^https?:\/\//, '');
    const emailText = 'info@beejaacademy.com';
    doc.fontSize(10).fillColor(teal).font('Helvetica')
      .text(webText, 0, footerY - 8, { align: 'center', width: W });
    doc.fontSize(9).fillColor('#888888').font('Helvetica')
      .text(emailText, 0, footerY + 6, { align: 'center', width: W });

    // Signature (right)
    const sig1 = settings.signatures?.signature1 || {};
    const sigBlockW = 140;
    const sigX = W - pad - sigBlockW;
    const sigLineY = footerY + 4;

    if (sig1ImageBuffer) {
      doc.image(sig1ImageBuffer, sigX + 20, footerY - 34, { height: 32, fit: [sigBlockW - 40, 32] });
    } else if (sig1.name) {
      doc.fontSize(22).fillColor('#333333').font('Helvetica-Oblique')
        .text(sig1.name.split(' ')[0], sigX, footerY - 28, { width: sigBlockW, align: 'center' });
    }
    doc.moveTo(sigX, sigLineY).lineTo(sigX + sigBlockW, sigLineY).lineWidth(1).stroke('#555555');
    doc.fontSize(10).fillColor(darkText).font('Helvetica-Bold')
      .text((sig1.name || 'DIRECTOR').toUpperCase(), sigX, sigLineY + 5, { width: sigBlockW, align: 'center' });
    doc.fontSize(8).fillColor('#666666').font('Helvetica')
      .text(sig1.title || 'Director', sigX, sigLineY + 18, { width: sigBlockW, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generating certificate', error: error.message });
    }
  }
});

export default router;
