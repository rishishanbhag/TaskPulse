import mongoose from 'mongoose';

import { TaskModel, TaskStatus } from '@/models/Task.js';
import { upsertAssignmentsForTask } from '@/services/assignmentService.js';

export async function createTask(input: {
  title: string;
  description: string;
  createdBy: string;
  assignedTo: string[];
  deadline?: Date;
  scheduledAt?: Date;
}) {
  const task = await TaskModel.create({
    title: input.title,
    description: input.description,
    createdBy: input.createdBy,
    assignedTo: input.assignedTo,
    deadline: input.deadline,
    scheduledAt: input.scheduledAt,
    status: TaskStatus.DRAFT,
  });

  return task;
}

export async function approveTask(taskId: string) {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    (err as any).statusCode = 404;
    throw err;
  }

  if (task.status !== TaskStatus.DRAFT) {
    const err = new Error(`Task cannot be approved from status ${task.status}`);
    (err as any).statusCode = 400;
    throw err;
  }

  task.status = TaskStatus.APPROVED;
  await task.save();

  await upsertAssignmentsForTask(task._id, task.assignedTo.map(String));

  return task;
}

export async function rescheduleTask(taskId: string, scheduledAt: Date) {
  const task = await TaskModel.findById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    (err as any).statusCode = 404;
    throw err;
  }

  task.scheduledAt = scheduledAt;
  await task.save();
  return task;
}

export async function listTasksForUser(user: { id: string; role: 'admin' | 'member' }) {
  if (user.role === 'admin') {
    return TaskModel.find({}).sort({ createdAt: -1 }).lean();
  }
  return TaskModel.find({ assignedTo: new mongoose.Types.ObjectId(user.id) }).sort({ createdAt: -1 }).lean();
}

export async function getTaskForUser(taskId: string, user: { id: string; role: 'admin' | 'member' }) {
  const task = await TaskModel.findById(taskId).lean();
  if (!task) return null;

  if (user.role === 'admin') return task;

  const assignedIds = (task.assignedTo as unknown as mongoose.Types.ObjectId[]).map(String);
  if (!assignedIds.includes(user.id)) return null;
  return task;
}

