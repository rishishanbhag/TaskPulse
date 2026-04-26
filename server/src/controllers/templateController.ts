import { createTemplate, deleteTemplate, instantiateTemplate, listTemplates } from '@/services/templateService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

export const templateController = {
  list: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const templates = await listTemplates({ orgId: req.user.orgId });
    res.json({ templates });
  }),

  create: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const body = req.body as {
      name: string;
      title: string;
      descriptionHtml: string;
      defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      defaultAssignedTo: string[];
      defaultDeadlineOffsetMinutes?: number;
    };

    const tpl = await createTemplate({
      orgId: req.user.orgId,
      name: body.name,
      title: body.title,
      descriptionHtml: body.descriptionHtml,
      defaultPriority: body.defaultPriority,
      defaultAssignedTo: body.defaultAssignedTo,
      defaultDeadlineOffsetMinutes: body.defaultDeadlineOffsetMinutes,
      createdBy: req.user.id,
    });

    res.status(201).json({ template: tpl });
  }),

  remove: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const ok = await deleteTemplate(req.user.orgId, req.params.id);
    if (!ok) return res.status(404).json({ error: { message: 'Template not found' } });
    res.status(204).send();
  }),

  instantiate: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const task = await instantiateTemplate({ orgId: req.user.orgId, templateId: req.params.id, createdBy: req.user.id });
    res.status(201).json({ task });
  }),
};
