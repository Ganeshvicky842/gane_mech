import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import * as c from '../controllers/request.controller.js';

const router = Router();
router.use(authenticate);

router.get('/:requestId', asyncHandler(c.getRequest));
router.get('/:requestId/status', asyncHandler(c.status));
router.get('/:requestId/candidates', requireRole('CUSTOMER', 'ADMIN'), asyncHandler(c.candidates));
router.post('/:requestId/match', requireRole('CUSTOMER'), asyncHandler(c.matching));
router.post('/:requestId/auto-assign', requireRole('ADMIN'), asyncHandler(c.autoAssign));
router.post('/:requestId/assign', requireRole('ADMIN'), validate(z.object({ providerId: z.string().min(1) })), asyncHandler(c.assign));
router.post('/:requestId/location', requireRole('PROVIDER'), validate(z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180), accuracyMeters: z.number().positive().max(1000).optional() })), asyncHandler(c.location));
router.post('/:requestId/arrived', requireRole('PROVIDER'), asyncHandler(c.arrived));
router.post('/:requestId/service-start', requireRole('PROVIDER'), asyncHandler(c.serviceStart));
router.post('/:requestId/cancel', requireRole('CUSTOMER'), validate(z.object({ reason: z.string().max(300).optional() })), asyncHandler(c.cancel));
router.get('/:requestId/chat/messages', asyncHandler(c.chatHistory));
router.post('/:requestId/chat/messages', validate(z.object({
  type: z.enum(['TEXT', 'LOCATION', 'PHOTO']).default('TEXT'),
  text: z.string().max(2000).optional(),
  location: z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }).optional(),
  mediaUrl: z.string().url().max(1000).optional()
})), asyncHandler(c.sendChat));

export default router;
