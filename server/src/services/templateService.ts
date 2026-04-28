import mongoose from 'mongoose';

import { TaskModel, TaskStatus } from '@/models/Task.js';
import { TaskTemplateModel } from '@/models/TaskTemplate.js';
import { invalidateTaskListsForOrg } from '@/services/taskService.js';
import { htmlToPlain, sanitizeDescriptionHtml } from '@/utils/sanitizeDescription.js';
import { generateUniqueTaskShortCode } from '@/utils/shortCode.js';

export async function listTemplates(input: { orgId: string; createdBy?: string }) {
  const query: Record<string, unknown> = { orgId: new mongoose.Types.ObjectId(input.orgId) };
  if (input.createdBy) query.createdBy = new mongoose.Types.ObjectId(input.createdBy);
  return TaskTemplateModel.find(query).sort({ createdAt: -1 }).lean();
}

export async function createTemplate(input: {
  orgId: string;
  name: string;
  title: string;
  descriptionHtml: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultAssignedTo: string[];
  defaultDeadlineOffsetMinutes?: number;
  createdBy: string;
}) {
  const descriptionHtml = sanitizeDescriptionHtml(input.descriptionHtml);
  const description = htmlToPlain(descriptionHtml);
  if (!description) {
    const err = new Error('Description is empty after sanitization');
    (err as any).statusCode = 400;
    throw err;
  }
  return TaskTemplateModel.create({
    orgId: new mongoose.Types.ObjectId(input.orgId),
    name: input.name,
    title: input.title,
    description,
    descriptionHtml,
    defaultPriority: input.defaultPriority ?? 'MEDIUM',
    defaultAssignedTo: input.defaultAssignedTo,
    ...(input.defaultDeadlineOffsetMinutes ? { defaultDeadlineOffsetMinutes: input.defaultDeadlineOffsetMinutes } : {}),
    createdBy: new mongoose.Types.ObjectId(input.createdBy),
  });
}

export async function deleteTemplate(orgId: string, templateId: string) {
  const t = await TaskTemplateModel.findOne({ _id: templateId, orgId: new mongoose.Types.ObjectId(orgId) });
  if (!t) return false;
  await TaskTemplateModel.deleteOne({ _id: t._id });
  return true;
}

export async function instantiateTemplate(input: { orgId: string; templateId: string; createdBy: string }) {
  const tpl = await TaskTemplateModel.findOne({
    _id: input.templateId,
    orgId: new mongoose.Types.ObjectId(input.orgId),
  }).lean();
  if (!tpl) {
    const err = new Error('Template not found');
    (err as any).statusCode = 404;
    throw err;
  }

  const deadline =
    tpl.defaultDeadlineOffsetMinutes && Number.isFinite(tpl.defaultDeadlineOffsetMinutes)
      ? new Date(Date.now() + tpl.defaultDeadlineOffsetMinutes * 60_000)
      : undefined;

  const shortCode = await generateUniqueTaskShortCode(input.orgId);
  const rawHtml = (tpl as any).descriptionHtml?.trim()
    ? String((tpl as any).descriptionHtml)
    : `<p>${String(tpl.description)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</p>`;
  const descriptionHtml = sanitizeDescriptionHtml(rawHtml);
  const description = htmlToPlain(descriptionHtml);
  const task = await TaskModel.create({
    orgId: new mongoose.Types.ObjectId(input.orgId),
    shortCode,
    title: tpl.title,
    description: description || String(tpl.description),
    descriptionHtml,
    createdBy: new mongoose.Types.ObjectId(input.createdBy),
    assignedTo: (tpl.defaultAssignedTo as any[]) ?? [],
    priority: (tpl.defaultPriority as any) ?? 'MEDIUM',
    ...(deadline ? { deadline } : {}),
    status: TaskStatus.DRAFT,
  });

  await invalidateTaskListsForOrg(input.orgId);
  return task;
}
