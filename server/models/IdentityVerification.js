import mongoose from 'mongoose';

const identityVerificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
  },
  verificationType: {
    type: String,
    enum: ['id_card', 'passport', 'drivers_license', 'face_match'],
    required: true,
  },
  documentImageUrl: {
    type: String,
  },
  faceImageUrl: {
    type: String,
  },
  extractedData: {
    fullName: String,
    documentNumber: String,
    dateOfBirth: Date,
    expiryDate: Date,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed', 'manual_review'],
    default: 'pending',
  },
  matchScore: {
    type: Number, // 0-100 confidence score
    min: 0,
    max: 100,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: {
    type: Date,
  },
  failureReason: {
    type: String,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
identityVerificationSchema.index({ user: 1, verificationStatus: 1 });
identityVerificationSchema.index({ session: 1 });

const IdentityVerification = mongoose.models.IdentityVerification || mongoose.model('IdentityVerification', identityVerificationSchema);

export default IdentityVerification;
