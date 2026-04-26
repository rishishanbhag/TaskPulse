import mongoose, { type InferSchemaType } from 'mongoose';

export const AssignmentStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export const AssignmentReplyType = {
  DONE: 'DONE',
  HELP: 'HELP',
  DELAY: 'DELAY',
  UNKNOWN: 'UNKNOWN',
} as const;

const assignmentSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(AssignmentStatus),
      default: AssignmentStatus.PENDING,
      index: true,
    },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: false },
    lastReplyType: { type: String, required: false, enum: Object.values(AssignmentReplyType), index: true },
    lastReplyAt: { type: Date, required: false },
    lastReplyBody: { type: String, required: false, maxlength: 1000 },
    helpRequestedAt: { type: Date, required: false, index: true },
    delayRequestedUntil: { type: Date, required: false },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: { createdAt: false, updatedAt: false } },
);

assignmentSchema.index({ taskId: 1, userId: 1 }, { unique: true });

export type AssignmentDoc = InferSchemaType<typeof assignmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AssignmentModel = mongoose.model('Assignment', assignmentSchema);

