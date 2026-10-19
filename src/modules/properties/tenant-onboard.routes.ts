import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { propertyOwnerMiddleware } from "../../middlewares/property-owner.middleware";
import { uploadLeaseDocuments } from "../../config/multer.config";
import TenantOnboardController from "./tenant-onboard.controller";

const router = Router();

router.use(authMiddleware, propertyOwnerMiddleware);
router.post("/tenants/search", TenantOnboardController.searchTenant);
router.post(
  "/properties/:propertyId/leases",
  uploadLeaseDocuments,
  TenantOnboardController.createLease,
);

export default router;