import mongoose from 'mongoose';
import Twilio from 'twilio';

import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { MessageModel } from '@/models/Message.js';
import { TaskModel } from '@/models/Task.js';
import { UserModel } from '@/models/User.js';
import { applyAssignmentReply, openAssignmentStatuses } from '@/services/assignmentReplyService.js';
import { delKeys } from '@/services/cache.js';
import { publishEvent } from '@/services/events.js';
import { parseInboundReply } from '@/services/replyParser.js';
import { cacheKeysForTaskMutations, invalidateTaskListsForOrg } from '@/services/taskService.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { normalizeTwilioFrom } from '@/utils/phone.js';

function mapTwilioStatusToAssignment(status: string) {
  const s = status.toLowerCase();
  if (s === 'delivered') return AssignmentStatus.DELIVERED;
  if (s === 'sent') return AssignmentStatus.SENT;
  if (s === 'failed' || s === 'undelivered') return AssignmentStatus.FAILED;
  return null;
}

async function invalidateCachesForTask(orgId: string, taskId: string) {
  await delKeys([...cacheKeysForTaskMutations(orgId, taskId)]);
  await invalidateTaskListsForOrg(orgId);
}

export const webhookController = {
  twilioStatus: asyncHandler(async (req, res) => {
    const { MessageSid, MessageStatus } = req.body as { MessageSid?: string; MessageStatus?: string };
    if (!MessageSid || !MessageStatus) return res.status(200).send('OK');

    const msg = await MessageModel.findOneAndUpdate(
      { twilioSid: MessageSid },
      { $set: { status: MessageStatus } },
      { new: true },
    );

    if (msg) {
      const newAssignmentStatus = mapTwilioStatusToAssignment(MessageStatus);
      if (newAssignmentStatus) {
        await AssignmentModel.updateOne(
          { _id: msg.assignmentId },
          { $set: { status: newAssignmentStatus, updatedAt: new Date() } },
        );

        const taskId = String(msg.taskId);
        const userId = String(msg.userId);
        let orgId = String((msg as any).orgId || '');
        if (!orgId) {
          const t = await TaskModel.findById(taskId).select('orgId').lean();
          orgId = t ? String((t as any).orgId) : '';
        }
        if (orgId) {
          await invalidateCachesForTask(orgId, taskId);
        } else {
          await delKeys([`tp:v1:task:${taskId}:assignments`, `tp:v1:task:${taskId}:detail`]);
        }

        const task = await TaskModel.findById(taskId).select('orgId groupId').lean();
        const orgId2 = orgId || String((task as any)?.orgId);
        const gid = (task as any)?.groupId ? String((task as any).groupId) : null;

        await publishEvent({
          type: 'assignment.updated',
          orgId: orgId2,
          groupId: gid,
          taskId,
          assignmentId: String(msg.assignmentId),
          userId,
          status: newAssignmentStatus,
        });
      }
    }

    res.status(200).send('OK');
  }),

  twilioIncoming: asyncHandler(async (req, res) => {
    const { From, Body } = req.body as { From?: string; Body?: string };
    const from = From ? normalizeTwilioFrom(From) : null;
    const body = (Body ?? '').trim();

    const twiml = new Twilio.twiml.MessagingResponse();

    if (!from) {
      twiml.message('Missing sender.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const user = await UserModel.findOne({ phone: from }).lean();
    if (!user) {
      twiml.message('Your number is not linked to a user.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const orgOid = new mongoose.Types.ObjectId(String((user as any).orgId));
    const orgIdStr = String((user as any).orgId);
    const userIdStr = String(user._id);

    const now = new Date();
    const parsed = parseInboundReply(body, now);

    const openStatuses = openAssignmentStatuses();

    // Resolve which assignment this message refers to
    let assignment: InstanceType<typeof AssignmentModel> | null = null;
    if (parsed.type !== 'UNKNOWN' && 'code' in parsed && (parsed as any).code) {
      const code = (parsed as any).code as string;
      const task = await TaskModel.findOne({ orgId: orgOid, shortCode: code }).lean();
      if (!task) {
        twiml.message(`No task with code ${code} in your organization.`);
        res.type('text/xml').send(twiml.toString());
        return;
      }
      assignment = await AssignmentModel.findOne({
        orgId: orgOid,
        userId: user._id,
        taskId: task._id,
        status: { $in: openStatuses },
      });
      if (!assignment) {
        twiml.message(`No open assignment for you on ${code}.`);
        res.type('text/xml').send(twiml.toString());
        return;
      }
    } else {
      const list = await AssignmentModel.find({
        orgId: orgOid,
        userId: user._id,
        status: { $in: openStatuses },
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (list.length === 0) {
        twiml.message('No active assignment found.');
        res.type('text/xml').send(twiml.toString());
        return;
      }
      if (list.length > 1) {
        const taskIds = list.map((a) => a.taskId);
        const tasks = await TaskModel.find({ _id: { $in: taskIds } })
          .select('title shortCode')
          .lean();
        const byT = new Map(tasks.map((t) => [String(t._id), t]));
        const lines: string[] = [];
        for (let i = 0; i < list.length; i++) {
          const t = byT.get(String(list[i]!.taskId)) as { title: string; shortCode?: string } | undefined;
          lines.push(`${i + 1}. ${t?.shortCode ?? '?'} — ${t?.title ?? 'Task'}`);
        }
        twiml.message(
          `You have multiple open tasks. Include the code in your message, e.g. "DONE T-XXXXX":\n${lines.join(
            '\n',
          )}\n\nOr reply: DONE T-XXXXX`,
        );
        res.type('text/xml').send(twiml.toString());
        return;
      }
      assignment = await AssignmentModel.findById(list[0]!._id);
    }

    if (!assignment) {
      twiml.message('No active assignment found.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const task = await TaskModel.findById(assignment.taskId);
    if (!task) {
      twiml.message('Task not found.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    await applyAssignmentReply({
      assignment,
      task: task as any,
      orgIdStr,
      userIdStr,
      parsed,
      replyBody: body,
    });

    if (parsed.type === 'DONE') {
      twiml.message('Marked as completed. Thank you!');
    } else if (parsed.type === 'HELP') {
      twiml.message('Got it — your manager has been notified.');
    } else if (parsed.type === 'DELAY') {
      twiml.message('Noted. Delay request sent to your manager.');
    } else {
      twiml.message(
        `Reply DONE ${(task as any).shortCode ? `${(task as any).shortCode} ` : ''}when finished. You can also send HELP or DELAY 4h.`,
      );
    }
    res.type('text/xml').send(twiml.toString());
  }),
};
