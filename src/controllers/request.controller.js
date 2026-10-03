import RoadsideRequest from '../models/RoadsideRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ChatMessage from '../models/ChatMessage.js';
import { ok, AppError } from '../utils/http.js';
import { publicProvider, providerForAssignedCustomer } from '../utils/sanitize.js';
import { getRequestForActor, startMatching, updateProviderLocation, markArrived, startService, cancelRequest } from '../services/request.service.js';
import { assignProvider, findEligibleProviders, autoAssignBestProvider } from '../services/matching.service.js';
import { createMessage } from '../services/chat.service.js';
import { REQUEST_STATUS } from '../utils/status.js';

export async function getRequest(req, res) {
  let providerProfileId = req.user.providerProfileId;
  const request = await getRequestForActor(req.params.requestId, req.user, { providerProfileId });
  const provider = request.assignedProviderId ? await ProviderProfile.findById(request.assignedProviderId) : null;
  const data = request.toObject();
  if (req.user.role === 'CUSTOMER' && provider) data.assignedProvider = providerForAssignedCustomer(provider);
  if (req.user.role === 'PROVIDER') {
    // Never return the customer's full private profile; only the fields needed to perform the job.
    data.customer = { id: request.customerId };
  }
  return ok(res, data);
}

export async function matching(req, res) {
  const { request, candidates } = await startMatching(req.params.requestId, req.user._id);
  return ok(res, {
    requestId: request._id,
    status: request.status,
    candidates: candidates.map(x => ({ provider: publicProvider(x.provider), distanceKm: x.distanceKm, etaMinutes: x.etaMinutes }))
  });
}


export async function autoAssign(req, res) {
  const result = await autoAssignBestProvider(req.params.requestId, req.user._id);
  if (result.provider) {
    req.app.get('io')?.to(`request:${result.request._id}`).emit('request:assigned', {
      requestId: result.request._id, status: result.request.status, provider: publicProvider(result.provider),
      etaMinutes: result.request.etaMinutes, distanceKm: result.request.distanceKm
    });
  }
  return ok(res, {
    requestId: result.request._id,
    status: result.request.status,
    assigned: Boolean(result.provider),
    provider: result.provider ? publicProvider(result.provider) : null,
    candidates: (result.candidates || []).map(x => ({ provider: publicProvider(x.provider), distanceKm: x.distanceKm, etaMinutes: x.etaMinutes }))
  });
}

export async function assign(req, res) {
  const { request, provider } = await assignProvider(req.params.requestId, req.body.providerId, req.user._id);
  req.app.get('io')?.to(`request:${request._id}`).emit('request:assigned', {
    requestId: request._id, status: request.status, provider: publicProvider(provider), etaMinutes: request.etaMinutes, distanceKm: request.distanceKm
  });
  return ok(res, { request, provider: publicProvider(provider) });
}

export async function candidates(req, res) {
  const request = await RoadsideRequest.findById(req.params.requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (req.user.role !== 'ADMIN' && String(request.customerId) !== String(req.user._id)) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
  const list = await findEligibleProviders(request);
  return ok(res, list.map(x => ({ provider: publicProvider(x.provider), distanceKm: x.distanceKm, etaMinutes: x.etaMinutes })));
}

export async function location(req, res) {
  const request = await updateProviderLocation(req.params.requestId, req.user.providerProfileId, req.body);
  req.app.get('io')?.to(`request:${request._id}`).emit('tracking:update', {
    requestId: request._id,
    status: request.status,
    etaMinutes: request.etaMinutes,
    distanceKm: request.distanceKm,
    providerLocation: request.providerLocation
  });
  return ok(res, { status: request.status, etaMinutes: request.etaMinutes, distanceKm: request.distanceKm, providerLocation: request.providerLocation });
}

export async function arrived(req, res) {
  const request = await markArrived(req.params.requestId, req.user.providerProfileId);
  req.app.get('io')?.to(`request:${request._id}`).emit('request:arrived', { requestId: request._id, status: request.status, arrivedAt: request.arrivedAt });
  return ok(res, request);
}

export async function serviceStart(req, res) {
  const request = await startService(req.params.requestId, req.user.providerProfileId);
  req.app.get('io')?.to(`request:${request._id}`).emit('request:service_started', { requestId: request._id, status: request.status, handoffToTeam4At: request.handoffToTeam4At });
  return ok(res, request);
}

export async function cancel(req, res) {
  const request = await cancelRequest(req.params.requestId, req.user._id, req.body.reason);
  req.app.get('io')?.to(`request:${request._id}`).emit('request:cancelled', { requestId: request._id, status: request.status, reason: request.cancellationReason });
  return ok(res, request);
}

export async function chatHistory(req, res) {
  const request = await getRequestForActor(req.params.requestId, req.user, { providerProfileId: req.user.providerProfileId });
  const messages = await ChatMessage.find({ requestId: request._id }).sort({ createdAt: 1 }).limit(200);
  return ok(res, messages);
}

export async function sendChat(req, res) {
  const message = await createMessage({ requestId: req.params.requestId, user: req.user, ...req.body });
  req.app.get('io')?.to(`request:${req.params.requestId}`).emit('chat:message', message);
  return ok(res, message, 201);
}

export async function status(req, res) {
  const request = await getRequestForActor(req.params.requestId, req.user, { providerProfileId: req.user.providerProfileId });
  return ok(res, {
    requestId: request._id,
    status: request.status,
    etaMinutes: request.etaMinutes,
    distanceKm: request.distanceKm,
    timeline: request.timeline,
    handoffToTeam4At: request.handoffToTeam4At
  });
}
