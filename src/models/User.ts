import mongoose, { type InferSchemaType } from 'mongoose';

export const UserRole = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    googleId: { type: String, required: true, index: true, unique: true },
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

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const UserModel = mongoose.model('User', userSchema);

