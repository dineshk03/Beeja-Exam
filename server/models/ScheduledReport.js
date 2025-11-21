import mongoose from 'mongoose';

const scheduledReportSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    enum: [
      'student_performance',
      'exam_summary',
      'batch_analysis',
      'attendance',
      'proctoring',
      'time_analysis',
      'question_analysis',
      'comprehensive'
    ]
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'custom']
  },
  schedule: {
    dayOfWeek: Number, // 0-6 for weekly
    dayOfMonth: Number, // 1-31 for monthly
    time: String, // HH:MM format
    customCron: String // For custom schedules
  },
  filters: {
    examId: String,
    batchId: String,
    startDate: Date,
    endDate: Date
  },
  format: {
    type: String,
    enum: ['csv', 'json', 'pdf'],
    default: 'csv'
  },
  recipients: [{
    email: String,
    name: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastRun: Date,
  nextRun: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update nextRun based on frequency
scheduledReportSchema.methods.calculateNextRun = function() {
  const now = new Date();
  const [hours, minutes] = (this.schedule.time || '09:00').split(':');
  
  let nextRun = new Date();
  nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  switch (this.frequency) {
    case 'daily':
      // Already set to next occurrence
      break;
    case 'weekly':
      while (nextRun.getDay() !== this.schedule.dayOfWeek) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'monthly':
      nextRun.setDate(this.schedule.dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }
  
  return nextRun;
};

scheduledReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (!this.nextRun) {
    this.nextRun = this.calculateNextRun();
  }
  next();
});

export default mongoose.model('ScheduledReport', scheduledReportSchema);
