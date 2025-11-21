import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'register',
      'exam_start',
      'exam_submit',
      'exam_create',
      'exam_update',
      'exam_delete',
      'question_create',
      'question_update',
      'question_delete',
      'student_assign',
      'student_unassign',
      'answer_save',
      'question_flag',
      'session_flagged',
      'session_terminated',
    ],
  },
  entity: {
    type: String, // 'exam', 'question', 'user', etc.
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
