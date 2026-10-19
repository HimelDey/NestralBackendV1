import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import TenantOnboardService from "./tenant-onboard.service";
import {
  deleteLeaseDocumentUploads,
  LeaseDocumentValidationError,
} from "../../utils/lease-document-storage";

const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

class TenantOnboardController {
  async searchTenant(req: Request, res: Response, next: NextFunction) {
    const { phoneNumber } = req.body;
    if (
      typeof phoneNumber !== "string" ||
      !PHONE_NUMBER_PATTERN.test(phoneNumber.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number with country code is required",
      });
    }

    try {
      const tenant = await TenantOnboardService.searchTenant(phoneNumber.trim());
      return res.status(200).json({ success: true, data: tenant });
    } catch (error) {
      return next(error);
    }
  }

  async createLease(req: Request, res: Response, next: NextFunction) {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const rejectInvalidRequest = async (
      message: string,
      status = 400,
    ) => {
      try {
        await deleteLeaseDocumentUploads(files);
        return res.status(status).json({ success: false, message });
      } catch (error) {
        return next(error);
      }
    };
    const propertyId = Array.isArray(req.params.propertyId)
      ? req.params.propertyId[0]
      : req.params.propertyId;
    const ownerId = (req as any).user?.id;
    if (!req.body || typeof req.body !== "object") {
      return rejectInvalidRequest(
        "Request fields were not parsed. Send the request as multipart/form-data and let the client set the Content-Type boundary.",
      );
    }
    const {
      phoneNumber,
      startDate,
      endDate,
      refundableSecurityDeposit,
      monthlyRent,
    } = req.body;

    if (!mongoose.isValidObjectId(propertyId)) {
      return rejectInvalidRequest("A valid propertyId is required");
    }
    if (typeof phoneNumber !== "string" || !PHONE_NUMBER_PATTERN.test(phoneNumber.trim())) {
      return rejectInvalidRequest(
        "A valid phone number with country code is required",
      );
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    if (
      typeof startDate !== "string" ||
      Number.isNaN(parsedStartDate.getTime()) ||
      typeof endDate !== "string" ||
      Number.isNaN(parsedEndDate.getTime()) ||
      parsedStartDate > parsedEndDate
    ) {
      return rejectInvalidRequest(
        "Valid startDate and endDate are required, and startDate must not be after endDate",
      );
    }
    const parsedDeposit =
      typeof refundableSecurityDeposit === "number"
        ? refundableSecurityDeposit
        : typeof refundableSecurityDeposit === "string" &&
            refundableSecurityDeposit.trim() !== ""
          ? Number(refundableSecurityDeposit)
          : Number.NaN;
    if (
      !Number.isFinite(parsedDeposit) ||
      parsedDeposit < 0
    ) {
      return rejectInvalidRequest(
        "refundableSecurityDeposit must be a non-negative number",
      );
    }
    const parsedMonthlyRent =
      typeof monthlyRent === "number"
        ? monthlyRent
        : typeof monthlyRent === "string" && monthlyRent.trim() !== ""
          ? Number(monthlyRent)
          : Number.NaN;
    if (
      !Number.isFinite(parsedMonthlyRent) ||
      parsedMonthlyRent <= 0
    ) {
      return rejectInvalidRequest("monthlyRent must be a positive number");
    }
    if (!ownerId) {
      return rejectInvalidRequest("User not authenticated", 401);
    }

    try {
      const lease = await TenantOnboardService.createLease({
        propertyId,
        ownerId,
        phoneNumber: phoneNumber.trim(),
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        refundableSecurityDeposit: parsedDeposit,
        monthlyRent: parsedMonthlyRent,
        documents: files,
      });
      return res.status(201).json({ success: true, data: lease });
    } catch (error) {
      if (error instanceof LeaseDocumentValidationError) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return next(error);
    }
  }
}

export default new TenantOnboardController();