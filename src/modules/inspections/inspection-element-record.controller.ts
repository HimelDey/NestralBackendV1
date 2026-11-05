import { Request, Response, NextFunction } from 'express';
import InspectionElementRecordService from './inspection-element-record.service';
import { deleteInspectionImagesByFilename } from '../../utils/file-storage';

class InspectionElementRecordController {
    private static p(v: string | string[]): string {
        return Array.isArray(v) ? v[0] : v;
    }

    async getChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);

            const data = await InspectionElementRecordService.getChecklist(inspectionId, ownerId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async getSpaceElements(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const spaceId = InspectionElementRecordController.p(req.params.spaceId);

            const data = await InspectionElementRecordService.getSpaceElements(
                inspectionId,
                spaceId,
                ownerId
            );

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async updateInspectionElement(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const elementId = InspectionElementRecordController.p(req.params.elementId);

            const data = await InspectionElementRecordService.updateInspectionElement(
                inspectionId,
                elementId,
                ownerId,
                req.body
            );

            res.status(200).json({
                success: true,
                data,
                message: 'Inspection element updated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async getPhotos(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const elementId = InspectionElementRecordController.p(req.params.elementId);

            const data = await InspectionElementRecordService.getPhotos(
                inspectionId,
                elementId,
                ownerId
            );

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async uploadPhotos(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const elementId = InspectionElementRecordController.p(req.params.elementId);
            const files = (req.files as Express.Multer.File[]) || [];
            const comment = req.body?.comment as string | undefined;

            const data = await InspectionElementRecordService.uploadPhotos(
                inspectionId,
                elementId,
                ownerId,
                files,
                comment
            );

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            const files = req.files as Express.Multer.File[] | undefined;
            if (files?.length) {
                deleteInspectionImagesByFilename(files.map(f => f.filename));
            }
            next(error);
        }
    }

    async getProgress(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);

            const data = await InspectionElementRecordService.getProgress(inspectionId, ownerId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async submitReport(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);

            const data = await InspectionElementRecordService.submitReport(inspectionId, ownerId);

            res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    async deletePhoto(req: Request, res: Response, next: NextFunction) {
        try {
            const ownerId = (req as any).user?.id;
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const elementId = InspectionElementRecordController.p(req.params.elementId);
            const photoId = InspectionElementRecordController.p(req.params.photoId);

            const data = await InspectionElementRecordService.deletePhoto(
                inspectionId,
                elementId,
                photoId,
                ownerId
            );

            res.status(200).json({
                success: true,
                data,
                message: 'Inspection photo deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async addCommentToSpecificPhoto(req: Request, res: Response, next: NextFunction) {
        try {
            
            const photoId = InspectionElementRecordController.p(req.params.photoId);
            const comment = req.body?.selfComment as string | undefined;

            const data = await InspectionElementRecordService.addCommentToSpecificPhoto(
                photoId,
                comment,
            );

            res.status(200).json({
                success: true,
                data,
                message: 'Comment added to inspection photo successfully'
            });
        } catch (error) {
            next(error);
        }
    }   

    async setStatusOngoing(req: Request, res: Response, next: NextFunction) {
        try {
            const inspectionId = InspectionElementRecordController.p(req.params.inspectionId);
            const data = await InspectionElementRecordService.setStatusOngoing(inspectionId);

            res.status(200).json({
                success: true,
                data,
                message: 'Inspection status updated to ongoing successfully'
            });
        }catch (error) {
            next(error);
        }
    }
}

export default new InspectionElementRecordController();