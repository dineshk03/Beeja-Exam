import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  year: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Virtual for student count
batchSchema.virtual('studentCount', {
  ref: 'User',
  localField: 'name',
  foreignField: 'batch',
  count: true,
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;
