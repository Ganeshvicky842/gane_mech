import RoadsideRequest from '../models/RoadsideRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { AppError } from '../utils/http.js';
import { assertTransition, REQUEST_STATUS } from '../utils/status.js';
import { distanceKm, estimateEtaMinutes } from '../utils/geo.js';
import { findEligibleProviders } from './matching.service.js';

export async function getRequestForActor(requestId, user, options = {}) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  const isCustomer = String(request.customerId) === String(user._id);
  const isProvider = user.role === 'PROVIDER' && String(request.assignedProviderId) === String(options.providerProfileId || '');
  if (user.role !== 'ADMIN' && !isCustomer && !isProvider) throw new AppError(403, 'You cannot access this request', 'REQUEST_ACCESS_DENIED');
  return request;
}

export async function startMatching(requestId, actorId) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (String(request.customerId) !== String(actorId)) throw new AppError(403, 'Only the customer can start matching', 'FORBIDDEN');
  if (request.status !== REQUEST_STATUS.SEARCHING) return { request, candidates: [] };
  const candidates = await findEligibleProviders(request);
  return { request, candidates };
}

export async function updateProviderLocation(requestId, providerProfileId, data) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (String(request.assignedProviderId) !== String(providerProfileId)) throw new AppError(403, 'Provider is not assigned to this request', 'FORBIDDEN');
  if (![REQUEST_STATUS.ASSIGNED, REQUEST_STATUS.EN_ROUTE].includes(request.status)) {
    throw new AppError(409, 'Location tracking is not active for this request', 'TRACKING_NOT_ACTIVE');
  }
  if (request.status === REQUEST_STATUS.ASSIGNED) {
    assertTransition(request.status, REQUEST_STATUS.EN_ROUTE);
    request.status = REQUEST_STATUS.EN_ROUTE;
    request.timeline.push({ status: REQUEST_STATUS.EN_ROUTE, actorId: providerProfileId, note: 'Mechanic started route' });
  }
  const dKm = distanceKm(request.breakdownLocation, { lat: data.lat, lng: data.lng });
  request.providerLocation = { ...data, updatedAt: new Date() };
  request.distanceKm = Number(dKm.toFixed(2));
  request.etaMinutes = estimateEtaMinutes(dKm);
  await request.save();
  await ProviderProfile.findByIdAndUpdate(providerProfileId, { currentLocation: request.providerLocation });
  return request;
}

export async function markArrived(requestId, providerProfileId) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (String(request.assignedProviderId) !== String(providerProfileId)) throw new AppError(403, 'Provider is not assigned to this request', 'FORBIDDEN');
  assertTransition(request.status, REQUEST_STATUS.ARRIVED);
  request.status = REQUEST_STATUS.ARRIVED;
  request.arrivedAt = new Date();
  request.distanceKm = 0;
  request.etaMinutes = 0;
  request.timeline.push({ status: REQUEST_STATUS.ARRIVED, actorId: providerProfileId, note: 'Mechanic arrived at customer location' });
  await request.save();
  return request;
}

export async function startService(requestId, providerProfileId) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (String(request.assignedProviderId) !== String(providerProfileId)) throw new AppError(403, 'Provider is not assigned to this request', 'FORBIDDEN');
  assertTransition(request.status, REQUEST_STATUS.SERVICE_IN_PROGRESS);
  request.status = REQUEST_STATUS.SERVICE_IN_PROGRESS;
  request.serviceStartedAt = new Date();
  request.handoffToTeam4At = new Date();
  request.timeline.push({ status: REQUEST_STATUS.SERVICE_IN_PROGRESS, actorId: providerProfileId, note: 'Service started; handoff to Team 4' });
  await request.save();
  return request;
}

export async function cancelRequest(requestId, customerId, reason) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (String(request.customerId) !== String(customerId)) throw new AppError(403, 'Only the customer can cancel this request', 'FORBIDDEN');
  assertTransition(request.status, REQUEST_STATUS.CANCELLED);
  request.status = REQUEST_STATUS.CANCELLED;
  request.cancelledAt = new Date();
  request.cancellationReason = reason;
  request.timeline.push({ status: REQUEST_STATUS.CANCELLED, actorId: customerId, note: reason || 'Cancelled by customer' });
  await request.save();
  if (request.assignedProviderId) await ProviderProfile.findByIdAndUpdate(request.assignedProviderId, { availability: 'AVAILABLE' });
  return request;
}
