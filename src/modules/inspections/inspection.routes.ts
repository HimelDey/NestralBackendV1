import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { inspectionUpload } from '../../config/multer.config';
import InspectionController from './inspection.controller';
import InspectionElementRecordController from './inspection-element-record.controller';

const router = Router();

router.use(authMiddleware);

router.get('/form-data', InspectionController.getFormData);
router.get('/form-data/inspectors', InspectionController.getFormDataInspectors);

router.get('/:inspectionId/checklist', InspectionElementRecordController.getChecklist);
router.get('/:inspectionId/progress', InspectionElementRecordController.getProgress);
router.post('/:inspectionId/report/submit', InspectionElementRecordController.submitReport);
router.get('/:inspectionId/spaces/:spaceId/elements', InspectionElementRecordController.getSpaceElements);
router.patch('/:inspectionId/elements/:elementId', InspectionElementRecordController.updateInspectionElement);
router.get('/:inspectionId/elements/:elementId/photos', InspectionElementRecordController.getPhotos);
router.post(
    '/:inspectionId/elements/:elementId/photos',
    inspectionUpload.array('photos', 10),
    InspectionElementRecordController.uploadPhotos
);
router.post(
    '/photos/:photoId/self-comment',  
    InspectionElementRecordController.addCommentToSpecificPhoto
);
router.delete(
    '/:inspectionId/elements/:elementId/photos/:photoId',
    InspectionElementRecordController.deletePhoto
);

router.get(
    '/:inspectionId/set-status-ongoing',
    InspectionElementRecordController.setStatusOngoing
);

router.post('/:id/comments', InspectionController.addInspectionComment);
router.get('/:id/comments', InspectionController.getInspectionComments);

router.post('/', InspectionController.createInspection);
router.get('/', InspectionController.getAllInspections);
router.get('/property/:propertyId', InspectionController.getInspectionsByProperty);
router.get('/:id', InspectionController.getInspectionById);
router.put('/:id', InspectionController.updateInspection);
router.delete('/:id', InspectionController.deleteInspection);

router.patch('/:id/cancel', InspectionController.cancelInspection);
router.patch('/:id/complete', InspectionController.completeInspection);

export default router;