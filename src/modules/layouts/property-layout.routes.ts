import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { propertyOwnerMiddleware } from '../../middlewares/property-owner.middleware';
import PropertyLayoutController from './property-layout.controller';

const router = Router();

router.use(authMiddleware);
router.use(propertyOwnerMiddleware);

router.get('/:propertyId', PropertyLayoutController.getLayout);

export default router;