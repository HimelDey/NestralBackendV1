import { Request, Response, NextFunction } from 'express';
import SpaceService from './space.service';

class SpaceController {
    private static p(v: string | string[]): string {
        return Array.isArray(v) ? v[0] : v;
    }

    async createSpace(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const propertyId = SpaceController.p(req.params.propertyId);
            const { name, layoutId } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }
            if (!layoutId) {
                return res.status(400).json({ success: false, message: 'Layout ID is required' });
            }

            const data = await SpaceService.createSpace(propertyId, layoutId, ownerId, name);

            res.status(201).json({
                success: true,
                data,
                message: 'Space created successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getSpacesByProperty(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const propertyId = SpaceController.p(req.params.propertyId);

            const data = await SpaceService.getSpacesByProperty(propertyId, ownerId);

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async getSpaceById(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const spaceId = SpaceController.p(req.params.spaceId);

            const data = await SpaceService.getSpaceById(spaceId, ownerId);

            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }

    async updateSpace(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const spaceId = SpaceController.p(req.params.spaceId);

            const data = await SpaceService.updateSpace(spaceId, ownerId, req.body);

            res.status(200).json({
                success: true,
                data,
                message: 'Space updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteSpace(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const spaceId = SpaceController.p(req.params.spaceId);

            await SpaceService.deleteSpace(spaceId, ownerId);

            res.status(200).json({
                success: true,
                message: 'Space deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new SpaceController();
