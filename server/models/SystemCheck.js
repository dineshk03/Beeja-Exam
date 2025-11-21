import mongoose from 'mongoose';

const systemCheckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
  },
  checkType: {
    type: String,
    enum: ['pre_exam', 'during_exam', 'post_exam'],
    default: 'pre_exam',
  },
  systemInfo: {
    browser: String,
    browserVersion: String,
    os: String,
    osVersion: String,
    screenResolution: String,
    userAgent: String,
  },
  systemChecks: {
    webcam: {
      available: Boolean,
      working: Boolean,
      permission: String,
    },
    microphone: {
      available: Boolean,
      working: Boolean,
      permission: String,
    },
    internet: {
      speed: Number, // Mbps
      latency: Number, // ms
      stable: Boolean,
    },
    browser: {
      compatible: Boolean,
      version: String,
      issues: [String],
    },
    screen: {
      resolution: String,
      fullscreenCapable: Boolean,
    },
  },
  overallStatus: {
    type: String,
    enum: ['passed', 'passed_with_warnings', 'failed'],
    default: 'passed',
  },
  warnings: [String],
  errorMessages: [String],
  recommendations: [String],
}, {
  timestamps: true,
});

// Index for efficient queries
systemCheckSchema.index({ user: 1, checkType: 1 });
systemCheckSchema.index({ session: 1 });

const SystemCheck = mongoose.models.SystemCheck || mongoose.model('SystemCheck', systemCheckSchema);

export default SystemCheck;
