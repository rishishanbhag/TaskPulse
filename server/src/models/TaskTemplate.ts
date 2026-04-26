import mongoose, { type InferSchemaType } from 'mongoose';

import { TaskPriority } from '@/models/Task.js';

const taskTemplateSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    descriptionHtml: { type: String, required: false, trim: true, maxlength: 20_000 },
    defaultPriority: {
      type: String,
      required: true,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
      index: true,
    },
    defaultAssignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    defaultDeadlineOffsetMinutes: { type: Number, required: false, min: 1, max: 365 * 24 * 60 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type TaskTemplateDoc = InferSchemaType<typeof taskTemplateSchema> & { _id: mongoose.Types.ObjectId };

export const TaskTemplateModel = mongoose.model('TaskTemplate', taskTemplateSchema);

