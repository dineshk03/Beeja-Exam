import mongoose from 'mongoose';

const proctorLogSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  eventType: {
    type: String,
    enum: [
      'face_detected',
      'face_not_detected',
      'multiple_faces',
      'tab_switch',
      'window_blur',
      'fullscreen_exit',
      'copy_attempt',
      'paste_attempt',
      'right_click',
      'screenshot_attempt',
      'suspicious_activity',
      'webcam_snapshot',
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  description: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  snapshotUrl: {
    type: String, // URL to stored webcam snapshot
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
proctorLogSchema.index({ session: 1, timestamp: -1 });
proctorLogSchema.index({ student: 1, eventType: 1 });
proctorLogSchema.index({ severity: 1 });

const ProctorLog = mongoose.models.ProctorLog || mongoose.model('ProctorLog', proctorLogSchema);

export default ProctorLog;
