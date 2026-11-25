import { Request, Response, NextFunction } from 'express';
import AuthService from './auth.service';
import { config } from '../../config';

class AuthController {

    async sendOtp(req: Request, res: Response) {
        const { phone } = req.body;
        if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'A valid phone number with country code is required' });
        }
        if (config.env === 'production') {
            return res.status(503).json({ success: false, message: 'OTP delivery is not configured' });
        }

        return res.status(200).json({ success: true, message: 'OTP sent successfully' });
    }

    async verifyOtp(req: Request, res: Response, next: NextFunction) {
        const { phone, otp } = req.body;
        if (typeof phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(phone)) {
            return res.status(400).json({ success: false, message: 'A valid phone number with country code is required' });
        }
        if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'OTP must be a 6-digit code' });
        }
        if (config.env === 'production') {
            return res.status(503).json({ success: false, message: 'OTP verification is not configured' });
        }

        try {
            const result = await AuthService.verifyOtp(phone, otp);
            if (!result) {
                return res.status(401).json({ success: false, message: 'Invalid OTP' });
            }
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async onboardClearance(req: Request, res: Response, next: NextFunction) {
        try {
            const { user_id } = req.body;
            if (typeof user_id !== 'string' || !/^[a-f\d]{24}$/i.test(user_id)) {
                return res.status(400).json({ success: false, message: 'A valid user_id is required' });
            }
            if ((req as any).user?.id !== user_id) {
                return res.status(403).json({ success: false, message: 'Not allowed to onboard another user' });
            }
            const user = await AuthService.completeOnboarding(user_id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Tenant not found' });
            }
            return res.status(200).json({ success: true, data: { id: user_id, isOnboarded: true } });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;
            const tokens = await AuthService.refreshTokens(refreshToken);
            res.status(200).json({ success: true, data: tokens });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) throw new Error('User not authenticated');
            await AuthService.logout(userId);
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    }

    async logoutAll(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) throw new Error('User not authenticated');
            await AuthService.logoutAll(userId);
            res.status(200).json({ success: true, message: 'Logged out from all devices' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();
