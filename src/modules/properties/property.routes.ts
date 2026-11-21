import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadMultiple, uploadPropertyDocuments } from '../../config/multer.config';
import PropertyController from './property.controller';
import { propertyOwnerMiddleware } from '../../middlewares/property-owner.middleware';

const router = Router();

// All property routes require authentication
router.use(authMiddleware);

// Create a new property (with multiple images)
router.post('/', uploadMultiple.array('images', 10), PropertyController.propertyCreate);

router.use(propertyOwnerMiddleware);

// Get all properties
router.get('/', PropertyController.getPropertiesAll);

// Get property details with inspections (must be before generic /:id route)
router.get('/:id/details', PropertyController.getPropertyDetails);

// Upload and access property documents
router.post('/:id/documents', uploadPropertyDocuments, PropertyController.uploadDocuments);
router.get('/:id/documents/:documentId', PropertyController.downloadDocument);

// Get a single property by ID
router.get('/:id', PropertyController.getPropertyById);

// Update a property (with multiple images)
router.put('/:id', uploadMultiple.array('images', 10), PropertyController.updatePropertyById);

// Set primary image
router.put('/:id/primary-image', PropertyController.setPrimaryImage);

// Reorder images
router.put('/:id/reorder-images', PropertyController.reorderImages);

// Delete a property
router.delete('/:id', PropertyController.deletePropertyById);

export default router;
