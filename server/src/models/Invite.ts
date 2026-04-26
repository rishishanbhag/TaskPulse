import mongoose, { type InferSchemaType } from 'mongoose';

export const InviteDefaultRole = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;

const inviteSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },
    defaultRole: { type: String, required: true, enum: Object.values(InviteDefaultRole) },
    expiresAt: { type: Date, required: false, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, index: true },
    usedAt: { type: Date, required: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type InviteDoc = InferSchemaType<typeof inviteSchema> & { _id: mongoose.Types.ObjectId };

export const InviteModel = mongoose.model('Invite', inviteSchema);

