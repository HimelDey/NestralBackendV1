import { Request, Response, NextFunction } from 'express';
import PropertyService from './property.service';

class PropertyController {
    /**
     * Create a new property
     */
    async createProperty(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const imageFiles = (req as any).files as Express.Multer.File[] | undefined;
            const bodyData = { ...req.body };
            delete bodyData.images; // strip raw images field; actual images come from uploaded files
            const property = await PropertyService.createProperty(bodyData, ownerId, imageFiles);
            res.status(201).json({ success: true, data: property });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all properties for the authenticated user
     */
    async getAllProperties(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const status = req.query.status as string | undefined;
            const validStatuses = ['active', 'inactive', 'rented', 'archived', 'pending'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
                });
            }
            
            const properties = await PropertyService.getAllProperties(ownerId, status);
            
            res.status(200).json({ success: true, data: properties });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single property by ID
     */
    async getPropertyById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const property = await PropertyService.getPropertyById(id, ownerId);
            res.status(200).json({ success: true, data: property });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a property
     */
    async updateProperty(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const imageFiles = (req as any).files as Express.Multer.File[] | undefined;
            
            // Parse imagesToDelete from body (sent as JSON string)
            const imagesToDelete = req.body.imagesToDelete 
                ? JSON.parse(req.body.imagesToDelete) 
                : [];
            
            const updateData = { ...req.body };
            delete updateData.imagesToDelete; // Remove from updates object
            delete updateData.images; // strip raw images field; actual images come from uploaded files

            const property = await PropertyService.updateProperty(id, updateData, ownerId, imageFiles, imagesToDelete);
            res.status(200).json({ success: true, data: property });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a property
     */
    async deleteProperty(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            await PropertyService.deleteProperty(id, ownerId);
            res.status(200).json({ success: true, message: 'Property deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get property details with inspections (for task section)
     

    /**
     * Set primary image
     */
    async setPrimaryImage(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            const { imageId } = req.body;

            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            if (!imageId) {
                return res.status(400).json({ success: false, message: 'imageId is required' });
            }

            const property = await PropertyService.setPrimaryImage(id, ownerId, imageId);
            res.status(200).json({ 
                success: true, 
                data: property, 
                message: 'Primary image updated successfully' 
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reorder images
     */
    async reorderImages(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            const { imageOrder } = req.body;

            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            if (!imageOrder || !Array.isArray(imageOrder)) {
                return res.status(400).json({ success: false, message: 'imageOrder array is required' });
            }

            const property = await PropertyService.reorderImages(id, ownerId, imageOrder);
            res.status(200).json({ 
                success: true, 
                data: property, 
                message: 'Images reordered successfully' 
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get property details with inspections (for task section)
     */
    async getPropertyDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const ownerId = (req as any).user?.id;
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const propertyDetails = await PropertyService.getPropertyDetails(id, ownerId);
            res.status(200).json({ success: true, data: propertyDetails });
        } catch (error) {
            next(error);
        }
    }

}

export default new PropertyController();
