import { authMiddleware } from './../../middlewares/auth.middleware';
import { Router } from 'express';
import AuthController from './auth.controller';

const router = Router();

router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/refresh',  authMiddleware, AuthController.refresh);
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);
export default router;
