import { Router } from 'express';

import { templateController } from '@/controllers/templateController.js';
import { requireAuth } from '@/middlewares/auth.js';
import { requireRole } from '@/middlewares/rbac.js';
import { validate } from '@/middlewares/validate.js';
import { createTemplateSchema, instantiateTemplateSchema } from '@/schemas/template.schema.js';

export const templateRoutes = Router();

templateRoutes.use(requireAuth);
templateRoutes.use(requireRole('admin'));

templateRoutes.get('/', templateController.list);
templateRoutes.post('/', validate(createTemplateSchema), templateController.create);
templateRoutes.delete('/:id', templateController.remove);
templateRoutes.post('/:id/instantiate', validate(instantiateTemplateSchema), templateController.instantiate);

