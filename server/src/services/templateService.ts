import mongoose from 'mongoose';

import { TaskModel, TaskStatus } from '@/models/Task.js';
import { TaskTemplateModel } from '@/models/TaskTemplate.js';
import { invalidateTaskLists } from '@/services/taskService.js';

export async function listTemplates(input: { createdBy?: string }) {
  const query: Record<string, unknown> = {};
  if (input.createdBy) query.createdBy = new mongoose.Types.ObjectId(input.createdBy);
  return TaskTemplateModel.find(query).sort({ createdAt: -1 }).lean();
}

export async function createTemplate(input: {
  name: string;
  title: string;
  description: string;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultAssignedTo: string[];
  defaultDeadlineOffsetMinutes?: number;
  createdBy: string;
}) {
  return TaskTemplateModel.create({
    name: input.name,
    title: input.title,
    description: input.description,
    defaultPriority: input.defaultPriority ?? 'MEDIUM',
    defaultAssignedTo: input.defaultAssignedTo,
    ...(input.defaultDeadlineOffsetMinutes ? { defaultDeadlineOffsetMinutes: input.defaultDeadlineOffsetMinutes } : {}),
    createdBy: input.createdBy,
  });
}

export async function deleteTemplate(templateId: string) {
  const t = await TaskTemplateModel.findById(templateId);
  if (!t) return false;
  await TaskTemplateModel.deleteOne({ _id: t._id });
  return true;
}

export async function instantiateTemplate(input: { templateId: string; createdBy: string }) {
  const tpl = await TaskTemplateModel.findById(input.templateId).lean();
  if (!tpl) {
    const err = new Error('Template not found');
    (err as any).statusCode = 404;
    throw err;
  }

  const deadline =
    tpl.defaultDeadlineOffsetMinutes && Number.isFinite(tpl.defaultDeadlineOffsetMinutes)
      ? new Date(Date.now() + tpl.defaultDeadlineOffsetMinutes * 60_000)
      : undefined;

  const task = await TaskModel.create({
    title: tpl.title,
    description: tpl.description,
    createdBy: input.createdBy,
    assignedTo: (tpl.defaultAssignedTo as any[]) ?? [],
    priority: (tpl.defaultPriority as any) ?? 'MEDIUM',
    ...(deadline ? { deadline } : {}),
    status: TaskStatus.DRAFT,
  });

  await invalidateTaskLists();
  return task;
}

