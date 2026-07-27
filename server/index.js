import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import examRoutes from './routes/exams.js';
import resultRoutes from './routes/results.js';
import adminRoutes from './routes/admin.js';
import batchRoutes from './routes/batch.js';
import schedulingRoutes from './routes/scheduling.js';
import proctoringRoutes from './routes/proctoring.js';
import verificationRoutes from './routes/verification.js';
import analyticsRoutes from './routes/analytics.js';
import reportsRoutes from './routes/reports.js';
import questionPapersRoutes from './routes/questionPapers.js';
import certificateSettingsRoutes from './routes/certificateSettings.js';

dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://65.2.57.80'])
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE || '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api', schedulingRoutes);
app.use('/api', proctoringRoutes);
app.use('/api', verificationRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', reportsRoutes);
app.use('/api', questionPapersRoutes);
app.use('/api', certificateSettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Exam Module API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve uploaded certificate assets
const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
