import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true, // Format: "HH:MM"
  },
  endTime: {
    type: String,
    required: true, // Format: "HH:MM"
  },
  maxCandidates: {
    type: Number,
    default: 50,
  },
  registeredCandidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  venue: {
    type: String,
    default: 'Online',
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  proctorSettings: {
    webcamRequired: {
      type: Boolean,
      default: true,
    },
    screenRecording: {
      type: Boolean,
      default: false,
    },
    idVerification: {
      type: Boolean,
      default: true,
    },
    browserLockdown: {
      type: Boolean,
      default: false,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
scheduleSchema.index({ exam: 1, scheduledDate: 1 });
scheduleSchema.index({ status: 1 });

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

export default Schedule;
