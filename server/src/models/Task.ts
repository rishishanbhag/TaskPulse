import mongoose, { type InferSchemaType } from 'mongoose';

export const TaskStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  COMPLETED: 'COMPLETED',
} as const;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: Object.values(TaskStatus),
      default: TaskStatus.DRAFT,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    deadline: { type: Date, required: false },
    scheduledAt: { type: Date, required: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type TaskDoc = InferSchemaType<typeof taskSchema> & { _id: mongoose.Types.ObjectId };

export const TaskModel = mongoose.model('Task', taskSchema);

