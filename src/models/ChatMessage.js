import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoadsideRequest', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['CUSTOMER', 'PROVIDER'], required: true },
  type: { type: String, enum: ['TEXT', 'LOCATION', 'PHOTO'], default: 'TEXT' },
  text: { type: String, maxlength: 2000 },
  location: { lat: Number, lng: Number },
  mediaUrl: String,
  readAt: Date
}, { timestamps: true });

chatMessageSchema.index({ requestId: 1, createdAt: 1 });
export default mongoose.model('ChatMessage', chatMessageSchema);
