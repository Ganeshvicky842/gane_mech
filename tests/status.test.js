import { describe, expect, it } from 'vitest';
import { assertTransition, ALLOWED_TRANSITIONS } from '../src/utils/status.js';

describe('request state machine', () => {
  it('allows the C16-C22 happy path', () => {
    expect(() => assertTransition('SEARCHING', 'ASSIGNED')).not.toThrow();
    expect(() => assertTransition('ASSIGNED', 'EN_ROUTE')).not.toThrow();
    expect(() => assertTransition('EN_ROUTE', 'ARRIVED')).not.toThrow();
    expect(() => assertTransition('ARRIVED', 'SERVICE_IN_PROGRESS')).not.toThrow();
  });
  it('rejects invalid jumps', () => {
    expect(() => assertTransition('SEARCHING', 'ARRIVED')).toThrow();
    expect(() => assertTransition('ARRIVED', 'ASSIGNED')).toThrow();
    expect(ALLOWED_TRANSITIONS.COMPLETED).toEqual([]);
  });
});
