import { Router } from 'express';

import { authController } from '@/controllers/authController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { devOnly } from '@/middlewares/devOnly.js';
import { validate } from '@/middlewares/validate.js';
import { devLoginSchema, googleAuthSchema, updatePhoneSchema } from '@/schemas/auth.schema.js';

export const authRoutes = Router();

authRoutes.post('/dev-login', devOnly, validate(devLoginSchema), authController.devLogin);
authRoutes.post('/google', validate(googleAuthSchema), authController.google);
authRoutes.patch('/me/phone', requireAuth, validate(updatePhoneSchema), authController.updateMyPhone);

