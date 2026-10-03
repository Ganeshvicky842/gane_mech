import ChatMessage from '../models/ChatMessage.js';
import RoadsideRequest from '../models/RoadsideRequest.js';
import { AppError } from '../utils/http.js';

export async function assertChatParticipant(requestId, user) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  const isCustomer = String(request.customerId) === String(user._id);
  const isProvider = user.role === 'PROVIDER' && String(request.assignedProviderId) === String(user.providerProfileId || '');
  if (!isCustomer && !isProvider) throw new AppError(403, 'You are not a participant in this chat', 'CHAT_ACCESS_DENIED');
  return request;
}

export async function createMessage({ requestId, user, type, text, location, mediaUrl }) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  const customer = String(request.customerId) === String(user._id);
  const provider = user.role === 'PROVIDER' && String(request.assignedProviderId) === String(user.providerProfileId || '');
  if (!customer && !provider) throw new AppError(403, 'You are not a participant in this chat', 'CHAT_ACCESS_DENIED');
  if (['CANCELLED', 'COMPLETED'].includes(request.status)) throw new AppError(409, 'Chat is closed for this request', 'CHAT_CLOSED');
  if (type === 'TEXT' && !text?.trim()) throw new AppError(400, 'Text is required', 'MESSAGE_TEXT_REQUIRED');
  if (type === 'LOCATION' && (!location?.lat || !location?.lng)) throw new AppError(400, 'Location is required', 'MESSAGE_LOCATION_REQUIRED');
  const message = await ChatMessage.create({ requestId, senderId: user._id, senderRole: user.role, type, text: text?.trim(), location, mediaUrl });
  return message;
}
