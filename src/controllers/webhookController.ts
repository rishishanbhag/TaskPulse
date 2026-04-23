import Twilio from 'twilio';

import { AssignmentModel, AssignmentStatus } from '@/models/Assignment.js';
import { MessageModel } from '@/models/Message.js';
import { TaskModel, TaskStatus } from '@/models/Task.js';
import { UserModel } from '@/models/User.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { normalizeTwilioFrom } from '@/utils/phone.js';

function mapTwilioStatusToAssignment(status: string) {
  const s = status.toLowerCase();
  if (s === 'delivered') return AssignmentStatus.DELIVERED;
  if (s === 'sent') return AssignmentStatus.SENT;
  if (s === 'failed' || s === 'undelivered') return AssignmentStatus.FAILED;
  return null;
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

    if (!/^\s*done\s*$/i.test(body)) {
      twiml.message('Reply DONE when you finish the task.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const assignment = await AssignmentModel.findOne({
      userId: user._id,
      status: { $in: [AssignmentStatus.SENT, AssignmentStatus.DELIVERED, AssignmentStatus.PENDING] },
    }).sort({ updatedAt: -1 });

    if (!assignment) {
      twiml.message('No active assignment found.');
      res.type('text/xml').send(twiml.toString());
      return;
    }

    assignment.status = AssignmentStatus.COMPLETED;
    assignment.updatedAt = new Date();
    await assignment.save();

    const remaining = await AssignmentModel.countDocuments({
      taskId: assignment.taskId,
      status: { $ne: AssignmentStatus.COMPLETED },
    });

    if (remaining === 0) {
      await TaskModel.updateOne({ _id: assignment.taskId }, { $set: { status: TaskStatus.COMPLETED } });
    }

    twiml.message('Marked as completed. Thank you!');
    res.type('text/xml').send(twiml.toString());
  }),
};

