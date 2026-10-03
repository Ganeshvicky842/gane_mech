import mongoose from 'mongoose';
import { REQUEST_STATUS } from '../utils/status.js';

const timelineSchema = new mongoose.Schema({
  status: { type: String, enum: Object.values(REQUEST_STATUS), required: true },
  at: { type: Date, default: Date.now },
  actorId: mongoose.Schema.Types.ObjectId,
  note: String
}, { _id: false });

const locationSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  accuracyMeters: Number,
  address: { type: String, maxlength: 300 },
  landmark: { type: String, maxlength: 160 }
}, { _id: false });

const requestSchema = new mongoose.Schema({
  // This is the common Team 2 request/booking identifier. Team 3 never creates a second booking for the same roadside job.
  requestNumber: { type: String, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vehicleSnapshot: {
    type: String,
    brand: String,
    model: String,
    registration: String,
    year: Number,
    fuelType: String,
    color: String,
    imageUrl: String
  },
  service: { type: String, required: true, index: true },
  problemDetails: {
    issue: String,
    description: String,
    photos: [String],
    drivable: Boolean,
    urgency: { type: String, enum: ['STANDARD', 'URGENT', 'EMERGENCY'] }
  },
  breakdownLocation: { type: locationSchema, required: true },
  status: { type: String, enum: Object.values(REQUEST_STATUS), default: REQUEST_STATUS.SEARCHING, index: true },
  assignedProviderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile', index: true },
  assignedAt: Date,
  etaMinutes: Number,
  distanceKm: Number,
  providerLocation: {
    lat: Number,
    lng: Number,
    accuracyMeters: Number,
    updatedAt: Date
  },
  timeline: { type: [timelineSchema], default: [] },
  arrivedAt: Date,
  serviceStartedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  handoffToTeam4At: Date
}, { timestamps: true });

requestSchema.index({ customerId: 1, status: 1, updatedAt: -1 });
requestSchema.index({ assignedProviderId: 1, status: 1, updatedAt: -1 });

export default mongoose.model('RoadsideRequest', requestSchema);
