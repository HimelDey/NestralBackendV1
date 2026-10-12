import { Request, Response } from 'express';
import ElementService from './element.service';
import { deleteLayoutImagesByFilename } from '../../utils/file-storage';

class ElementController {
    private static p(v: string | string[]): string {
        return Array.isArray(v) ? v[0] : v;
    }

    static async getElementsByProperty(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const propertyId = ElementController.p(req.params.propertyId);

            const elements = await ElementService.getElementsByProperty(propertyId, ownerId);
            res.json({ success: true, data: elements });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getElementsBySpace(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const spaceId = ElementController.p(req.params.spaceId);

            const elements = await ElementService.getElementsBySpace(spaceId, ownerId);
            res.json({ success: true, data: elements });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async addElement(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const spaceId = ElementController.p(req.params.spaceId);
            const { name } = req.body;
            const files = req.files as Express.Multer.File[] | undefined;

            if (!name?.trim()) {
                if (files?.length) deleteLayoutImagesByFilename(files.map(f => f.filename));
                return res.status(400).json({ success: false, message: 'Element name is required' });
            }

            const element = await ElementService.addElement(spaceId, ownerId, name.trim(), files);
            res.status(201).json({
                success: true,
                data: element,
                message: 'Element added successfully'
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async updateElement(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const elementId = ElementController.p(req.params.elementId);
            const { name } = req.body;
            const files = req.files as Express.Multer.File[] | undefined;

            if (!name?.trim()) {
                if (files?.length) deleteLayoutImagesByFilename(files.map(f => f.filename));
                return res.status(400).json({ success: false, message: 'Element name is required' });
            }

            const element = await ElementService.updateElement(elementId, ownerId, name.trim(), files);
            res.json({
                success: true,
                data: element,
                message: 'Element updated successfully'
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteElement(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const elementId = ElementController.p(req.params.elementId);

            await ElementService.deleteElement(elementId, ownerId);
            res.json({
                success: true,
                message: 'Element deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async uploadReferencePhotos(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const elementId = ElementController.p(req.params.elementId);
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one photo is required' });
            }

            const element = await ElementService.uploadReferencePhotos(elementId, ownerId, files);
            res.status(201).json({
                success: true,
                data: element,
                message: 'Reference photos uploaded successfully'
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async deleteReferencePhoto(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const elementId = ElementController.p(req.params.elementId);
            const photoId = ElementController.p(req.params.photoId);

            const element = await ElementService.deleteReferencePhoto(elementId, ownerId, photoId);
            res.json({
                success: true,
                data: element,
                message: 'Reference photo deleted successfully'
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default ElementController;