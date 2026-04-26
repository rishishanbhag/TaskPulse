import mongoose from 'mongoose';

import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { TaskModel } from '@/models/Task.js';
import { applyAssignmentReply, openAssignmentStatuses } from '@/services/assignmentReplyService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

export const assignmentController = {
  done: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const assignment = await AssignmentModel.findOne({
      _id: req.params.id,
      orgId: new mongoose.Types.ObjectId(req.user.orgId),
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!assignment) return res.status(404).json({ error: { message: 'Assignment not found' } });
    if (!openAssignmentStatuses().includes(assignment.status as any)) {
      return res.status(400).json({ error: { message: 'Assignment is not open' } });
    }
    const task = await TaskModel.findById(assignment.taskId).lean();
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } });
    await applyAssignmentReply({
      assignment,
      task: task as any,
      orgIdStr: req.user.orgId,
      userIdStr: req.user.id,
      parsed: { type: 'DONE' },
      replyBody: '[GUI] DONE',
    });
    res.json({ ok: true });
  }),

  help: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { note } = req.body as { note?: string };
    const assignment = await AssignmentModel.findOne({
      _id: req.params.id,
      orgId: new mongoose.Types.ObjectId(req.user.orgId),
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!assignment) return res.status(404).json({ error: { message: 'Assignment not found' } });
    if (!openAssignmentStatuses().includes(assignment.status as any)) {
      return res.status(400).json({ error: { message: 'Assignment is not open' } });
    }
    const task = await TaskModel.findById(assignment.taskId).lean();
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } });
    await applyAssignmentReply({
      assignment,
      task: task as any,
      orgIdStr: req.user.orgId,
      userIdStr: req.user.id,
      parsed: { type: 'HELP', ...(note ? { note } : {}) },
      replyBody: `[GUI] HELP${note ? ` ${note}` : ''}`,
    });
    res.json({ ok: true });
  }),

  delay: asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const { until } = req.body as { until?: string };
    const untilDate = until ? new Date(until) : undefined;
    const assignment = await AssignmentModel.findOne({
      _id: req.params.id,
      orgId: new mongoose.Types.ObjectId(req.user.orgId),
      userId: new mongoose.Types.ObjectId(req.user.id),
    });
    if (!assignment) return res.status(404).json({ error: { message: 'Assignment not found' } });
    if (!openAssignmentStatuses().includes(assignment.status as any)) {
      return res.status(400).json({ error: { message: 'Assignment is not open' } });
    }
    const task = await TaskModel.findById(assignment.taskId).lean();
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } });
    await applyAssignmentReply({
      assignment,
      task: task as any,
      orgIdStr: req.user.orgId,
      userIdStr: req.user.id,
      parsed: { type: 'DELAY', ...(untilDate ? { until: untilDate } : {}) },
      replyBody: `[GUI] DELAY${until ? ` ${until}` : ''}`,
    });
    res.json({ ok: true });
  }),
};
