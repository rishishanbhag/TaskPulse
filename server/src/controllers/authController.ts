import { loginWithDevEmail, loginWithGoogleIdToken } from '@/services/authService.js';
import { updateUserPhone } from '@/services/userService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { normalizeE164 } from '@/utils/phone.js';

export const authController = {
  me: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    res.json({ user: req.user });
  }),

  google: asyncHandler(async (req, res) => {
    const { idToken } = req.body as { idToken: string };
    const result = await loginWithGoogleIdToken(idToken);
    res.json(result);
  }),

  devLogin: asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const result = await loginWithDevEmail(email);
    res.json(result);
  }),

  updateMyPhone: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { phone } = req.body as { phone: string };
    const updated = await updateUserPhone(req.user.orgId, req.user.id, normalizeE164(phone));
    if (!updated) return res.status(404).json({ error: { message: 'User not found' } });
    res.json({
      user: {
        id: String(updated._id),
        name: updated.name,
        email: updated.email,
        phone: updated.phone ?? null,
        orgId: String((updated as any).orgId),
        role: updated.role,
      },
    });
  }),
};
