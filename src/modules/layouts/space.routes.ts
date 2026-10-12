import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import SpaceController from './space.controller';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/:propertyId/spaces', SpaceController.createSpace);
router.get('/:propertyId/spaces', SpaceController.getSpacesByProperty);
router.get('/:propertyId/spaces/:spaceId', SpaceController.getSpaceById);
router.patch('/:propertyId/spaces/:spaceId', SpaceController.updateSpace);
router.delete('/:propertyId/spaces/:spaceId', SpaceController.deleteSpace);

export default router;
