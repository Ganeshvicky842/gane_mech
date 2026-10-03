import ProviderProfile from '../models/ProviderProfile.js';
import RoadsideRequest from '../models/RoadsideRequest.js';
import { distanceKm, estimateEtaMinutes } from '../utils/geo.js';
import { AppError } from '../utils/http.js';
import { REQUEST_STATUS, assertTransition } from '../utils/status.js';
import { env } from '../config/env.js';

function eligible(provider, request) {
  if (provider.availability !== 'AVAILABLE') return false;
  if (!provider.verified) return false;
  if (!provider.verification.identityVerified || !provider.verification.licenseVerified) return false;
  if (provider.vehicleTypes.length && request.vehicleSnapshot?.type && !provider.vehicleTypes.includes(request.vehicleSnapshot.type)) return false;
  if (provider.services.length && !provider.services.includes(request.service)) return false;
  if (provider.skills.length && request.service && !provider.skills.includes(request.service) && !provider.skills.includes('GENERAL')) return false;
  if (!provider.currentLocation?.lat || !provider.currentLocation?.lng) return false;
  return true;
}

export async function findEligibleProviders(request) {
  const providers = await ProviderProfile.find({ availability: 'AVAILABLE', verified: true });
  const scored = [];
  for (const provider of providers) {
    if (!eligible(provider, request)) continue;
    const dKm = distanceKm(request.breakdownLocation, provider.currentLocation);
    if (dKm > env.matchRadiusKm) continue;
    const eta = estimateEtaMinutes(dKm);
    const agePenalty = provider.currentLocation.updatedAt && (Date.now() - new Date(provider.currentLocation.updatedAt).getTime()) > 120000 ? 3 : 0;
    const score = (dKm * 10) + (5 - provider.rating) * 3 + agePenalty;
    scored.push({ provider, distanceKm: Number(dKm.toFixed(2)), etaMinutes: eta, score });
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, env.matchMaxResults);
}

export async function assignProvider(requestId, providerId, actorId) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (request.status !== REQUEST_STATUS.SEARCHING) throw new AppError(409, 'Request is no longer searching', 'REQUEST_NOT_SEARCHING');
  const provider = await ProviderProfile.findById(providerId);
  if (!provider || !eligible(provider, request)) throw new AppError(409, 'Provider is not eligible or available', 'PROVIDER_NOT_ELIGIBLE');
  const dKm = distanceKm(request.breakdownLocation, provider.currentLocation);
  if (dKm > env.matchRadiusKm) throw new AppError(409, 'Provider is outside matching radius', 'PROVIDER_TOO_FAR');
  assertTransition(request.status, REQUEST_STATUS.ASSIGNED);

  // Claim the provider atomically so two simultaneous jobs cannot assign the same AVAILABLE mechanic.
  const claimedProvider = await ProviderProfile.findOneAndUpdate(
    { _id: provider._id, availability: 'AVAILABLE' },
    { $set: { availability: 'BUSY' } },
    { new: true }
  );
  if (!claimedProvider) throw new AppError(409, 'Provider was just assigned to another request', 'PROVIDER_RACE_LOST');

  const claimedRequest = await RoadsideRequest.findOneAndUpdate(
    { _id: request._id, status: REQUEST_STATUS.SEARCHING, assignedProviderId: { $exists: false } },
    {
      $set: {
        assignedProviderId: claimedProvider._id, assignedAt: new Date(), etaMinutes: estimateEtaMinutes(dKm),
        distanceKm: Number(dKm.toFixed(2)), providerLocation: claimedProvider.currentLocation, status: REQUEST_STATUS.ASSIGNED
      },
      $push: { timeline: { status: REQUEST_STATUS.ASSIGNED, actorId, note: 'Mechanic assigned' } }
    },
    { new: true }
  );
  if (!claimedRequest) {
    await ProviderProfile.findByIdAndUpdate(claimedProvider._id, { availability: 'AVAILABLE' });
    throw new AppError(409, 'Request was just assigned or changed', 'REQUEST_RACE_LOST');
  }
  return { request: claimedRequest, provider: claimedProvider };
}

export async function autoAssignBestProvider(requestId, actorId) {
  const request = await RoadsideRequest.findById(requestId);
  if (!request) throw new AppError(404, 'Roadside request not found', 'REQUEST_NOT_FOUND');
  if (request.status !== REQUEST_STATUS.SEARCHING) return { request, provider: request.assignedProviderId ? await ProviderProfile.findById(request.assignedProviderId) : null };
  const candidates = await findEligibleProviders(request);
  if (!candidates.length) return { request, provider: null, candidates: [] };
  const result = await assignProvider(requestId, candidates[0].provider._id, actorId);
  return { ...result, candidates };
}
