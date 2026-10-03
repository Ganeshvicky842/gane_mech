import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/http.js';
import { login } from '../controllers/auth.controller.js';

const router = Router();
router.post('/login', validate(z.object({ login: z.string().min(3), password: z.string().min(6) })), asyncHandler(login));
export default router;
