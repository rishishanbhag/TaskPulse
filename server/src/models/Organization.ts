import mongoose, { type InferSchemaType } from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 80, unique: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema> & { _id: mongoose.Types.ObjectId };

export const OrganizationModel = mongoose.model('Organization', organizationSchema);

