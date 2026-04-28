import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { authController } from '@/controllers/authController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { devOnly } from '@/middlewares/devOnly.js';
import { validate } from '@/middlewares/validate.js';
import { devLoginSchema, googleAuthSchema, updatePhoneSchema } from '@/schemas/auth.schema.js';

export const authRoutes = Router();

const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

authRoutes.post('/dev-login', authLimiter, devOnly, validate(devLoginSchema), authController.devLogin);
authRoutes.post('/google', authLimiter, validate(googleAuthSchema), authController.google);
authRoutes.get('/me', requireAuth, authController.me);
authRoutes.patch('/me/phone', requireAuth, validate(updatePhoneSchema), authController.updateMyPhone);

