import { Document, Types } from "mongoose";

export type LeaseStatus = "active" | "ended";
export type LeaseInvitationStatus = "not_sent" | "sent" | "failed";

export interface ILeaseDocument {
  _id?: Types.ObjectId;
  storageKey: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

export interface ILease extends Document {
  propertyId: Types.ObjectId;
  tenantId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  refundableSecurityDeposit: number;
  monthlyRent: number;
  status: LeaseStatus;
  endedAt?: Date;
  invitationStatus: LeaseInvitationStatus;
  invitationSentAt?: Date | null;
  documents: ILeaseDocument[];
  createdAt: Date;
  updatedAt: Date;
}
