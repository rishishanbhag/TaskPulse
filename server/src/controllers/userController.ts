import { listUsers } from '@/services/userService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

export const userController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });

    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;

    const users = await listUsers({ role, q });
    res.json({ users });
  }),
};

