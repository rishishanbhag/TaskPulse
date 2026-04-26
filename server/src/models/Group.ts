import mongoose, { type InferSchemaType } from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

groupSchema.index({ orgId: 1, name: 1 }, { unique: true });

export type GroupDoc = InferSchemaType<typeof groupSchema> & { _id: mongoose.Types.ObjectId };

export const GroupModel = mongoose.model('Group', groupSchema);

