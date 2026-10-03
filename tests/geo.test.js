import { describe, expect, it } from 'vitest';
import { distanceKm, estimateEtaMinutes, isValidCoordinate } from '../src/utils/geo.js';

describe('geo utilities', () => {
  it('calculates a positive distance', () => expect(distanceKm({lat:17.43,lng:78.39},{lat:17.44,lng:78.38})).toBeGreaterThan(0));
  it('estimates a bounded ETA', () => expect(estimateEtaMinutes(2)).toBeGreaterThanOrEqual(1));
  it('validates coordinates', () => {
    expect(isValidCoordinate(17,78)).toBe(true);
    expect(isValidCoordinate(100,78)).toBe(false);
  });
});
