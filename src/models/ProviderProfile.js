import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true, index: true },
  name: { type: String, required: true },
  phone: String,
  photoUrl: String,
  rating: { type: Number, min: 0, max: 5, default: 5 },
  completedJobs: { type: Number, default: 0 },
  experienceYears: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verification: {
    identityVerified: { type: Boolean, default: false },
    backgroundChecked: { type: Boolean, default: false },
    licenseVerified: { type: Boolean, default: false }
  },
  skills: { type: [String], default: [] },
  vehicleTypes: { type: [String], default: [] },
  services: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  serviceVehicle: {
    type: { type: String },
    registration: String
  },
  availability: { type: String, enum: ['AVAILABLE', 'BUSY', 'OFFLINE'], default: 'OFFLINE', index: true },
  currentLocation: {
    lat: Number,
    lng: Number,
    accuracyMeters: Number,
    updatedAt: Date
  }
}, { timestamps: true });

providerSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
export default mongoose.model('ProviderProfile', providerSchema);
