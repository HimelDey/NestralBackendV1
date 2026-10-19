import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import User from "../auth/user.model";
import Property from "./property.model";
import Lease from "./lease.model";
import logger from "../../utils/logger";
import { leaseDocumentsRoot } from "../../config/multer.config";
import {
  buildLeaseDocumentMetadata,
  deleteLeaseDocumentUploads,
} from "../../utils/lease-document-storage";

interface CreateLeaseInput {
  propertyId: string;
  ownerId: string;
  phoneNumber: string;
  startDate: Date;
  endDate: Date;
  refundableSecurityDeposit: number;
  monthlyRent: number;
  documents?: Express.Multer.File[];
}

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class TenantOnboardService {
  async searchTenant(phoneNumber: string): Promise<Record<string, unknown> | null> {
    const [user] = await User.find({
      phoneNumber: { $regex: `^${escapeRegex(phoneNumber)}$` },
      roles: "tenant",
    })
      .select("_id phoneNumber firstName lastName profileImageUrl roles")
      .limit(1)
      .lean();

    if (!user) return null;

    return {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      ...(user.firstName ? { firstName: user.firstName } : {}),
      ...(user.lastName ? { lastName: user.lastName } : {}),
      ...(user.profileImageUrl ? { profileImageUrl: user.profileImageUrl } : {}),
      roles: user.roles,
    };
  }

  async createLease(input: CreateLeaseInput): Promise<Record<string, unknown>> {
    const files = input.documents ?? [];
    let leaseCreated = false;

    try {
      const documents = await buildLeaseDocumentMetadata(files);
      return await this.createLeaseRecord(input, documents, () => {
        leaseCreated = true;
      });
    } catch (error) {
      if (!leaseCreated && files.length > 0) {
        try {
          await deleteLeaseDocumentUploads(files);
        } catch (cleanupError) {
          throw new Error(
            `Lease creation failed: ${(error as Error).message}. ${(
              cleanupError as Error
            ).message}`,
          );
        }
      }
      throw error;
    }
  }

  private async createLeaseRecord(
    input: CreateLeaseInput,
    documents: Awaited<ReturnType<typeof buildLeaseDocumentMetadata>>,
    onLeaseCreated: () => void,
  ): Promise<Record<string, unknown>> {
    const property = await Property.findOne({
      _id: input.propertyId,
      ownerId: input.ownerId,
    });
    if (!property) {
      throw new Error("Property not found or unauthorized");
    }

    let tenant = await User.findOneAndUpdate(
      { phoneNumber: input.phoneNumber },
      { $setOnInsert: { phoneNumber: input.phoneNumber } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    if (!tenant) {
      throw new Error("Tenant could not be found or created");
    }

    const tenantActiveLease = await Lease.findOne({
      tenantId: tenant._id,
      status: "active",
    });
    const propertyActiveLease = await Lease.findOne({
      propertyId: property._id,
      status: "active",
    });
    const leasesToEnd: Array<NonNullable<typeof tenantActiveLease>> = [];
    if (tenantActiveLease) leasesToEnd.push(tenantActiveLease);
    if (
      propertyActiveLease &&
      !leasesToEnd.some(
        (existingLease) =>
          existingLease._id.toString() === propertyActiveLease._id.toString(),
      )
    ) {
      leasesToEnd.push(propertyActiveLease);
    }

    const endedAt = new Date();
    const endedLeases: Array<NonNullable<typeof tenantActiveLease>> = [];
    try {
      for (const existingLease of leasesToEnd) {
        const endResult = await Lease.updateOne(
          { _id: existingLease._id, status: "active" },
          { $set: { status: "ended", endedAt } },
        );
        if (endResult.modifiedCount !== 1) {
          throw new Error("Tenant assignment changed concurrently; please retry");
        }
        endedLeases.push(existingLease);
      }
    } catch (endError) {
      const restored = await this.restoreActiveLeases(endedLeases, endedAt);
      if (!restored) {
        throw new Error(
          `Tenant reassignment failed and one or more previous active leases could not be restored: ${(endError as Error).message}`,
        );
      }
      throw endError;
    }

    const lease = new Lease({
      propertyId: property._id,
      tenantId: tenant._id,
      startDate: input.startDate,
      endDate: input.endDate,
      refundableSecurityDeposit: input.refundableSecurityDeposit,
      monthlyRent: input.monthlyRent,
      status: "active",
      invitationStatus: "not_sent",
      documents,
    });

    try {
      await lease.save();
      onLeaseCreated();
    } catch (creationError) {
      const restored = await this.restoreActiveLeases(endedLeases, endedAt);
      if (!restored) {
        throw new Error(
          `Lease creation failed and one or more previous active leases could not be restored: ${(creationError as Error).message}`,
        );
      }
      throw creationError;
    }

    const roleUpdate = await User.updateOne(
      { _id: tenant._id },
      { $addToSet: { roles: "tenant" } },
    );
    if (roleUpdate.matchedCount !== 1) {
      throw new Error("Lease was created, but the tenant role could not be assigned");
    }

    const savedLease = await Lease.findById(lease._id)
      .populate({
        path: "tenantId",
        select: "phoneNumber firstName lastName profileImageUrl roles",
      })
      .lean();
    if (!savedLease) {
      throw new Error("Created lease could not be retrieved");
    }

    const populatedTenant = savedLease.tenantId as unknown as {
      _id: mongoose.Types.ObjectId;
      phoneNumber: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string | null;
      roles: string[];
    };

    return {
      id: savedLease._id.toString(),
      propertyId: savedLease.propertyId.toString(),
      tenant: {
        id: populatedTenant._id.toString(),
        phoneNumber: populatedTenant.phoneNumber,
        ...(populatedTenant.firstName ? { firstName: populatedTenant.firstName } : {}),
        ...(populatedTenant.lastName ? { lastName: populatedTenant.lastName } : {}),
        ...(populatedTenant.profileImageUrl
          ? { profileImageUrl: populatedTenant.profileImageUrl }
          : {}),
        roles: populatedTenant.roles,
      },
      startDate: savedLease.startDate,
      endDate: savedLease.endDate,
      refundableSecurityDeposit: savedLease.refundableSecurityDeposit,
      monthlyRent: savedLease.monthlyRent,
      status: savedLease.status,
      invitationStatus: savedLease.invitationStatus,
      invitationSentAt: savedLease.invitationSentAt,
      documents: savedLease.documents.map((document) => ({
        id: document._id?.toString(),
        originalName: document.originalName,
        contentType: document.contentType,
        size: document.size,
        uploadedAt: document.uploadedAt,
        url: `${(process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/v1/owner/leases/${savedLease._id.toString()}/documents/${document._id?.toString()}`,
      })),
      createdAt: savedLease.createdAt,
      updatedAt: savedLease.updatedAt,
    };
  }

  private async restoreActiveLeases(
    leases: Array<NonNullable<Awaited<ReturnType<typeof Lease.findOne>>>>,
    endedAt: Date,
  ): Promise<boolean> {
    let restored = true;
    for (const lease of leases) {
      try {
        const result = await Lease.updateOne(
          { _id: lease._id, status: "ended", endedAt },
          { $set: { status: "active" }, $unset: { endedAt: 1 } },
        );
        if (result.modifiedCount !== 1) {
          restored = false;
          logger.error(
            `Could not restore previous lease ${lease._id} after lease reassignment failed`,
          );
        }
      } catch (error) {
        restored = false;
        logger.error(
          `Could not restore previous lease ${lease._id}: ${(error as Error).message}`,
        );
      }
    }
    return restored;
  }
}

export default new TenantOnboardService();