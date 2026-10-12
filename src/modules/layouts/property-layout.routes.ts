import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import PropertyLayoutController from './property-layout.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:propertyId', PropertyLayoutController.getLayout);

export default router;