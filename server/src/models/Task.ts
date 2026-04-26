import mongoose, { type InferSchemaType } from 'mongoose';

export const TaskStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  COMPLETED: 'COMPLETED',
} as const;

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

const taskSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: false, index: true },
    shortCode: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    descriptionHtml: { type: String, required: false, trim: true, maxlength: 20_000 },
    status: {
      type: String,
      required: true,
      enum: Object.values(TaskStatus),
      default: TaskStatus.DRAFT,
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    deadline: { type: Date, required: false },
    scheduledAt: { type: Date, required: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

taskSchema.index({ orgId: 1, shortCode: 1 }, { unique: true });

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };

export const TaskModel = mongoose.model('Task', taskSchema);

