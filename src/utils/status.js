import { AppError } from './http.js';

export const REQUEST_STATUS = Object.freeze({
  SEARCHING: 'SEARCHING',
  ASSIGNED: 'ASSIGNED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  SERVICE_IN_PROGRESS: 'SERVICE_IN_PROGRESS',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED'
});

export const ALLOWED_TRANSITIONS = {
  SEARCHING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
  EN_ROUTE: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['SERVICE_IN_PROGRESS', 'CANCELLED'],
  SERVICE_IN_PROGRESS: ['COMPLETED'],
  CANCELLED: [],
  COMPLETED: []
};

export function assertTransition(from, to) {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw new AppError(409, `Invalid status transition: ${from} -> ${to}`, 'INVALID_STATUS_TRANSITION');
  }
}
