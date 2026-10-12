import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadMultiple } from '../../config/multer.config';
import PropertyController from './property.controller';

const router = Router();

// All property routes require authentication
router.use(authMiddleware);

// Create a new property (with multiple images)
router.post('/', uploadMultiple.array('images', 10), PropertyController.createProperty);

// Get all properties
router.get('/', PropertyController.getAllProperties);

// Get property details with inspections (must be before generic /:id route)
router.get('/:id/details', PropertyController.getPropertyDetails);

// Get a single property by ID
router.get('/:id', PropertyController.getPropertyById);

// Update a property (with multiple images)
router.put('/:id', uploadMultiple.array('images', 10), PropertyController.updateProperty);

// Set primary image
router.put('/:id/primary-image', PropertyController.setPrimaryImage);

// Reorder images
router.put('/:id/reorder-images', PropertyController.reorderImages);

// Delete a property
router.delete('/:id', PropertyController.deleteProperty);

export default router;
