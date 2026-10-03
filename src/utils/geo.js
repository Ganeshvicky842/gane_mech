import { getDistance, getPreciseDistance } from 'geolib';
import { env } from '../config/env.js';

export function distanceMeters(a, b) {
  return getPreciseDistance(
    { latitude: a.lat, longitude: a.lng },
    { latitude: b.lat, longitude: b.lng }
  );
}

export function distanceKm(a, b) {
  return distanceMeters(a, b) / 1000;
}

export function estimateEtaMinutes(distanceKmValue) {
  const minutes = Math.ceil((distanceKmValue / Math.max(env.etaSpeedKmph, 1)) * 60 + 2);
  return Math.max(1, Math.min(minutes, 180));
}

export function isValidCoordinate(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
