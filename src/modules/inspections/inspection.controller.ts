import { Request, Response, NextFunction } from 'express';
import InspectionService from './inspection.service';

class InspectionController {
    /**
     * Helper to safely extract ID from params (handle string | string[])
     */
    private static extractId(id: string | string[]): string {
        return Array.isArray(id) ? id[0] : id;
    }

    /**
     * Create a new inspection
     */
    async createInspection(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const inspection = await InspectionService.createInspection(req.body, userId);
            res.status(201).json({
                success: true,
                data: inspection,
                message: 'Inspection created successfully'
            });
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Get all inspections with filters
     */
    async getAllInspections(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await InspectionService.getAllInspections(req.query, req);
            console.log('getAllInspections result:', result); // Debugging line
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single inspection by ID
     */
    async getInspectionById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = InspectionController.extractId(req.params.id);
            const inspection = await InspectionService.getInspectionById(id);
            res.status(200).json({
                success: true,
                data: inspection
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an inspection
     */
    async updateInspection(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const id = InspectionController.extractId(req.params.id);
            const inspection = await InspectionService.updateInspection(id, req.body, userId);
            res.status(200).json({
                success: true,
                data: inspection,
                message: 'Inspection updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Manually cancel an inspection
     */
    async cancelInspection(req: Request, res: Response, next: NextFunction) {
        try {
            const id = InspectionController.extractId(req.params.id);
            const inspection = await InspectionService.cancelInspection(id);
            res.status(200).json({
                success: true,
                data: inspection,
                message: 'Inspection cancelled successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Manually mark an inspection as completed
     */
    async completeInspection(req: Request, res: Response, next: NextFunction) {
        try {
            const id = InspectionController.extractId(req.params.id);
            const inspection = await InspectionService.completeInspection(id);
            res.status(200).json({
                success: true,
                data: inspection,
                message: 'Inspection completed successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete an inspection
     */
    async deleteInspection(req: Request, res: Response, next: NextFunction) {
        try {
            const id = InspectionController.extractId(req.params.id);
            await InspectionService.deleteInspection(id);
            res.status(200).json({
                success: true,
                message: 'Inspection deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get inspections by property
     */
    async getInspectionsByProperty(req: Request, res: Response, next: NextFunction) {
        try {
            const propertyId = InspectionController.extractId(req.params.propertyId);
            const { limit } = req.query;

            const inspections = await InspectionService.getInspectionsByProperty(
                propertyId,
                limit ? parseInt(limit as string) : 10
            );

            res.status(200).json({
                success: true,
                data: inspections
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Inspection create page — page load (properties + inspection types)
     */
    async getFormData(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const data = await InspectionService.getFormData(ownerId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Inspection create page — inspectors for a selected property
     */
    async getFormDataInspectors(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId    = (req as any).user?.id;
            const propertyId = req.query.propertyId as string;

            if (!ownerId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            if (!propertyId) {
                return res.status(400).json({ success: false, message: 'propertyId query param is required' });
            }

            const data = await InspectionService.getFormDataInspectors(propertyId, ownerId);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add a comment to an inspection
     */
    async addInspectionComment(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }

            const inspectionId = InspectionController.extractId(req.params.id);
            const message = req.body?.message ?? req.body?.comment;

            const data = await InspectionService.addInspectionComment(inspectionId, userId, message);

            res.status(201).json({
                success: true,
                data,
                message: 'Inspection comment added successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get comments for an inspection
     */
    async getInspectionComments(req: Request, res: Response, next: NextFunction) {
        try {
            const inspectionId = InspectionController.extractId(req.params.id);
            const comments = await InspectionService.getInspectionComments(inspectionId);

            res.status(200).json({
                success: true,
                data: comments
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InspectionController();
