import { loginWithDevCredentials, loginWithGoogleIdToken } from '@/services/authService.js';
import { updateUserPhone } from '@/services/userService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { normalizeE164 } from '@/utils/phone.js';

export const authController = {
  google: asyncHandler(async (req, res) => {
    const { idToken } = req.body as { idToken: string };
    const result = await loginWithGoogleIdToken(idToken);
    res.json(result);
  }),

  devLogin: asyncHandler(async (req, res) => {
    const body = req.body as {
      email: string;
      name?: string;
      role?: 'admin' | 'member';
      phone?: string;
    };
    const result = await loginWithDevCredentials(body);
    res.json(result);
  }),

  updateMyPhone: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { phone } = req.body as { phone: string };
    const updated = await updateUserPhone(req.user.id, normalizeE164(phone));
    if (!updated) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({
      user: {
        id: String(updated._id),
        name: updated.name,
        email: updated.email,
        phone: updated.phone ?? null,
        role: updated.role,
      },
    });
  }),
};

