import mongoose, { type InferSchemaType } from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    twilioSid: { type: String, required: false, index: true, unique: true, sparse: true },
    status: { type: String, required: true, trim: true, index: true },
    body: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    error: { type: String, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type MessageDoc = InferSchemaType<typeof messageSchema> & { _id: mongoose.Types.ObjectId };

export const MessageModel = mongoose.model('Message', messageSchema);

