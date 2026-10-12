import { Request, Response } from 'express';
import PropertyLayoutService from './property-layout.service';

class PropertyLayoutController {
    private static p(v: string | string[]): string {
        return Array.isArray(v) ? v[0] : v;
    }

    static async getLayout(req: Request, res: Response) {
        try {
            const ownerId = (req as any).user?.id;
            const propertyId = PropertyLayoutController.p(req.params.propertyId);

            const layout = await PropertyLayoutService.getLayoutByProperty(propertyId, ownerId);
            res.json({ success: true, data: layout });
        } catch (error: any) {
            res.status(404).json({ success: false, message: error.message });
        }
    }
}

export default PropertyLayoutController;