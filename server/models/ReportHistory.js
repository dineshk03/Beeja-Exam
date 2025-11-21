import mongoose from 'mongoose';

const reportHistorySchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true
  },
  name: String,
  format: {
    type: String,
    enum: ['csv', 'json', 'pdf'],
    required: true
  },
  filters: {
    examId: String,
    batchId: String,
    startDate: Date,
    endDate: Date
  },
  recordCount: {
    type: Number,
    default: 0
  },
  fileSize: Number, // in bytes
  filePath: String,
  downloadUrl: String,
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  error: String,
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledReport'
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for cleanup of expired reports
reportHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('ReportHistory', reportHistorySchema);
