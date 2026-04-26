import mongoose, { type InferSchemaType } from 'mongoose';

export const UserRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const;

const userSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    googleId: { type: String, required: true, index: true },
    phone: { type: String, required: false, trim: true },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userSchema.index({ orgId: 1, email: 1 }, { unique: true });
userSchema.index({ orgId: 1, googleId: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = mongoose.model('User', userSchema);

