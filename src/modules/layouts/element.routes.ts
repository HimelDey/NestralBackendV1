import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { layoutUpload } from '../../config/multer.config';
import ElementController from './element.controller';

const router = Router();

router.use(authMiddleware);

router.get('/properties/:propertyId/elements', ElementController.getElementsByProperty);
router.get('/spaces/:spaceId/elements', ElementController.getElementsBySpace);
router.post('/spaces/:spaceId/elements', layoutUpload.array('photos', 10), ElementController.addElement);

router.put('/elements/:elementId', layoutUpload.array('photos', 10), ElementController.updateElement);
router.delete('/elements/:elementId', ElementController.deleteElement);

router.post('/elements/:elementId/reference-photos', layoutUpload.array('photos', 10), ElementController.uploadReferencePhotos);
router.delete('/elements/:elementId/reference-photos/:photoId', ElementController.deleteReferencePhoto);

export default router;