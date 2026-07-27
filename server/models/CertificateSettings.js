import mongoose from 'mongoose';

const certificateSettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    default: 'Beeja Academy'
  },
  companyTagline: {
    type: String,
    default: 'Excellence in Education'
  },
  certificateTitle: {
    type: String,
    default: 'CERTIFICATE OF COMPLETION'
  },
  coursePrefix: {
    type: String,
    default: ''
  },
  courseName: {
    type: String,
    default: ''
  },
  academicCredit: {
    type: String,
    default: ''
  },
  logos: {
    company: { type: String, default: null },
    aicte: { type: String, default: null },
    goi: { type: String, default: null },
    institution: { type: String, default: null }
  },
  signatures: {
    signature1: {
      name: { type: String, default: 'Director' },
      title: { type: String, default: 'Director' },
      organization: { type: String, default: 'Beeja Academy' },
      image: { type: String, default: null }
    },
    signature2: {
      name: { type: String, default: '' },
      title: { type: String, default: '' },
      organization: { type: String, default: '' },
      image: { type: String, default: null }
    }
  },
  qrCodeSettings: {
    enabled: { type: Boolean, default: true },
    includeCredentials: { type: Boolean, default: true },
    verificationUrl: { type: String, default: 'https://www.beejaacademy.com' },
    size: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' }
  },
  backgroundImage: {
    type: String,
    default: null
  },
  colors: {
    primary: { type: String, default: '#00bcd4' },
    secondary: { type: String, default: '#006064' },
    text: { type: String, default: '#1a1a2e' }
  },
  isDefault: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one default settings document exists
certificateSettingsSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

const CertificateSettings = mongoose.model('CertificateSettings', certificateSettingsSchema);

export default CertificateSettings;
