import mongoose, { Schema } from "mongoose";
import { ILease, ILeaseDocument } from "../../interfaces/lease.interface";

const LeaseDocumentSchema = new Schema<ILeaseDocument>(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"],
      required: true,
    },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, required: true },
  },
  { _id: true },
);

const LeaseSchema = new Schema<ILease>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    refundableSecurityDeposit: { type: Number, required: true, min: 0 },
    monthlyRent: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
      required: true,
    },
    endedAt: { type: Date, default: null },
    invitationStatus: {
      type: String,
      enum: ["not_sent", "sent", "failed"],
      default: "not_sent",
      required: true,
    },
    invitationSentAt: { type: Date, default: null },
    documents: {
      type: [LeaseDocumentSchema],
      default: [],
      validate: {
        validator: (documents: ILeaseDocument[]) => documents.length <= 10,
        message: "A lease can contain at most 10 documents",
      },
    },
  },
  { timestamps: true },
);

LeaseSchema.index(
  { tenantId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "one_active_lease_per_tenant",
  },
);
LeaseSchema.index(
  { propertyId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "one_active_lease_per_property",
  },
);

export default mongoose.model<ILease>("Lease", LeaseSchema);
